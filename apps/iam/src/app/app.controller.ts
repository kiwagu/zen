import { Controller } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { ApiError, RpcError } from '@zen/common';
import { RequestUser } from '@zen/nest-auth';
import { bcryptVerify } from 'hash-wasm';

import { AppService } from './app.service';
import { AccountInfo } from './models/account-info';
import { AuthLoginInput } from './models/auth-login-input';
import { PrismaService } from './prisma';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}

  @MessagePattern({ cmd: 'authLogin' })
  async authLogin(args: AuthLoginInput) {
    const user = await this.appService.getUserByUsername(args.username, this.prisma);

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    // TODO: Too slow! Takes about 500 msec :O
    const correctPassword = await bcryptVerify({
      password: args.password,
      hash: user.password as string,
    });

    if (!correctPassword) {
      throw new RpcException({
        response: ApiError.AuthLogin.INCORRECT_PASSWORD,
        status: 400,
        message: 'Incorrect password',
        name: RpcException.name,
      } as RpcError);
    }

    return this.appService.getAuthSession(user, args.rememberMe);
  }

  @MessagePattern({ cmd: 'accountInfo' })
  async accountInfo(args: RequestUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: args.id },
    });

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    return {
      username: user.username,
      hasPassword: !!user.password,
      googleProfile: user.googleProfile as AccountInfo['googleProfile'],
    };
  }
}
