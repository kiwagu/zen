import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app/app.module';
import { LoggerService } from '@zen/logger';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'zen-queue',
      queueOptions: {
        durable: true,
      },
    },
    bufferLogs: true,
  });
  const logger = app.get(LoggerService, { strict: false });

  app.useLogger(logger);

  await app.listen();

  Logger.log(`🚀 IAM service is running`);
}

bootstrap();
