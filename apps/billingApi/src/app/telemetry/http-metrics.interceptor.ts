import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ValueType } from '@opentelemetry/api';
import { Request, Response } from 'express';
import { throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
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
    let capturedError: unknown;
    let recorded = false;

    const recordOnce = () => {
      if (recorded) {
        return;
      }

      recorded = true;
      this.record(request, response, startTime, capturedError);
    };

    response.once('finish', recordOnce);
    response.once('close', recordOnce);

    return next.handle().pipe(
      catchError((error: unknown) => {
        capturedError = error;
        return throwError(() => error);
      }),
      finalize(() => {
        if (response.writableEnded || response.destroyed) {
          recordOnce();
        }
      }),
    );
  }

  private record(request: Request, response: Response, startTime: bigint, error?: unknown) {
    const elapsedNs = process.hrtime.bigint() - startTime;
    const elapsedMs = Number(elapsedNs) / 1_000_000;

    const attributes = {
      'http.request.method': request.method || 'UNKNOWN',
      'http.route': this.getRoute(request),
      'http.response.status_code': response.statusCode,
      ...this.getErrorAttributes(error, response.statusCode),
    };

    this.requestCounter.add(1, attributes);
    this.requestDuration.record(elapsedMs, attributes);
  }

  private getErrorAttributes(error: unknown, statusCode: number) {
    if (!error && statusCode < 400) {
      return {};
    }

    let errorType = `http_${statusCode}`;
    let errorMessage = `HTTP ${statusCode}`;

    if (error instanceof Error) {
      errorType = error.name || errorType;
      errorMessage = error.message || errorMessage;
    }

    const maybeHttpExceptionResponse = (error as { getResponse?: () => unknown } | undefined)?.getResponse?.();
    if (typeof maybeHttpExceptionResponse === 'string') {
      errorMessage = maybeHttpExceptionResponse;
    }

    if (maybeHttpExceptionResponse && typeof maybeHttpExceptionResponse === 'object') {
      const responseObject = maybeHttpExceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      if (typeof responseObject.error === 'string' && responseObject.error.trim().length > 0) {
        errorType = responseObject.error;
      }

      if (typeof responseObject.message === 'string' && responseObject.message.trim().length > 0) {
        errorMessage = responseObject.message;
      }

      if (Array.isArray(responseObject.message) && responseObject.message.length > 0) {
        errorMessage = responseObject.message.join('; ');
      }
    }

    return {
      'error.type': errorType,
      'error.message': this.normalizeErrorMessage(errorMessage),
    };
  }

  private normalizeErrorMessage(message: string) {
    const normalized = message.replace(/\s+/g, ' ').trim();
    if (normalized.length <= 300) {
      return normalized;
    }

    return `${normalized.slice(0, 297)}...`;
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