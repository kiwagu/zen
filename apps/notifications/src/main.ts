import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggerService } from '@zen/logger';

import { AppModule } from './app/app.module';
import { ConfigModule, ConfigService } from './app/config';

async function bootstrap() {
  const config = await NestFactory.createApplicationContext(ConfigModule);
  const configService = config.get<ConfigService>(ConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.broker.url],
      queue: 'notifications-queue',
      queueOptions: {
        durable: true,
      },
    },
    bufferLogs: true,
  });
  const logger = app.get(LoggerService  , { strict: false });

  app.useLogger(logger);

  await config.close();
  await app.listen();

  Logger.log(`🚀 Notifications service is running`);
}

bootstrap();
