import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ValueType } from '@opentelemetry/api';
import { Request, Response } from 'express';
import { tap } from 'rxjs/operators';
import { getServiceMeter } from './metrics';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly meter = getServiceMeter();

  private readonly requestCounter = this.meter.createCounter('http.server.requests.count', {
    description: 'Total de requisições HTTP recebidas pelo serviço',
    valueType: ValueType.INT,
  });

  private readonly requestDuration = this.meter.createHistogram('http.server.request.duration', {
    description: 'Duração das requisições HTTP processadas pelo serviço',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType<'http'>() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startTime = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.record(request, response, startTime),
        error: () => this.record(request, response, startTime),
      }),
    );
  }

  private record(request: Request, response: Response, startTime: bigint) {
    const elapsedNs = process.hrtime.bigint() - startTime;
    const elapsedMs = Number(elapsedNs) / 1_000_000;

    const attributes = {
      'http.request.method': request.method || 'UNKNOWN',
      'http.route': this.getRoute(request),
      'http.response.status_code': response.statusCode,
    };

    this.requestCounter.add(1, attributes);
    this.requestDuration.record(elapsedMs, attributes);
  }

  private getRoute(request: Request): string {
    const routePath = request.route?.path;
    if (!routePath) {
      return request.path || 'unknown';
    }

    const baseUrl = request.baseUrl || '';
    return `${baseUrl}${routePath}` || '/';
  }
}