import path from 'path';

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '../config';
import { JwtModule } from '../jwt';
import { MailService } from './mail.service';

const templateDir = path.join(
  __dirname,
  process.env.NODE_ENV === 'test' ? '../..' : '',
  '/assets/mail'
);

@Module({
  imports: [
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
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
