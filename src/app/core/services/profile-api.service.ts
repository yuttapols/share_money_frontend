import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AvatarResponse, UpdateProfileRequest, UserProfile } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);

  getMine(): Observable<UserProfile> {
    return this.http
      .get<ApiResponse<UserProfile>>(`${environment.apiUrl}/profile/me`)
      .pipe(map((response) => response.data));
  }

  updateMine(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http
      .put<ApiResponse<UserProfile>>(`${environment.apiUrl}/profile/me`, request)
      .pipe(map((response) => response.data));
  }

  uploadAvatar(file: File): Observable<AvatarResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<AvatarResponse>>(`${environment.apiUrl}/profile/me/avatar`, formData)
      .pipe(map((response) => response.data));
  }

  deleteAvatar(): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/profile/me/avatar`).pipe(map(() => undefined));
  }
}
