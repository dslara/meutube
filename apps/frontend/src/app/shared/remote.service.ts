import { inject, Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';

@Injectable({
 providedIn: 'root'
})
export class RemoteService {
  private readonly apiService = inject(ApiService);

  public getMagnetLink$(name: string) {
    return this.apiService.get$(`api/torrents/${name}`)
  }

}
