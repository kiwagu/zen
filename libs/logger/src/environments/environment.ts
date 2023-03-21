import { EnvironmentBase } from './environment.base';

export const environment: EnvironmentBase = {
  ogma: {
    options: {
      size: '10M', // rotate every 10 MegaBytes written
      compress: 'gzip', // compress rotated files
    },
  },
};
