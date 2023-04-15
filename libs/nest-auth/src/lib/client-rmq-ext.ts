import { Injectable } from '@nestjs/common';
import { ClientRMQ, RmqOptions, RmqRecordBuilder } from '@nestjs/microservices';
import { ClsService, ClsServiceManager } from 'nestjs-cls';
import { Observable } from 'rxjs';

@Injectable()
export class ClientRMQExt extends ClientRMQ {
  cls: ClsService;

  constructor(options: RmqOptions['options']) {
    super(options);

    this.cls = ClsServiceManager.getClsService();
  }

  send<TResult = any, TInput = any>(pattern: any, data: TInput): Observable<TResult> {
    const token = this.cls.get('token');
    const options: { headers?: { Authorization?: string } } = {};

    if (token) {
      options.headers = { ['Authorization']: token };
    }

    const record = new RmqRecordBuilder(data).setOptions(options).build();

    return super.send(pattern, record);
  }
}
