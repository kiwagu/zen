const lowercase = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

export function GraphQLResolversTemplate(name: string) {
  return `import { GraphQLResolveInfo } from 'graphql';

import { Inject, UseGuards } from '@nestjs/common';
import { Args, Info, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ClientProxy } from '@nestjs/microservices';

import type { NonNullableFields } from '@zen/common';
import type {
  Aggregate${name}Args,
  CreateOne${name}Args,
  DeleteMany${name}Args,
  DeleteOne${name}Args,
  FindFirst${name}Args,
  FindMany${name}Args,
  FindUnique${name}Args,
  UpdateMany${name}Args,
  UpdateOne${name}Args,
  UpsertOne${name}Args,
} from '@zen/nest-api/graphql/resolversTypes';
import { DefaultFields, PrismaSelectService, ${name} } from '@zen/nest-api/prisma';
import { CaslFactory, CaslGuard } from '@zen/nest-auth';

import { DEFAULT_FIELDS_TOKEN } from '../../auth';

export const typeDefs = null;
// export const typeDefs = gql\`
//   extend type Query {
//     sample${name}Query: ${name}
//   }
//   extend type Mutation {
//     sample${name}Mutation(args: Int!): Boolean
//   }
//   extend type ${name} {
//     sample${name}Field: String
//   }
// \`;

@Resolver('${name}')
@UseGuards(CaslGuard)
export class ${name}Resolver {
  constructor(
    @Inject(DEFAULT_FIELDS_TOKEN) private readonly defaultFields: DefaultFields,
    private readonly prismaSelect: PrismaSelectService,
    private readonly caslFactory: CaslFactory,
    @Inject('IAM_SERVICE') private client: ClientProxy
  ) {}

  @ResolveField()
  password() {
    return null;
  }

  @ResolveField()
  async rules(@Parent() parent: ${name}) {
    const ability = await this.caslFactory.createAbility(parent);
    return ability.rules;
  }

  @Query()
  findUnique${name}(
    @Args() args: NonNullableFields<FindUnique${name}Args>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<${name}, NonNullableFields<FindUnique${name}Args>>(
      { query: 'findUnique${name}' },
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
  }

  @Query()
  findFirst${name}(
    @Args() args: NonNullableFields<FindFirst${name}Args>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<${name}, NonNullableFields<FindFirst${name}Args>>(
      { query: 'findFirst${name}' },
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
  }

  @Query()
  findMany${name}(@Args() args: FindMany${name}Args, @Info() info: GraphQLResolveInfo) {
    return this.client.send<${name}, FindMany${name}Args>(
      { query: 'findMany${name}' },
      this.prismaSelect.getArgs(info, args, this.defaultFields)
    );
  }

  @Query()
  findMany${name}Count(@Args() args: FindMany${name}Args, @Info() info: GraphQLResolveInfo) {
    return this.client.send<${name}, FindMany${name}Args>(
      { query: 'findMany${name}Count' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Query()
  aggregate${name}(@Args() args: Aggregate${name}Args, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, FindMany${name}Args>(
      { query: 'aggregate${name}' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  createOne${name}(@Args() args: CreateOne${name}Args, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, CreateOne${name}Args>(
      { cmd: 'createOne${name}' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  updateOne${name}(
    @Args() args: NonNullableFields<UpdateOne${name}Args>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<unknown, NonNullableFields<UpdateOne${name}Args>>(
      { cmd: 'updateOne${name}' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  updateMany${name}(@Args() args: UpdateMany${name}Args, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, UpdateMany${name}Args>(
      { cmd: 'updateMany${name}' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  upsertOne${name}(@Args() args: UpsertOne${name}Args, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, UpsertOne${name}Args>(
      { cmd: 'upsertOne${name}' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  deleteOne${name}(
    @Args() args: NonNullableFields<DeleteOne${name}Args>,
    @Info() info: GraphQLResolveInfo
  ) {
    return this.client.send<unknown, DeleteOne${name}Args>(
      { cmd: 'deleteOne${name}' },
      this.prismaSelect.getArgs(info, args)
    );
  }

  @Mutation()
  deleteMany${name}(@Args() args: DeleteMany${name}Args, @Info() info: GraphQLResolveInfo) {
    return this.client.send<unknown, DeleteMany${name}Args>(
      { cmd: 'deleteMany${name}' },
      this.prismaSelect.getArgs(info, args)
    );
  }
}
`;
}
