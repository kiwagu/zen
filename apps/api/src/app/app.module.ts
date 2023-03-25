import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlWithBodyParser, LoggerModule, loggerInterceptor } from '@zen/logger';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

import { environment } from '../environments/environment';
import { ConfigModule, ConfigService } from './config';
import { ToolsController } from './controllers';
import { ZenGraphQLModule } from './graphql';
import { JwtModule } from './jwt';
import { PrismaModule } from './prisma';

@Global()
@Module({
  imports: [
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
    ZenGraphQLModule,
    JwtModule,
    ClientsModule.register([
      {
        name: 'IAM_SERVICE',
        transport: Transport.RMQ,
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
