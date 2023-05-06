import { Queue } from 'bull';

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config';
import { JwtService } from '../jwt';
import { GeneralContext, PasswordResetContext } from './contexts';
import { MAIL_QUEUE } from './mail.constant';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue(MAIL_QUEUE.NAME) private mailQueue: Queue,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  //--------------------------------------------------------------------------
  sendGeneral(options: { to: string; subject: string; context: GeneralContext }) {
    return this.mailQueue.add(MAIL_QUEUE.GENERAL, {
      template: 'general',
      to: options.to,
      subject: options.subject,
      context: options.context,
    });
  }

  //--------------------------------------------------------------------------
  sendPasswordReset(user: { id: string; email: string }) {
    const token = this.jwtService.sign({ sub: user.id, aud: user.email }, { expiresIn: '1d' });

    const context: PasswordResetContext = {
      siteUrl: this.config.siteUrl,
      resetUrl: `${this.config.siteUrl}/password-reset-confirmation?token=${encodeURI(token)}`,
    };

    return this.mailQueue.add(MAIL_QUEUE.RESET_PASSWORD, {
      template: 'password-reset',
      to: user.email,
      subject: `Password Reset Request`,
      context,
    });
  }
}
