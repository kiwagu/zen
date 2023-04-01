import { Global, Module, Provider } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { LoggerModule, RabbitMqWithBodyParser, loggerInterceptor } from '@zen/logger';
import { NestAuthModule } from '@zen/nest-auth';
import { PrismaModule } from '@zen/nest-api/prisma';

import { environment } from '../environments/environment';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppCaslFactory } from './casl/casl.factory';
import { defaultFieldsProvider } from './casl/default-fields';
import { ConfigModule } from './config';
import { JwtModule } from './jwt';
import { UserModule } from './modules/user/user.module';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

const oauthProviders: Provider[] = [];
if (environment.oauth?.google?.clientID) oauthProviders.push(GoogleOAuthStrategy);

@Global()
@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      serviceName: environment.serviceName,
      interceptor: { rpc: RabbitMqWithBodyParser },
    }),
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
    UserModule,
  ],
  exports: [JwtModule, NestAuthModule, defaultFieldsProvider],
  controllers: [AppController],
  providers: [JwtStrategy, AppService, loggerInterceptor, defaultFieldsProvider, ...oauthProviders],
})
export class AppModule {}
