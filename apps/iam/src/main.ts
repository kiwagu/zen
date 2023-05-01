import './tracing';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app/app.module';
import { LoggerService } from '@zen/logger';
import { ConfigModule, ConfigService } from './app/config';

async function bootstrap() {
  const config = await NestFactory.createApplicationContext(ConfigModule);
  const configService = config.get<ConfigService>(ConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.broker.url],
      queue: 'iam-queue',
      queueOptions: {
        durable: true,
      },
    },
    bufferLogs: true,
  });
  const logger = app.get(LoggerService, { strict: false });

  app.useLogger(logger);

  await config.close();
  await app.listen();

  Logger.log(`🚀 IAM service is running`);
}

bootstrap();
