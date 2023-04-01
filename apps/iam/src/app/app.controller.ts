import { Controller, Inject, Logger, UseGuards } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload, RpcException } from '@nestjs/microservices';

import { bcryptVerify } from 'hash-wasm';

import { CurrentUser, JwtPayload, RequestUser, RolesGuard } from '@zen/nest-auth';
import { ApiError, RpcError } from '@zen/common';
import { PrismaService, User } from '@zen/nest-api/prisma';

import { AppService } from './app.service';
import { ConfigService } from './config';
import { JwtService } from './jwt';
import { AccountInfo } from './models/account-info';
import { AuthExchangeTokenInput } from './models/auth-exchange-token-input';
import { AuthLoginInput } from './models/auth-login-input';
import { AuthPasswordChangeInput } from './models/auth-password-change-input';
import { AuthPasswordResetConfirmationInput } from './models/auth-password-reset-confirmation-input';
import { AuthPasswordResetRequestInput } from './models/auth-password-reset-request-input';
import { AuthRegisterInput } from './models/auth-register-input';

@Controller()
export class AppController {
  constructor(
    @Inject('MAIL_SERVICE') private clientMail: ClientProxy,
    private readonly config: ConfigService,
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  @MessagePattern({ cmd: 'authLogin' })
  async authLogin(payload: AuthLoginInput) {
    const user = await this.appService.getUserByUsername(payload.username, this.prisma);

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    // TODO: Too slow! Takes about 500 msec :O
    const correctPassword = await bcryptVerify({
      password: payload.password,
      hash: user.password as string,
    });

    if (!correctPassword) {
      throw new RpcException({
        response: ApiError.AuthLogin.INCORRECT_PASSWORD,
        status: 400,
        message: 'Incorrect password',
        name: RpcException.name,
      } as RpcError);
    }

    return this.appService.getAuthSession(user, payload.rememberMe);
  }

  @MessagePattern({ cmd: 'accountInfo' })
  @UseGuards(RolesGuard('Super'))
  async accountInfo(@CurrentUser() currentUser: RequestUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    return {
      username: user.username,
      hasPassword: !!user.password,
      googleProfile: user.googleProfile as AccountInfo['googleProfile'],
    };
  }

  @MessagePattern({ cmd: 'authExchangeToken' })
  @UseGuards(RolesGuard())
  async authExchangeToken(
    @Payload() payload: AuthExchangeTokenInput,
    @CurrentUser() { id }: RequestUser
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    return this.appService.getAuthSession(user, payload.rememberMe);
  }

  @MessagePattern({ cmd: 'authPasswordChange' })
  @UseGuards(RolesGuard())
  async authPasswordChange(
    @Payload() payload: AuthPasswordChangeInput,
    @CurrentUser() { id }: RequestUser
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    const correctPassword = await bcryptVerify({
      password: payload.oldPassword,
      hash: user.password as string,
    });

    if (!correctPassword) {
      throw new RpcException({
        response: ApiError.AuthPasswordChange.WRONG_PASSWORD,
        status: 400,
        message: 'Wrong password',
        name: RpcException.name,
      } as RpcError);
    }

    const hashedPassword = await this.appService.hashPassword(payload.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return true;
  }

  @MessagePattern({ cmd: 'authPasswordResetConfirmation' })
  async authPasswordResetConfirmation(payload: AuthPasswordResetConfirmationInput) {
    let tokenPayload: JwtPayload;

    try {
      tokenPayload = this.jwtService.verify(payload.token);
    } catch {
      throw new RpcException({
        response: ApiError.AuthPasswordChange.JWT_FAILED_VERIFICATION,
        status: 400,
        message: 'JWT failed verification',
        name: RpcException.name,
      } as RpcError);
    }

    let user = await this.prisma.user.findUnique({ where: { id: tokenPayload.sub } });

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    const hashedPassword = await this.appService.hashPassword(payload.newPassword);

    user = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return this.appService.getAuthSession(user);
  }

  @MessagePattern({ cmd: 'authPasswordResetRequest' })
  async authPasswordResetRequest(payload: AuthPasswordResetRequestInput) {
    const possibleUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              equals: payload.emailOrUsername,
              mode: 'insensitive',
            },
          },
          {
            username: {
              equals: payload.emailOrUsername,
              mode: 'insensitive',
            },
          },
        ],
        AND: [{ username: { not: null } }],
      },
    });

    if (possibleUsers.length === 0) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    possibleUsers.forEach(user =>
      this.clientMail.emit<never, Pick<User, 'id' | 'email'>>('authPasswordResetRequested', {
        id: user.id,
        email: user.email,
      })
    );

    return true;
  }

  @MessagePattern({ cmd: 'authRegister' })
  async authRegister(payload: AuthRegisterInput) {
    if (!this.config.publicRegistration) {
      throw new RpcException({
        response: ApiError.AuthRegister.NO_PUBLIC_REGISTRATIONS,
        status: 400,
        message: 'No public registrations allowed',
        name: RpcException.name,
      } as RpcError);
    }

    if (await this.appService.getUserByUsername(payload.username, this.prisma)) {
      throw new RpcException({
        response: ApiError.AuthRegister.USERNAME_TAKEN,
        status: 400,
        message: 'Username taken',
        name: RpcException.name,
      } as RpcError);
    }

    if (await this.appService.getUserByEmail(payload.email, this.prisma)) {
      throw new RpcException({
        response: ApiError.AuthRegister.EMAIL_TAKEN,
        status: 400,
        message: 'Email taken',
        name: RpcException.name,
      } as RpcError);
    }

    const hashedPassword = await this.appService.hashPassword(payload.password);

    const user = await this.prisma.user.create({
      data: {
        username: payload.username,
        email: payload.email,
        password: hashedPassword,
      },
    });

    this.clientMail.emit<never, Pick<User, 'username' | 'email'>>('authPasswordResetRequested', {
      username: user.username,
      email: user.email,
    });

    Logger.log(`Registered new user: ${user.username}`);

    return this.appService.getAuthSession(user);
  }
}
