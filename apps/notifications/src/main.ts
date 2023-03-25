import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggerService } from '@zen/logger';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://rabbitmq:5672'],
      queue: 'notifications-queue',
      queueOptions: {
        durable: true,
      },
    },
    bufferLogs: true,
  });
  const logger = app.get(LoggerService  , { strict: false });

  app.useLogger(logger);

  await app.listen();

  Logger.log(`🚀 Notifications service is running`);
}

bootstrap();
