import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { API_TMDB_GENRES, API_TMDB_DISCOVER_MOVIE } from './tmdb.constants';
import { TMDB_ACCESS_TOKEN, TMDB_API_URL } from '../core/environment';
import { Genre, GenresResponse, DiscoverMovieQueryParams, DiscoverMoviesResponse } from './tmdb.models';

@Injectable()
export class TmdbService {
  private readonly apiUrl = TMDB_API_URL;
  private readonly logger = new Logger(TmdbService.name);
  private readonly headers = {
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
  };

  constructor(private readonly httpService: HttpService) {}

  async getGenres(params?: Record<string, any>): Promise<Genre[]> {
    try {
      return (await firstValueFrom(
        this.httpService.get<GenresResponse>(`${this.apiUrl}/${API_TMDB_GENRES}`, { params, headers: this.headers }),
      )).data.genres;

    } catch (err) {
      this.logger.error('Failed to fetch genres from TMDB', err as any);
      throw err;
    }
  }

  async discoverMovies(params?: DiscoverMovieQueryParams): Promise<DiscoverMoviesResponse> {
    try {
      const endpoint = `${this.apiUrl}/${API_TMDB_DISCOVER_MOVIE}`;
      return (await firstValueFrom(
        this.httpService.get<DiscoverMoviesResponse>(endpoint, { params, headers: this.headers }),
      )).data;

    } catch (err) {
      this.logger.error('Failed to discover movies from TMDB', err as any);
      throw err;
    }
  }
}
