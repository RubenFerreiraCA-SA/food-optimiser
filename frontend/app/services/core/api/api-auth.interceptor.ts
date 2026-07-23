import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiBaseUrl.replace(/\/$/, ''))) {
    return next(request);
  }

  const auth = inject(AuthService);
  const uid = auth.user()?.uid;
  return next(
    uid
      ? request.clone({
          setHeaders: {
            'X-User-Id': uid,
          },
        })
      : request,
  );
};
