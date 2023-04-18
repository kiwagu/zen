import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

import { ConfigService } from './config';
import { MailService } from './mail';

@Controller()
export class AppController {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService
  ) {}

  @EventPattern('authPasswordResetRequested')
  authPasswordResetConfirmation(user: { id: string; email: string }) {
    return this.mail.sendPasswordReset(user);
  }

  @EventPattern('authRegistered')
  async authRegistered(user: { username: string; email: string }) {
    return this.mail.sendGeneral({
      to: user.email,
      subject: 'Sign Up Confirmed',
      context: {
        siteUrl: this.config.siteUrl,
        hiddenPreheaderText: `Sign up confirmed for ${user.username}`,
        header: 'Welcome',
        subHeading: 'Sign Up Confirmed',
        body: `Thank you for signing up ${user.username}!`,
        footerHeader: '',
        footerBody: '',
      },
    });
  }
}
