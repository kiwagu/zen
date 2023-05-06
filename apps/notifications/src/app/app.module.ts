import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { LoggerModule, RabbitMqWithBodyParser, loggerInterceptor } from '@zen/logger';

import { environment } from '../environments/environment';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from './config';
import { MailModule } from './mail';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      serviceName: environment.serviceName,
      interceptor: { rpc: RabbitMqWithBodyParser },
    }),
    MailModule,
    BullModule.forRootAsync({
      useFactory(config: ConfigService) {
        return {
          redis: {
            host: config.redis.host,
            port: config.redis.port,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [loggerInterceptor],
})
export class AppModule {}
