import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { AmqplibInstrumentation } from '@opentelemetry/instrumentation-amqplib';
import { Resource } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { environment } from './environments/environment';

if (environment.openTelemetry) {
  const provider = new NodeTracerProvider({
    resource: Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: environment.openTelemetry.serviceName,
      })
    ),
  });

  if (environment.openTelemetry.exporters?.enableConsole) {
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  if (environment.openTelemetry.exporters?.enableOtlp) {
    provider.addSpanProcessor(
      new BatchSpanProcessor(new OTLPTraceExporter(environment.openTelemetry.collectorOptions))
    );
  }

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new AmqplibInstrumentation(),
    ],
  });

  provider.register();
}
