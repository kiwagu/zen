import { ForbiddenException, Inject, UseGuards } from '@nestjs/common';
import { Args, Info, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ClientProxy } from '@nestjs/microservices';

import { subject } from '@casl/ability';
import { GraphQLResolveInfo } from 'graphql';
import { gql } from 'graphql-tag';

import type { NonNullableFields } from '@zen/common';
import type {
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
import { DefaultFields, PrismaSelectService, PrismaService, User } from '@zen/nest-api/prisma';
import { CaslAbility, CaslFactory, CaslGuard } from '@zen/nest-auth';

import { DEFAULT_FIELDS_TOKEN } from '../../auth';
import type { AppAbility } from '../../auth';

export const typeDefs = gql`
  extend type User {
    rules: [Json!]!
  }
`;

@Resolver('User')
@UseGuards(CaslGuard)
export class UserResolver {
  constructor(
    @Inject(DEFAULT_FIELDS_TOKEN) private readonly defaultFields: DefaultFields,
    private readonly prisma: PrismaService,
    private readonly prismaSelect: PrismaSelectService,
    private readonly caslFactory: CaslFactory,
    @Inject('IAM_SERVICE') private client: ClientProxy
  ) {}

  @ResolveField()
  async password() {
    return null;
  }

  @ResolveField()
  async rules(@Parent() parent: User) {
    const ability = await this.caslFactory.createAbility(parent);
    return ability.rules;
  }

  @Query()
  async findUniqueUser(
    @Args() args: NonNullableFields<FindUniqueUserArgs>,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    const record = await this.prisma.user.findUnique(
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
    if (ability.cannot('read', subject('User', record as User))) throw new ForbiddenException();
    return record;
  }

  @Query()
  findFirstUser(
    @Args() args: NonNullableFields<FindFirstUserArgs>,
    @Info() info: GraphQLResolveInfo
  ) {
    const gqlArgs = this.prismaSelect.getArgs(info, args, this.defaultFields);

    return this.client.send<User, NonNullableFields<FindFirstUserArgs>>(
      { cmd: 'findFirstUser' },
      gqlArgs
    );
  }

  @Query()
  async findManyUser(
    @Args() args: FindManyUserArgs,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    const records = await this.prisma.user.findMany(
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
    for (const record of records) {
      if (ability.cannot('read', subject('User', record))) throw new ForbiddenException();
    }
    return records;
  }

  @Query()
  async findManyUserCount(
    @Args() args: FindManyUserArgs,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    if (ability.cannot('read', 'User')) throw new ForbiddenException();
    return this.prisma.user.count(this.prismaSelect.getArgs(info, args));
  }

  @Query()
  async aggregateUser(
    @Args() args: AggregateUserArgs,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    if (ability.cannot('read', 'User')) throw new ForbiddenException();
    return this.prisma.user.aggregate(this.prismaSelect.getArgs(info, args));
  }

  @Mutation()
  async createOneUser(
    @Args() args: CreateOneUserArgs,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    if (ability.cannot('create', subject('User', args.data as any))) throw new ForbiddenException();
    return this.prisma.user.create(this.prismaSelect.getArgs(info, args));
  }

  @Mutation()
  async updateOneUser(
    @Args() args: NonNullableFields<UpdateOneUserArgs>,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    const record = await this.prisma.user.findUnique({
      where: args.where,
      select: this.defaultFields.User,
    });
    if (ability.cannot('update', subject('User', record as User))) throw new ForbiddenException();
    return this.prisma.user.update(this.prismaSelect.getArgs(info, args));
  }

  @Mutation()
  async updateManyUser(
    @Args() args: UpdateManyUserArgs,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    const records = await this.prisma.user.findMany({
      where: args.where,
      select: this.defaultFields.User,
    });
    for (const record of records) {
      if (ability.cannot('update', subject('User', record as User))) throw new ForbiddenException();
    }
    return this.prisma.user.updateMany(this.prismaSelect.getArgs(info, args));
  }

  @Mutation()
  async upsertOneUser(
    @Args() args: UpsertOneUserArgs,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    const record = await this.prisma.user.findFirst({
      where: args.where,
      select: this.defaultFields.User,
    });
    if (
      (record && ability.cannot('update', subject('User', record as User))) ||
      ability.cannot('create', subject('User', args.create as any))
    ) {
      throw new ForbiddenException();
    }
    return this.prisma.user.upsert(this.prismaSelect.getArgs(info, args));
  }

  @Mutation()
  async deleteOneUser(
    @Args() args: NonNullableFields<DeleteOneUserArgs>,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    const record = await this.prisma.user.findUnique({
      where: args.where,
      select: this.defaultFields.User,
    });
    if (ability.cannot('delete', subject('User', record as User))) throw new ForbiddenException();
    return this.prisma.user.delete(this.prismaSelect.getArgs(info, args));
  }

  @Mutation()
  async deleteManyUser(
    @Args() args: DeleteManyUserArgs,
    @Info() info: GraphQLResolveInfo,
    @CaslAbility() ability: AppAbility
  ) {
    const records = await this.prisma.user.findMany({
      where: args.where,
      select: this.defaultFields.User,
    });
    for (const record of records) {
      if (ability.cannot('delete', subject('User', record as User))) throw new ForbiddenException();
    }
    return this.prisma.user.deleteMany(this.prismaSelect.getArgs(info, args));
  }
}
