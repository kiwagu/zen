import crypto from 'crypto';

import { HttpException, Inject, Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClientProxy } from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';
import { ApiError } from '@zen/common';
import { CurrentUser, RequestUser, RolesGuard } from '@zen/nest-auth';
import gql from 'graphql-tag';
import { bcrypt } from 'hash-wasm';

import { AuthService } from '../../auth';
import { ConfigService } from '../../config';
import { AuthSession } from '../../graphql/models/auth-session';
import { JwtService } from '../../jwt';
import { MailService } from '../../mail';
import { PrismaClient, PrismaService } from '../../prisma';
import { GqlThrottlerGuard } from '../gql-throttler.guard';
import {
  AccountInfo,
  AuthExchangeTokenInput,
  AuthLoginInput,
  AuthPasswordChangeInput,
  AuthPasswordResetConfirmationInput,
  AuthPasswordResetRequestInput,
  AuthRegisterInput,
} from '../models';

export const typeDefs = gql`
  extend type Query {
    authLogin(data: AuthLoginInput!): AuthSession!
    authExchangeToken(data: AuthExchangeTokenInput): AuthSession!
    authPasswordResetRequest(data: AuthPasswordResetRequestInput!): Boolean
    accountInfo: AccountInfo!
  }

  extend type Mutation {
    authPasswordChange(data: AuthPasswordChangeInput!): Boolean
    authPasswordResetConfirmation(data: AuthPasswordResetConfirmationInput!): AuthSession!
    authRegister(data: AuthRegisterInput!): AuthSession!
  }

  type AuthSession {
    userId: String! # Change to Int! or String! respective to the typeof User['id']
    token: String!
    roles: [String!]!
    rememberMe: Boolean!
    expiresIn: Int!
    rules: [Json!]!
  }

  type GoogleProfile {
    name: String
    given_name: String
    family_name: String
    locale: String
    email: String
    picture: String
  }

  type AccountInfo {
    username: String
    hasPassword: Boolean!
    googleProfile: GoogleProfile
  }

  input AuthLoginInput {
    username: String!
    password: String!
    rememberMe: Boolean!
  }

  input AuthExchangeTokenInput {
    rememberMe: Boolean!
  }

  input AuthPasswordChangeInput {
    oldPassword: String!
    newPassword: String!
  }

  input AuthPasswordResetConfirmationInput {
    newPassword: String!
    token: String!
  }

  input AuthPasswordResetRequestInput {
    emailOrUsername: String!
  }

  input AuthRegisterInput {
    username: String!
    email: String!
    password: String!
  }
`;

@Resolver()
@UseGuards(GqlThrottlerGuard)
@Throttle()
export class AuthResolver {
  constructor(
    @Inject('GATEWAY_SERVICE') private client: ClientProxy,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService
  ) {}

  @Query()
  authLogin(@Args('data') args: AuthLoginInput) {
    return this.client.send<AuthSession, AuthLoginInput>({ cmd: 'authLogin' }, args);
  }

  @Query()
  @UseGuards(RolesGuard())
  accountInfo(@CurrentUser() args: RequestUser) {
    return this.client.send<AccountInfo, RequestUser>({ cmd: 'accountInfo' }, args);
  }

  @Query()
  @UseGuards(RolesGuard())
  async authExchangeToken(
    @CurrentUser() reqUser: RequestUser,
    @Args('data') args: AuthExchangeTokenInput
  ) {
    return this.client.send<AccountInfo, AuthExchangeTokenInput & { userId: string }>(
      { cmd: 'authExchangeToken' },
      { ...args, userId: reqUser.id }
    );
  }

  @Query()
  async authPasswordResetRequest(@Args('data') args: AuthPasswordResetRequestInput) {
    const possibleUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              equals: args.emailOrUsername,
              mode: 'insensitive',
            },
          },
          {
            username: {
              equals: args.emailOrUsername,
              mode: 'insensitive',
            },
          },
        ],
        AND: [{ username: { not: null } }],
      },
    });

    if (possibleUsers.length === 0)
      throw new HttpException(ApiError.AuthPasswordResetRequest.USER_NOT_FOUND, 400);

    possibleUsers.forEach(user => this.mail.sendPasswordReset(user));
  }

  @Mutation()
  authPasswordResetConfirmation(@Args('data') args: AuthPasswordResetConfirmationInput) {
    return this.client.send<AccountInfo, AuthPasswordResetConfirmationInput>(
      { cmd: 'authPasswordResetConfirmation' },
      args
    );
  }

  @Mutation()
  async authRegister(@Args('data') args: AuthRegisterInput) {
    if (!this.config.publicRegistration)
      throw new UnauthorizedException('No public registrations allowed');

    if (await this.getUserByUsername(args.username, this.prisma))
      throw new HttpException(ApiError.AuthRegister.USERNAME_TAKEN, 400);

    if (await this.getUserByEmail(args.email, this.prisma))
      throw new HttpException(ApiError.AuthRegister.EMAIL_TAKEN, 400);

    const hashedPassword = await this.hashPassword(args.password);

    const user = await this.prisma.user.create({
      data: {
        username: args.username,
        email: args.email,
        password: hashedPassword,
      },
    });

    if (this.config.production) {
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
    }

    Logger.log(`Registered new user: ${user.username}`);

    return this.auth.getAuthSession(user);
  }

  @Mutation()
  @UseGuards(RolesGuard())
  authPasswordChange(
    @Args('data') args: AuthPasswordChangeInput,
    @CurrentUser() reqUser: RequestUser
  ) {
    return this.client.send<true, AuthPasswordChangeInput & { userId: string }>(
      { cmd: 'authPasswordChange' },
      { ...args, userId: reqUser.id }
    );
  }

  private async getUserByUsername(username: string, prisma: PrismaClient) {
    return prisma.user.findFirst({
      where: {
        username: {
          mode: 'insensitive',
          equals: username,
        },
      },
    });
  }

  private async getUserByEmail(email: string, prisma: PrismaClient) {
    return prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: email,
        },
      },
    });
  }

  private async hashPassword(password: string) {
    return bcrypt({
      costFactor: this.config.bcryptCost,
      password,
      salt: crypto.getRandomValues(new Uint8Array(16)),
    });
  }
}
