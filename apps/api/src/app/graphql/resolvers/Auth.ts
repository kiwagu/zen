import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClientProxy } from '@nestjs/microservices';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, RequestUser, RolesGuard } from '@zen/nest-auth';
import gql from 'graphql-tag';

import { AuthSession } from '../../graphql/models/auth-session';
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
    @Inject('IAM_SERVICE') private client: ClientProxy
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
    return this.client.send<true, AuthPasswordResetRequestInput>(
      { cmd: 'authPasswordResetRequest' },
      args
    );
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
    return this.client.send<AccountInfo, AuthRegisterInput>({ cmd: 'authRegister' }, args);
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
}
