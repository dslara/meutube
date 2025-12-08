import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { API_TMDB_GENRES } from './tmdb.constants';

@Injectable()
export class TmdbService {
  private readonly apiUrl = process.env.TMDB_API_URL;
  private readonly logger = new Logger(TmdbService.name);
  private readonly headers = {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  };

  constructor(private readonly httpService: HttpService) {}

  async getGenres(params?: Record<string, any>) {
    try {
      return (await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/${API_TMDB_GENRES}`, { params, headers: this.headers }),
      )).data;

    } catch (err) {
      this.logger.error('Failed to fetch genres from TMDB', err as any);
      throw err;
    }
  }
}
