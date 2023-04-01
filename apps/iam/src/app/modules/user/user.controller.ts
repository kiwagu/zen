import { subject } from '@casl/ability';

import { Controller, ForbiddenException, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { NonNullableFields } from '@zen/common';
import { FindFirstUserArgs } from '@zen/nest-api/graphql/resolversTypes';
import { PrismaService, User } from '@zen/nest-api/prisma';
import { CaslAbility, CaslGuard, CurrentUser, RequestUser } from '@zen/nest-auth';

import { AppAbility } from '../../casl/casl.factory';

@Controller()
@UseGuards(CaslGuard)
export class UserController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @MessagePattern({ cmd: 'findFirstUser' })
  async findFirstUser(
    @Payload() payload: NonNullableFields<FindFirstUserArgs>,
    @CaslAbility() ability: AppAbility,
    @CurrentUser() currentUser: RequestUser
  ) {
    const record = await this.prisma.user.findFirst(payload);

    if (ability.cannot('read', subject('User', currentUser as User)))
      throw new ForbiddenException();

    return record;
  }
}
