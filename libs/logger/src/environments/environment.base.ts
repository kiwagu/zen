import * as rfs from 'rotating-file-stream';

export abstract class EnvironmentBase {
  readonly ogma?: {
    readonly options?: rfs.Options;
  };
}
