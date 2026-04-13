import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Skip token for preflight requests — browsers send OPTIONS without credentials
    if (req.method === 'OPTIONS') {
      return next.handle(req);
    }

    const token = this.authService.getCurrentUser()?.token;

    console.log('🔑 AuthInterceptor - Token present:', !!token);

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('📡 Request with auth header:', authReq.url);
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}