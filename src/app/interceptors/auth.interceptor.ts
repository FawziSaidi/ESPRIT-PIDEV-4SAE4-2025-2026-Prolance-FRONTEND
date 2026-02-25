// interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the token from auth service
    const token = this.authService.getCurrentUser()?.token;
    
    console.log('🔑 AuthInterceptor - Token present:', !!token);
    
    // If token exists, clone the request and add Authorization header
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('📡 Request with auth header:', authReq.url);
      return next.handle(authReq);
    }
    
    // If no token, send request as is
    return next.handle(req);
  }
}