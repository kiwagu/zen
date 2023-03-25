import { createWriteStream, existsSync, mkdirSync } from 'fs';

import { Inject, Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentUser, RequestUser, RolesGuard } from '@zen/nest-auth';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { interval, throwError, timeout } from 'rxjs';

import type { Upload } from '../models';

export const typeDefs = gql`
  extend type Mutation {
    sampleUpload(file: Upload!): [String!]!
    sampleUploadMany(files: [Upload!]!): [String!]!
  }

  extend type Query {
    hi: String!
  }

  type SampleSubscriptionResult {
    message: String!
  }

  type Subscription {
    sampleSubscription: SampleSubscriptionResult!
  }
`;

const pubSub = new PubSub();

interval(1000).subscribe(i =>
  pubSub.publish('sampleSubscription', {
    sampleSubscription: {
      message: `Server ticker ${i}`,
    },
  })
);

@Resolver()
@UseGuards(RolesGuard('Super'))
export class SampleResolver implements OnModuleInit {
  UPLOAD_PATH = './upload/';

  constructor(@Inject('IAM_SERVICE') private client: ClientProxy) {}

  onModuleInit() {
    if (!existsSync(this.UPLOAD_PATH)) {
      Logger.log('Creating directory', this.UPLOAD_PATH);
      mkdirSync(this.UPLOAD_PATH);
    }
  }

  @Mutation()
  async sampleUpload(@Args('file', { type: () => GraphQLUpload }) file: Upload) {
    return this.saveFiles([Promise.resolve(file)]);
  }

  @Mutation()
  async sampleUploadMany(@Args('files', { type: () => [GraphQLUpload] }) files: Promise<Upload>[]) {
    return this.saveFiles(files);
  }

  @Subscription()
  async sampleSubscription(@CurrentUser() user: RequestUser) {
    Logger.log(`sampleSubscription subscribed to by user with id ${user.id}`);
    return pubSub.asyncIterator('sampleSubscription');
  }

  @Query()
  hi() {
    return this.client.send({ cmd: 'hi' }, {}).pipe(
      timeout({
        each: 5000,
        with: () => throwError(() => new Error('Too long')),
      })
    );
  }

  async saveFiles(files: Promise<Upload>[]) {
    return await Promise.all(
      files.map(async file => {
        const { filename, mimetype, encoding, createReadStream } = await file;
        Logger.log('Attachment:', filename, mimetype, encoding);
        const stream = createReadStream();

        return new Promise((resolve, reject) => {
          stream
            .on('close', () => {
              Logger.log(`${filename} ReadStream Closed`);
            })
            .on('error', err => {
              Logger.error(`${filename} ReadStream Error`, err);
            })
            .pipe(createWriteStream(`${this.UPLOAD_PATH}${filename}`))
            .on('close', () => {
              Logger.log(`${filename} WriteStream Closed`);
              resolve(`${filename} close`);
            })
            .on('error', err => {
              Logger.error(`${filename} WriteStream Error`, err);
              reject(`${filename} error`);
            });
        });
      })
    );
  }
}
