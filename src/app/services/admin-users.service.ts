import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AdminUser } from '../pages/admin/user/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private apiUrl = 'http://localhost:8089/pidev/api/auth/users';


  constructor(private http: HttpClient) {}

  getAll(): Observable<AdminUser[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        // If backend wraps in { data: [...] }
        if (res.data) return res.data as AdminUser[];
        // Otherwise return as is
        return res as AdminUser[];
      })
    );
  }

  create(user: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, user);
  }

  update(id: number, user: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/${id}`, user);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

