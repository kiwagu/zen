import path from 'path';
import { MailerModule } from '@nestjs-modules/mailer';

import { BullModule } from '@nestjs/bull';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '../config';
import { JwtModule } from '../jwt';
import { MailService } from './mail.service';
import { MailConsumer } from './mail.consumer';
import { MAIL_QUEUE } from './mail.constant';

const templateDir = path.join(
  __dirname,
  process.env.NODE_ENV === 'test' ? '../..' : '',
  '/assets/mail'
);

@Module({
  imports: [
    BullModule.registerQueue({ name: MAIL_QUEUE.NAME }),
    JwtModule,
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        ...config.mail,
        template: {
          dir: templateDir,
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
  providers: [MailService, MailConsumer],
  exports: [MailService],
})
export class MailModule {}
