import { Module } from '@nestjs/common';

import { LoggerModule, RabbitMqWithBodyParser, loggerInterceptor } from '@zen/logger';
import { PrismaModule } from '@zen/nest-api/prisma';

import { environment } from '../../../environments/environment';
import { ConfigModule } from '../../config';
import { UserController } from './user.controller';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      serviceName: environment.serviceName,
      interceptor: { rpc: RabbitMqWithBodyParser },
    }),
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [loggerInterceptor],
})
export class UserModule {}
