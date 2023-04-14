import { ApolloDriver } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';

import { PrismaModule } from '@zen/nest-api/prisma';

import { ConfigModule } from '../config';
import { RpcExceptionFilter } from './filters/rpc-exceptions.filter';
import { GqlConfigService } from './gql-config.service';
import { NEST_RESOLVERS } from './resolvers';
import { defaultFieldsProvider } from './default-fields';

@Global()
@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      useClass: GqlConfigService,
      imports: [PrismaModule, ConfigModule],
    }),
  ],
  providers: [
    defaultFieldsProvider,
    {
      provide: APP_FILTER,
      useClass: RpcExceptionFilter,
    },
    ...NEST_RESOLVERS,
  ],
})
export class ZenGraphQLModule {}
