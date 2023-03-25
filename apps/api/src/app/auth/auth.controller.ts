import { URLSearchParams } from 'url';

import { Controller, Get, Inject, Res, UseFilters, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';

import { Response } from 'express';
import { firstValueFrom } from 'rxjs';

import { CurrentUser, RequestUser } from '@zen/nest-auth';

import { ConfigService } from '../config';
import { AuthExchangeTokenInput, AuthSession } from '../graphql/models';
import { EmailTakenExceptionFilter } from './strategies/email-taken-exception.filter';

@Controller('auth')
@UseFilters(EmailTakenExceptionFilter)
export class AuthController {
  constructor(
    @Inject('IAM_SERVICE') private client: ClientProxy,
    private readonly config: ConfigService
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const url = await this.getLoginConfirmedURL(user);
    res.redirect(url);
  }

  async getLoginConfirmedURL(user: RequestUser) {
    const authSession = await firstValueFrom(
      this.client.send<AuthSession, AuthExchangeTokenInput & { userId: string }>(
        { cmd: 'authExchangeToken' },
        { userId: user.id, rememberMe: false }
      )
    );

    const token = encodeURIComponent(authSession.token);
    const queryParams = new URLSearchParams({ token });
    return this.config.oauth?.loginConfirmedURL + '?' + queryParams;
  }
}
