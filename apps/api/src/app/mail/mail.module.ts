import path from 'path';

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '../config';
import { JwtModule } from '../jwt';
import { MailService } from './mail.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
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
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        ...config.mail,

        template: {
          dir: path.join(__dirname, 'assets/mail'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
