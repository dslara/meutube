import { Controller, Get, Query } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('genres')
  async getGenres(@Query() query: Record<string, any>) {
    return this.tmdbService.getGenres(query);
  }
}
