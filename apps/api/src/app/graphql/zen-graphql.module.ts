import { ApolloDriver } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { OgmaModule } from '@ogma/nestjs-module';

import { ZenAuthModule } from '../auth';
import { ConfigModule } from '../config';
import { MailModule } from '../mail';
import { PrismaModule } from '../prisma';
import { GqlConfigService } from './gql-config.service';
import { NEST_RESOLVERS } from './resolvers';
import { AuthResolver } from './resolvers/Auth';

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
    OgmaModule.forFeature(AuthResolver),
  ],
  providers: [...NEST_RESOLVERS],
})
export class ZenGraphQLModule {}
