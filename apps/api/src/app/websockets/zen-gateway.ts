import { Logger, UseFilters } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { RequestUser } from '@zen/nest-auth';
import { Server, Socket } from 'socket.io';

import { environment } from '../../environments/environment';
import { AppAbility, AuthService } from '../auth';
import { AllExceptionsFilter } from './all-exceptions.filter';

type UserWithAbility = RequestUser & { ability: AppAbility };
const logger = new Logger('ZenGateway');

@WebSocketGateway(environment.socketio.port, {
  cors: environment.cors,
})
@UseFilters(new AllExceptionsFilter())
export class ZenGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  clientIdToUserMap = new Map<string, UserWithAbility>();
  userIdToClientsMap = new Map<RequestUser['id'], Socket[]>();

  constructor(private readonly auth: AuthService) {}

  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: unknown): void {
    const user = this.clientIdToUserMap.get(client.id);
    if (user) {
      logger.log(`msgToServer by ${user.id}`, payload);
      // Echo to all connected devices of user
      this.broadcastToUser(user.id, 'msgToClient', payload);
    }
  }

  /**
   * Emit to all connected devices for a given user
   */
  broadcastToUser(userId: RequestUser['id'], eventName: string, ...args: any[]) {
    const userClients = this.userIdToClientsMap.get(userId);
    if (userClients) {
      for (const client of userClients) {
        client.emit(eventName, args);
      }
    }
  }

  afterInit(server: Server) {
    logger.log('Initialized');
  }

  handleDisconnect(client: Socket) {
    const user = this.clientIdToUserMap.get(client.id);

    if (user) {
      const clients = this.userIdToClientsMap.get(user.id);

      if (clients) {
        const remainingClients = clients.filter(c => c !== client);

        if (remainingClients.length === 0) this.userIdToClientsMap.delete(user.id);
        else this.userIdToClientsMap.set(user.id, remainingClients);

        this.clientIdToUserMap.delete(client.id);

        logger.log(
          `Disconnected ${user.id} with ${remainingClients.length} connected devices remaining`
        );
      }
    }
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const token = client.handshake.headers.authorization?.substring(7);
      if (!token) throw new WsException('No authorization token provided');

      const requestUser = await this.auth.authorizeJwt(token);
      if (!requestUser) throw new WsException('JWT failed to authorize');

      const ability = await this.auth.createAbility(requestUser);
      const user: UserWithAbility = {
        ...requestUser,
        ability,
      };

      if (!user) throw new WsException('User not found');
      this.clientIdToUserMap.set(client.id, user);

      const userClients = this.userIdToClientsMap.get(user.id);
      if (!userClients || userClients.length === 0) {
        // Initialize user's client list
        this.userIdToClientsMap.set(user.id, [client]);
      } else {
        userClients.push(client);
      }

      logger.log(`Connected ${user.id} with client id ${client.id}`);
    } catch (error) {
      logger.error(error);
      client.disconnect();
      return;
    }
  }
}
