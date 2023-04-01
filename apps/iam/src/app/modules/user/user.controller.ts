import { subject } from '@casl/ability';

import { Controller, Inject, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { NonNullableFields } from '@zen/common';
import {
  AggregateUserArgs,
  CreateOneUserArgs,
  DeleteManyUserArgs,
  DeleteOneUserArgs,
  FindFirstUserArgs,
  FindManyUserArgs,
  FindUniqueUserArgs,
  UpdateManyUserArgs,
  UpdateOneUserArgs,
  UpsertOneUserArgs,
} from '@zen/nest-api/graphql/resolversTypes';
import { DefaultFields, PrismaService, User } from '@zen/nest-api/prisma';
import { CaslAbility, CaslGuard, RpcForbiddenException } from '@zen/nest-auth';

import { AppAbility } from '../../casl/casl.factory';
import { DEFAULT_FIELDS_TOKEN } from '../../casl/default-fields';

@Controller()
@UseGuards(CaslGuard)
export class UserController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DEFAULT_FIELDS_TOKEN) private readonly defaultFields: DefaultFields
  ) {}

  @MessagePattern({ query: 'findFirstUser' })
  async findFirstUser(
    @Payload() payload: NonNullableFields<FindFirstUserArgs>,
    @CaslAbility() ability: AppAbility
  ) {
    const user = await this.prisma.user.findFirst(payload);
    if (ability.cannot('read', subject('User', user))) throw new RpcForbiddenException();
    return user;
  }

  @MessagePattern({ query: 'findUniqueUser' })
  async findUniqueUser(
    @Payload() payload: NonNullableFields<FindUniqueUserArgs>,
    @CaslAbility() ability: AppAbility
  ) {
    const user = await this.prisma.user.findUnique(payload);
    if (ability.cannot('read', subject('User', user))) throw new RpcForbiddenException();
    return user;
  }

  @MessagePattern({ query: 'findManyUser' })
  async findManyUser(@Payload() payload: FindManyUserArgs, @CaslAbility() ability: AppAbility) {
    const records = await this.prisma.user.findMany(payload);
    for (const record of records) {
      if (ability.cannot('read', subject('User', record))) throw new RpcForbiddenException();
    }
    return records;
  }

  @MessagePattern({ query: 'findManyUserCount' })
  async findManyUserCount(
    @Payload() payload: FindManyUserArgs,
    @CaslAbility() ability: AppAbility
  ) {
    if (ability.cannot('read', 'User')) throw new RpcForbiddenException();
    return this.prisma.user.count(payload);
  }

  @MessagePattern({ query: 'aggregateUser' })
  async aggregateUser(@Payload() payload: AggregateUserArgs, @CaslAbility() ability: AppAbility) {
    if (ability.cannot('read', 'User')) throw new RpcForbiddenException();
    return this.prisma.user.aggregate(payload);
  }

  @MessagePattern({ cmd: 'createOneUser' })
  async createOneUser(@Payload() payload: CreateOneUserArgs, @CaslAbility() ability: AppAbility) {
    if (ability.cannot('create', subject('User', payload.data as any)))
      throw new RpcForbiddenException();
    return this.prisma.user.create(payload);
  }

  @MessagePattern({ cmd: 'updateOneUser' })
  async updateOneUser(
    @Payload() payload: NonNullableFields<UpdateOneUserArgs>,
    @CaslAbility() ability: AppAbility
  ) {
    const record = await this.prisma.user.findUnique({
      where: payload.where,
      select: this.defaultFields.User,
    });
    if (ability.cannot('update', subject('User', record as User)))
      throw new RpcForbiddenException();
    return this.prisma.user.update(payload);
  }

  @MessagePattern({ cmd: 'updateManyUser' })
  async updateManyUser(@Payload() payload: UpdateManyUserArgs, @CaslAbility() ability: AppAbility) {
    const records = await this.prisma.user.findMany({
      where: payload.where,
      select: this.defaultFields.User,
    });
    for (const record of records) {
      if (ability.cannot('update', subject('User', record as User)))
        throw new RpcForbiddenException();
    }
    return this.prisma.user.updateMany(payload);
  }

  @MessagePattern({ cmd: 'upsertOneUser' })
  async upsertOneUser(@Payload() payload: UpsertOneUserArgs, @CaslAbility() ability: AppAbility) {
    const record = await this.prisma.user.findFirst({
      where: payload.where,
      select: this.defaultFields.User,
    });
    if (
      (record && ability.cannot('update', subject('User', record as User))) ||
      ability.cannot('create', subject('User', payload.create as any))
    ) {
      throw new RpcForbiddenException();
    }
    return this.prisma.user.upsert(payload);
  }

  @MessagePattern({ cmd: 'deleteOneUser' })
  async deleteOneUser(
    @Payload() payload: NonNullableFields<DeleteOneUserArgs>,
    @CaslAbility() ability: AppAbility
  ) {
    const record = await this.prisma.user.findUnique({
      where: payload.where,
      select: this.defaultFields.User,
    });
    if (ability.cannot('delete', subject('User', record as User)))
      throw new RpcForbiddenException();
    return this.prisma.user.delete(payload);
  }

  @MessagePattern({ cmd: 'deleteManyUser' })
  async deleteManyUser(@Payload() payload: DeleteManyUserArgs, @CaslAbility() ability: AppAbility) {
    const records = await this.prisma.user.findMany({
      where: payload.where,
      select: this.defaultFields.User,
    });
    for (const record of records) {
      if (ability.cannot('delete', subject('User', record as User)))
        throw new RpcForbiddenException();
    }
    return this.prisma.user.deleteMany(payload);
  }
}
