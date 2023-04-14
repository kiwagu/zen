import { GraphQLResolveInfo } from 'graphql';
import { gql } from 'graphql-tag';

import { Inject } from '@nestjs/common';
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClientProxy } from '@nestjs/microservices';

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
import { DefaultFields, PrismaSelectService, User } from '@zen/nest-api/prisma';

import { DEFAULT_FIELDS_TOKEN } from '../default-fields';


export const typeDefs = gql`
  extend type User {
    rules: [Json!]!
  }
`;

@Resolver('User')
export class UserResolver {
  constructor(
    @Inject(DEFAULT_FIELDS_TOKEN) private readonly defaultFields: DefaultFields,
    private readonly prismaSelect: PrismaSelectService,
    @Inject('IAM_SERVICE') private client: ClientProxy
  ) {}

  @Query()
  findUniqueUser(
    @Args() args: NonNullableFields<FindUniqueUserArgs>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<User, NonNullableFields<FindUniqueUserArgs>>(
      { query: 'findUniqueUser' },
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
  }

  @Query()
  findFirstUser(
    @Args() args: NonNullableFields<FindFirstUserArgs>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<User, NonNullableFields<FindFirstUserArgs>>(
      { query: 'findFirstUser' },
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
  }

  @Query()
  findManyUser(@Args() args: FindManyUserArgs, @Info() info: GraphQLResolveInfo) {
    return this.client.send<User, FindManyUserArgs>(
      { query: 'findManyUser' },
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
  }

  @Query()
  findManyUserCount(@Args() args: FindManyUserArgs, @Info() info: GraphQLResolveInfo) {
    return this.client.send<User, FindManyUserArgs>(
      { query: 'findManyUserCount' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Query()
  aggregateUser(@Args() args: AggregateUserArgs, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, FindManyUserArgs>(
      { query: 'aggregateUser' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  createOneUser(@Args() args: CreateOneUserArgs, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, CreateOneUserArgs>(
      { cmd: 'createOneUser' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  updateOneUser(
    @Args() args: NonNullableFields<UpdateOneUserArgs>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<unknown, NonNullableFields<UpdateOneUserArgs>>(
      { cmd: 'updateOneUser' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  updateManyUser(@Args() args: UpdateManyUserArgs, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, UpdateManyUserArgs>(
      { cmd: 'updateManyUser' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  upsertOneUser(@Args() args: UpsertOneUserArgs, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, UpsertOneUserArgs>(
      { cmd: 'upsertOneUser' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  deleteOneUser(
    @Args() args: NonNullableFields<DeleteOneUserArgs>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<unknown, DeleteOneUserArgs>(
      { cmd: 'deleteOneUser' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  deleteManyUser(@Args() args: DeleteManyUserArgs, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, DeleteManyUserArgs>(
      { cmd: 'deleteManyUser' },
      this.prismaSelect.getArgs(info, args)
    );
  }
}
