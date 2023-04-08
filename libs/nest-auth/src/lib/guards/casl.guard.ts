import { ClsService } from 'nestjs-cls';

import { ContextType, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RpcException } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';

import { ApiError, RpcError } from '@zen/common';

import { CaslFactory } from '../casl-factory';
import { ALLOW_ANONYMOUS_KEY } from '../decorators/allow-anonymous.decorator';
import { CASL_POLICY_KEY, CaslPolicyHandler } from '../decorators/casl-policy.decorator';

/**
 * Guard that is used in conjunction with `CaslAbility`, `CaslAccessible` and `CaslPolicy` decorators.
 * Works with either HTTP or GraphQL requests.
 * @example
 * ```ts
 * ＠UseGuards(CaslGuard)
 * async getBlogs(
 *   ＠CaslAbility() ability: AppAbility,
 *   ＠CaslAccessible('Blog') accessibleBlogs: Prisma.BlogWhereInput
 * ) { ... }
 * ```
 * @example
 * ```ts
 * ＠UseGuards(CaslGuard)
 * ＠CaslPolicy((ability: AppAbility) => ability.can('read', 'Blog'))
 * async getBlogs() { ... }
 * ```
 */
@Injectable()
export class CaslGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslFactory: CaslFactory,
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

    let req: any;
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

    if (!req.ability) req.ability = await this.caslFactory.createAbility(req.user);

    const classPolicies =
      this.reflector.get<CaslPolicyHandler[]>(CASL_POLICY_KEY, context.getClass()) || [];
    const handlerPolicies =
      this.reflector.get<CaslPolicyHandler[]>(CASL_POLICY_KEY, context.getHandler()) || [];
    const policies = classPolicies.concat(handlerPolicies);

    return policies.every(handler => handler(req.ability));
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
