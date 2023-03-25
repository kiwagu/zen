import { ApolloDriver } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';

import { ZenAuthModule } from '../auth';
import { ConfigModule } from '../config';
import { MailModule } from '../mail';
import { PrismaModule } from '../prisma';
import { RpcExceptionFilter } from './filters/rpc-exceptions.filter';
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
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: RpcExceptionFilter,
    },
    ...NEST_RESOLVERS,
  ],
})
export class ZenGraphQLModule {}
