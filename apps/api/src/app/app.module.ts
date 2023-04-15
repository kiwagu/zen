import { Request } from 'express';
import { ClsModule } from 'nestjs-cls';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';

import { ClientRMQExt } from '@zen/nest-auth';
import { GqlWithBodyParser, LoggerModule, loggerInterceptor } from '@zen/logger';
import { PrismaModule } from '@zen/nest-api/prisma';

import { environment } from '../environments/environment';
import { ZenAuthModule } from './auth';
import { ConfigModule, ConfigService } from './config';
import { ToolsController } from './controllers';
import { ZenGraphQLModule } from './graphql';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: Request) => {
          // Put the jwt token to every request to store
          cls.set('token', req.header('Authorization'));
        },
      },
    }),
    LoggerModule.forRoot({
      serviceName: environment.serviceName,
      interceptor: { gql: GqlWithBodyParser },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.throttle,
    }),
    ConfigModule,
    ZenAuthModule,
    ZenGraphQLModule,
    ClientsModule.registerAsync([
      {
        name: 'IAM_SERVICE',
        useFactory: (config: ConfigService) => ({
          customClass: ClientRMQExt,
          transport: Transport.RMQ,
          options: {
            urls: [config.broker.url],
            queue: 'iam-queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    PrismaModule,
  ],
  controllers: [ToolsController],
  providers: [loggerInterceptor],
  exports: [ClientsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(graphqlUploadExpress(environment.graphql.uploads)).forRoutes('graphql');
  }
}
