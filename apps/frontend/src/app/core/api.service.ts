import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  public get$<RESPONSE = any>(url: string, params?: HttpParams, headers?: HttpHeaders): Observable<RESPONSE> {
    return this.http.get<RESPONSE>(url, { params, headers });
  }

  public post$<RESPONSE = any, BODY = any>(url: string, body?: BODY, headers?: HttpHeaders): Observable<RESPONSE> {
    return this.http.post<RESPONSE>(url, body, { headers });
  }
}
