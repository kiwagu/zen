import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { ConfigService } from '../config';
import { JwtService } from '../jwt';
import { User } from '../prisma';
import { GeneralContext } from './contexts';

type MailOptions = ISendMailOptions & { template?: string };

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_SERVICE') private client: ClientProxy,
    private readonly mailer: MailerService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}
  //--------------------------------------------------------------------------
  send(options: MailOptions) {
    Logger.log(`Sent ${options.template} email to ${options.to}`);
    return this.mailer.sendMail(options).catch(e => Logger.error(e, options));
  }
  //--------------------------------------------------------------------------
  sendGeneral(options: { to: string; subject: string; context: GeneralContext }) {
    return this.send({
      template: 'general',
      to: options.to,
      subject: options.subject,
      context: options.context,
    }).then();
  }
  //--------------------------------------------------------------------------
  sendPasswordReset(user: User) {
    this.client.emit<never, Pick<User, 'id' | 'email'>>('authPasswordResetRequested', {
      id: user.id,
      email: user.email,
    });
  }
}
