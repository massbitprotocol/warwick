import { BaseExceptionFilter } from '@nestjs/core';

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor() {
    super();
  }

  async catch(
    exception: RuntimeException | HttpException,
    host: ArgumentsHost,
  ): Promise<any> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof BadRequestException) {
      const messages = exception['response']['message'];
      const statusCode = HttpStatus.BAD_REQUEST;
      response.status(statusCode).json({
        status: false,
        statusCode: statusCode,
        message: messages,
      });
    } else if (
      ['CastError', 'ValidationError'].includes(exception.constructor.name)
    ) {
      const statusCode = HttpStatus.BAD_REQUEST;
      response.status(statusCode).json({
        status: false,
        statusCode: statusCode,
        message: exception['message'].split('.,').map((msg) =>
          msg
            .split(':')
            .slice(-1)[0]
            .replace(/(`|Path)/g, '')
            .trim(),
        ),
      });
    } else if (exception instanceof ForbiddenException) {
      const statusCode = HttpStatus.FORBIDDEN;
      response.status(statusCode).json({
        status: false,
        statusCode: statusCode,
        message: 'Permission denied!',
      });
    } else if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      response.status(statusCode).json({
        status: false,
        statusCode,
        message: exception['response']['message'],
      });
    } else if (exception.constructor.name == 'TokenExpiredError') {
      const statusCode = HttpStatus.UNAUTHORIZED;
      response.status(statusCode).json({
        status: false,
        statusCode: statusCode,
        message: 'Token is expired',
      });
    } else {
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      if (typeof exception['message'] != 'undefined') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = exception['message'];
      }
      //error mongoose unique
      if (
        (exception['code'] || '') == 11000 &&
        typeof exception['errmsg'] != 'undefined'
      ) {
        message =
          exception['errmsg'].substring(
            exception['errmsg'].indexOf('index: ') + 7,
            exception['errmsg'].indexOf('_1'),
          ) + ' must be unique';
      }

      response.status(statusCode).json({
        status: false,
        statusCode: statusCode,
        message: message,
      });
    }
  }
}
