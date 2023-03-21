import { ApolloDriver } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ZenAuthModule } from '../auth';
import { ConfigModule } from '../config';
import { MailModule } from '../mail';
import { PrismaModule } from '../prisma';
import { GqlConfigService } from './gql-config.service';
import { NEST_RESOLVERS } from './resolvers';

@Global()
@Module({
  imports: [
    ZenAuthModule,
    MailModule,
    PrismaModule,
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      useClass: GqlConfigService,
      imports: [PrismaModule, ConfigModule],
    }),
    ClientsModule.register([
      {
        name: 'GATEWAY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'zen-queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [...NEST_RESOLVERS],
})
export class ZenGraphQLModule {}
