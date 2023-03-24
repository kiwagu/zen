import { Controller } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { ApiError, RpcError } from '@zen/common';
import { JwtPayload, RequestUser } from '@zen/nest-auth';
import { bcryptVerify } from 'hash-wasm';

import { AppService } from './app.service';
import { JwtService } from './jwt';
import { AccountInfo } from './models/account-info';
import { AuthExchangeTokenInput } from './models/auth-exchange-token-input';
import { AuthLoginInput } from './models/auth-login-input';
import { AuthPasswordChangeInput } from './models/auth-password-change-input';
import { AuthPasswordResetConfirmationInput } from './models/auth-password-reset-confirmation-input';
import { PrismaService } from './prisma';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  @MessagePattern({ cmd: 'authLogin' })
  async authLogin(args: AuthLoginInput) {
    const user = await this.appService.getUserByUsername(args.username, this.prisma);

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
      password: args.password,
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

    return this.appService.getAuthSession(user, args.rememberMe);
  }

  @MessagePattern({ cmd: 'accountInfo' })
  async accountInfo(args: RequestUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: args.id },
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
  async authExchangeToken(args: AuthExchangeTokenInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: args.userId },
    });

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    return this.appService.getAuthSession(user, args.rememberMe);
  }

  @MessagePattern({ cmd: 'authPasswordChange' })
  async authPasswordChange(args: AuthPasswordChangeInput) {
    const user = await this.prisma.user.findUnique({ where: { id: args.userId } });

    if (!user) {
      throw new RpcException({
        response: ApiError.AuthLogin.USER_NOT_FOUND,
        status: 404,
        message: 'User not found',
        name: RpcException.name,
      } as RpcError);
    }

    const correctPassword = await bcryptVerify({
      password: args.oldPassword,
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

    const hashedPassword = await this.appService.hashPassword(args.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return true;
  }

  @MessagePattern({ cmd: 'authPasswordResetConfirmation' })
  async authPasswordResetConfirmation(args: AuthPasswordResetConfirmationInput) {
    let tokenPayload: JwtPayload;

    try {
      tokenPayload = this.jwtService.verify(args.token);
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

    const hashedPassword = await this.appService.hashPassword(args.newPassword);

    user = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return this.appService.getAuthSession(user);
  }
}
