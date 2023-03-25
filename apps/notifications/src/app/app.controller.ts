import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

import { AppService } from './app.service';
import { ConfigService } from './config';
import { MailService } from './mail';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mail: MailService,
    private readonly config: ConfigService
  ) {}

  @EventPattern('authPasswordResetRequested')
  async authPasswordResetConfirmation(user: { id: string; email: string }) {
    this.mail.sendPasswordReset(user);

    return true;
  }

  @EventPattern('authRegistered')
  async authRegistered(user: { username: string; email: string }) {
    this.mail.sendGeneral({
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

    return true;
  }
}
