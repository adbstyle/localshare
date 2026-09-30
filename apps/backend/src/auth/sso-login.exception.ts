import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

export type SsoLoginError =
  | 'email_missing'
  | 'email_not_verified'
  | 'account_exists'
  | 'account_deleted';

export class SsoLoginException extends UnauthorizedException {
  constructor(readonly code: SsoLoginError) {
    super(code);
  }
}

// OAuth callbacks are browser navigations, so show the error in the frontend
// instead of returning a JSON 401 on the API domain.
@Catch(SsoLoginException)
export class SsoLoginExceptionFilter implements ExceptionFilter {
  catch(exception: SsoLoginException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?error=${exception.code}`,
    );
  }
}
