import { ExecutionContext, Injectable, mixin } from '@nestjs/common';
import { ContextType } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@zen/common';

import { ALLOW_ANONYMOUS_KEY } from '../decorators/allow-anonymous.decorator';
import { RequestUser } from '../models/request-user';

/**
 * Imitates [ASP.NET Core RBAC](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/roles?view=aspnetcore-7.0)
 */
export function RolesGuard(...roles: Array<Role>) {
  @Injectable()
  class MixinRolesGuard extends AuthGuard('jwt') {
    constructor(readonly reflector: Reflector) {
      super();
    }

    async canActivate(context: ExecutionContext) {
      const allowAnonymousHandler = this.reflector.get<boolean | undefined>(
        ALLOW_ANONYMOUS_KEY,
        context.getHandler()
      );

      if (allowAnonymousHandler) return true;

      const allowAnonymousClass = this.reflector.get<boolean | undefined>(
        ALLOW_ANONYMOUS_KEY,
        context.getClass()
      );

      if (allowAnonymousClass) return true;

      await super.canActivate(context);

      if (roles.length === 0) return true;

      let user: RequestUser;
      const type = context.getType() as ContextType & 'graphql';

      if (type === 'http') {
        user = context.switchToHttp().getRequest().user;
      } else if (type === 'graphql') {
        user = GqlExecutionContext.create(context).getContext().req.user;
      }

      return rbacLogic(user.roles, roles);
    }

    getRequest(context: ExecutionContext) {
      const type = context.getType() as ContextType & 'graphql';
      if (type === 'http') {
        return context.switchToHttp().getRequest();
      } else if (type === 'graphql') {
        return GqlExecutionContext.create(context).getContext().req;
      }
    }
  }

  return mixin(MixinRolesGuard);
}

export function rbacLogic(userRoles: string[], definedRoles: string[]) {
  return (
    userRoles.includes('Super') || definedRoles.some(definedRole => userRoles.includes(definedRole))
  );
}
