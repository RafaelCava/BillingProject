import { Logger } from '@nestjs/common';
import { metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { HostMetrics } from '@opentelemetry/host-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const DEFAULT_EXPORT_INTERVAL_MS = 10000;
const DEFAULT_METRICS_PATH = '/v1/metrics';

export type MetricsSetup = {
  enabled: boolean;
  shutdown: () => Promise<void>;
};

function normalizeEndpoint(baseEndpoint: string): string {
  const endpoint = baseEndpoint.trim();
  if (endpoint.endsWith(DEFAULT_METRICS_PATH)) {
    return endpoint;
  }

  return `${endpoint.replace(/\/$/, '')}${DEFAULT_METRICS_PATH}`;
}

function resolveMetricsEndpoint(): string {
  const directEndpoint = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
  if (directEndpoint) {
    return directEndpoint;
  }

  const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  return normalizeEndpoint(baseEndpoint);
}

function parseExportInterval(): number {
  const raw = process.env.OTEL_METRIC_EXPORT_INTERVAL;
  if (!raw) {
    return DEFAULT_EXPORT_INTERVAL_MS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EXPORT_INTERVAL_MS;
}

export function setupOpenTelemetryMetrics(): MetricsSetup {
  if (process.env.OTEL_METRICS_ENABLED === 'false') {
    Logger.log({ module: 'OpenTelemetry', action: 'metrics', phase: 'disabled' }, 'OpenTelemetry');
    return {
      enabled: false,
      shutdown: async () => Promise.resolve(),
    };
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'billing-api';
  const serviceVersion = process.env.OTEL_SERVICE_VERSION || '0.0.1';
  const exportIntervalMillis = parseExportInterval();
  const endpoint = resolveMetricsEndpoint();

  const metricExporter = new OTLPMetricExporter({ url: endpoint });
  const metricReader = new PeriodicExportingMetricReader({ exporter: metricExporter, exportIntervalMillis });

  const meterProvider = new MeterProvider({
    readers: [metricReader],
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
    }),
  });

  metrics.setGlobalMeterProvider(meterProvider);

  const hostMetrics = new HostMetrics({
    meterProvider,
    name: `${serviceName}-host-metrics`,
  });
  hostMetrics.start();

  Logger.log(
    { module: 'OpenTelemetry', action: 'metrics', phase: 'enabled', endpoint, exportIntervalMillis, serviceName },
    'OpenTelemetry',
  );

  return {
    enabled: true,
    shutdown: async () => {
      await meterProvider.shutdown();
      Logger.log({ module: 'OpenTelemetry', action: 'metrics', phase: 'shutdown' }, 'OpenTelemetry');
    },
  };
}

export function getServiceMeter() {
  return metrics.getMeter('billing-api-meter', '1.0.0');
}