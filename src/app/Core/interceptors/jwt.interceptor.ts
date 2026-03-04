import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.services';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.authService.getCurrentUser();

    // Si l'utilisateur est connecté, on clone la requête et on ajoute le token
    if (user?.token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${user.token}`
        }
      });
      return next.handle(cloned);
    }

    // Sinon on laisse passer la requête sans modification
    return next.handle(req);
  }
}