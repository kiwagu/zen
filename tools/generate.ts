import { ZenGenerator } from './zen-generator';

async function main() {
  const generator = new ZenGenerator({
    palConfig: {
      schema: 'libs/nest-api/prisma/schema.prisma',
      backend: {
        generator: 'sdl',
        output: 'libs/nest-api/src/lib/graphql/paljs',
        /** @see [Pal.js GraphQL SDL Inputs Docs](https://paljs.com/plugins/sdl-inputs) */
        doNotUseFieldUpdateOperationsInput: true,
      },
    },
    apiOutPath: 'libs/nest-api/src/lib/graphql',
    apiOutPathResolvers: 'apps/api/src/app/graphql',
    caslSubjectsOutFile: 'libs/nest-api/src/lib/auth/casl/generated.ts',
    defaultFieldsOutFile: 'libs/nest-api/src/lib/prisma/default-fields.ts',
    frontend: {
      outPath: 'libs/graphql/src/lib',
    },
  });

  await generator.run();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
