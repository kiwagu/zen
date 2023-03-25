import { Module } from '@nestjs/common';

import { loggerInterceptor, LoggerModule, RabbitMqWithBodyParser } from '@zen/logger';
import { environment } from '../environments/environment';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config';
import { MailModule } from './mail';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({ serviceName: environment.serviceName, interceptor: { rpc: RabbitMqWithBodyParser } }),
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService, loggerInterceptor],
})
export class AppModule {}
