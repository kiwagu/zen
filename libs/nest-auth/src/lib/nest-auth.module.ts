import { ContextType, DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { RmqContext } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { ClsModule } from 'nestjs-cls';

import { CaslFactory } from './casl-factory';
import { JwtPayload } from './models/jwt-payload';

@Global()
@Module({
  imports: [
    ClsModule.forRootAsync({
      useFactory: (jwtService: JwtService, caslFactory: CaslFactory) => {
        return {
          global: true,
          guard: {
            mount: true,
            setup: async (cls, context) => {
              const type = context.getType() as ContextType | 'graphql' | 'rpc';

              if (type === 'rpc') {
                const rmqCtx = context.switchToRpc().getContext<RmqContext>();
                const [{ properties }] = rmqCtx.getArgs();
                const headers: Record<string, string> = {
                  ['Authorization']: properties.headers['Authorization'] as string,
                };
                const token = headers['Authorization']?.substring(7);
                const jwtDecoded = jwtService.decode(token) as JwtPayload;

                if (jwtDecoded) {
                  const user = {
                    id: jwtDecoded.sub,
                    roles: jwtDecoded.roles,
                  };
                  const ability = await caslFactory.createAbility(user);

                  cls.set('rpcReq', {
                    header: (name: string) => headers[name],
                    user,
                    ability,
                  });
                }
              }
            },
          },
        };
      },
      imports: [JwtModule],
      inject: [JwtService, CaslFactory],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule,
  ],
  exports: [PassportModule, ClsModule],
  // providers: [
  //   {
  //     provide: APP_GUARD,
  //     useClass: RpcGuard,
  //   },
  // ],
})
export class NestAuthModule {
  /**
   * @param caslFactory Class that extends CaslFactory and defines the user's abilities
   */
  static register(caslFactory: Type<CaslFactory>): DynamicModule {
    const providers: Provider[] = [
      {
        provide: CaslFactory,
        useClass: caslFactory,
      },
    ];

    return {
      module: NestAuthModule,
      providers: providers,
      exports: providers,
    };
  }
}
