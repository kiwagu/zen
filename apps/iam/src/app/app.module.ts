import { Module } from '@nestjs/common';
import { LoggerModule, RabbitMqWithBodyParser, loggerInterceptor } from '@zen/logger';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule.forRoot({ serviceName: 'iam', interceptor: { rpc: RabbitMqWithBodyParser } }),
  ],
  controllers: [AppController],
  providers: [AppService, loggerInterceptor],
})
export class AppModule {}
