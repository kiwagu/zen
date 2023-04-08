import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action, Role } from '@zen/common';
import { PrismaQuery, createPrismaAbility } from '@zen/nest-api/auth/casl/casl-prisma';
import { PrismaSubjects } from '@zen/nest-api/auth/casl/generated';
import { CaslFactory, RequestUser } from '@zen/nest-auth';

/** A union of subjects to extend the ability beyond just Prisma models */
type ExtendedSubjects = 'all';
export type AppSubjects = PrismaSubjects | ExtendedSubjects;
export type AppAbility = PureAbility<[Action, AppSubjects], PrismaQuery>;

@Injectable()
export class AppCaslFactory extends CaslFactory {
  createAbility(user: RequestUser<Role>) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    if (user.roles.includes('Super')) {
      can('manage', 'all');
    } else {
      // ... Customize user permissions here
    }

    return build();
  }
}
