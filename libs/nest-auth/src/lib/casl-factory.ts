import { PureAbility } from '@casl/ability';

import { Injectable } from '@nestjs/common';

import { PrismaQuery } from '@zen/nest-api/auth/casl/casl-prisma';
import { PrismaSubjects } from '@zen/nest-api/auth/casl/generated';
import { Action } from '@zen/common';

import { RequestUser } from './models/request-user';

/** A union of subjects to extend the ability beyond just Prisma models */
type ExtendedSubjects = 'all';
export type AppSubjects = PrismaSubjects | ExtendedSubjects;
export type AppAbility = PureAbility<[Action, AppSubjects], PrismaQuery>;

/**
 * Abstract class for creating an ability for a user.  It is used by the `CaslGuard` decorator to create an ability.
 * Register the factory with the `NestAuthModule` by passing it to the `register` method.
 * ```ts
 * ＠Module({ imports: [NestAuthModule.register(AppCaslFactory)] })
 * export class ZenAuthModule {}
 * ```
 * Where `AppCaslFactory` is a class that extends `CaslFactory` and implements the `createAbility` method.
 */
@Injectable()
export abstract class CaslFactory {
  abstract createAbility(user: RequestUser): AppAbility;
}
