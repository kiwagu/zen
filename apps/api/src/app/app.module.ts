import { Request } from 'express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { ClsModule } from 'nestjs-cls';

import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';

import { GqlWithBodyParser, loggerInterceptor, LoggerModule } from '@zen/logger';
import { PrismaModule } from '@zen/nest-api/prisma';

import { environment } from '../environments/environment';
import { ConfigModule, ConfigService } from './config';
import { ToolsController } from './controllers';
import { ZenGraphQLModule } from './graphql';
import { ClientRMQExt } from './libs/client-rmq-ext';
import { ZenAuthModule } from './auth';

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
    ClientsModule.register([
      {
        name: 'IAM_SERVICE',
        customClass: ClientRMQExt,
        options: {
          urls: ['amqp://rabbitmq:5672'],
          queue: 'iam-queue',
          queueOptions: {
            durable: true,
          },
        },
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
