import { inject, Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';

@Injectable({
 providedIn: 'root'
})
export class RemoteService {
  private readonly apiService = inject(ApiService);

  constructor() { }

}
