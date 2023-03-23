import { Module } from '@nestjs/common';
import { LoggerModule, RabbitMqWithBodyParser, loggerInterceptor } from '@zen/logger';
import { NestAuthModule } from '@zen/nest-auth';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppCaslFactory } from './casl/casl.factory';
import { ConfigModule } from './config';
import { JwtModule } from './jwt';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({ serviceName: 'iam', interceptor: { rpc: RabbitMqWithBodyParser } }),
    PrismaModule,
    NestAuthModule.register(AppCaslFactory),
    JwtModule,
  ],
  controllers: [AppController],
  providers: [AppService, loggerInterceptor],
})
export class AppModule {}
