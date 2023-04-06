import { Meta, moduleMetadata } from '@storybook/angular';
import { AuthPasswordResetRequestQueryGQL } from '@zen/graphql';

import { AUTH_DECLARATIONS, AUTH_IMPORTS, AUTH_PROVIDERS } from '../test-deps';
import { ZenPasswordResetRequestFormComponent } from '../zen-password-reset-request-form/zen-password-reset-request-form.component';
import { ZenPasswordResetRequestComponent } from '../zen-password-reset-request/zen-password-reset-request.component';
import { ZenPasswordResetRequestPageComponent } from './zen-password-reset-request-page.component';

export default {
  title: 'ZenPasswordResetRequestPageComponent',
  component: ZenPasswordResetRequestPageComponent,
  decorators: [
    moduleMetadata({
      imports: AUTH_IMPORTS,
      providers: [...AUTH_PROVIDERS, AuthPasswordResetRequestQueryGQL],
      declarations: [
        ...AUTH_DECLARATIONS,
        ZenPasswordResetRequestFormComponent,
        ZenPasswordResetRequestComponent,
      ],
    }),
  ],
} as Meta<ZenPasswordResetRequestPageComponent>;

export const Primary = {
  render: (args: ZenPasswordResetRequestPageComponent) => ({
    props: args,
  }),
  args: {},
};
