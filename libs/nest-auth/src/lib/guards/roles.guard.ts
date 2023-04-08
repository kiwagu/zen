import { ExecutionContext, Injectable, UnauthorizedException, mixin } from '@nestjs/common';
import { ContextType } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RpcException } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { ApiError, Role, RpcError } from '@zen/common';
import { ClsService } from 'nestjs-cls';

import { ALLOW_ANONYMOUS_KEY } from '../decorators/allow-anonymous.decorator';

/**
 * A guard that takes a list of roles for its parameters and checks if the user has at least
 * one of them. Works with either HTTP or GraphQL requests. The following will require the
 * user to have either the `Admin` or `Moderator` roles.
 * ```ts
 * ＠UseGuards(RolesGuard('Admin', 'Moderator'))
 * ```
 * The following will require the user to have both the `Admin` and `Moderator` roles.
 * ```ts
 * ＠UseGuards(RolesGuard('Admin'), RolesGuard('Moderator'))
 * ```
 * If no roles are passed as parameters, it will only verify that the request has a valid JWT
 * and extracts the `RequestUser` to be injected via the `＠CurrentUser` decorator.
 * ```ts
 * ＠UseGuards(RolesGuard())
 * accountInfo(＠CurrentUser() user: RequestUser) { ... }
 * ```
 */
export function RolesGuard(...roles: Array<Role>) {
  if (new.target !== undefined)
    throw new Error('RolesGuard cannot be instantiated directly. Use RolesGuard() instead.');

  @Injectable()
  class MixinRolesGuard extends AuthGuard('jwt') {
    constructor(
      readonly reflector: Reflector,
      readonly clsService: ClsService
    ) {
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

      let req;
      const type = context.getType() as ContextType | 'graphql' | 'rpc';

      if (type === 'http') {
        req = context.switchToHttp().getRequest();
      } else if (type === 'graphql') {
        req = GqlExecutionContext.create(context).getContext().req;
      } else if (type === 'rpc') {
        try {
          await super.canActivate(context);
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            throw new RpcException({
              response: ApiError.AuthCommon.UNAUTHORIZED,
              status: 400,
              message: 'Unauthorized',
              name: RpcException.name,
            } as RpcError);
          }

          throw error;
        }

        req = this.getRequest(context);
      } else {
        throw new UnauthorizedException(`Context ${type} not supported`);
      }

      if (!req.user) await super.canActivate(context);

      if (roles.length === 0) return true;

      return rbacLogic(req.user.roles, roles);
    }

    getRequest(context: ExecutionContext) {
      const type = context.getType() as ContextType | 'graphql' | 'rpc';

      if (type === 'http') {
        return context.switchToHttp().getRequest();
      } else if (type === 'graphql') {
        return GqlExecutionContext.create(context).getContext().req;
      } else if (type === 'rpc') {
        return this.clsService.get('rpcReq');
      } else {
        throw new UnauthorizedException(`Context ${type} not supported`);
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
