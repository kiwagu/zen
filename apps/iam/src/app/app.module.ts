import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { LoggerModule, RabbitMqWithBodyParser, loggerInterceptor } from '@zen/logger';
import { NestAuthModule } from '@zen/nest-auth';

import { environment } from '../environments/environment';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppCaslFactory } from './casl/casl.factory';
import { ConfigModule } from './config';
import { JwtModule } from './jwt';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({ serviceName: environment.serviceName, interceptor: { rpc: RabbitMqWithBodyParser } }),
    PrismaModule,
    NestAuthModule.register(AppCaslFactory),
    JwtModule,
    ClientsModule.register([
      {
        name: 'MAIL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://rabbitmq:5672'],
          queue: 'notifications-queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, loggerInterceptor],
})
export class AppModule {}
