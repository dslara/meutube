import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { Card, CardProps, Home, HomeProps } from 'ui';
import { renderComponent, renderPage } from '../shared/utils/render.utils';
import { TmdbService } from '../tmdb/tmdb.service';
import type { DiscoverMovieQueryParams } from '../tmdb/tmdb.models';

@Controller('web')
export class WebController {
  constructor(
    private readonly tmdbService: TmdbService,
  ) { }

  @Get('')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getHome(@Query() query: Record<string, any>) {
    const generes = await this.tmdbService.getGenres(query);
    const data = {
      title: 'Home',
      generes: generes.map(({ id, name }) => ({ value: `${id}`, label: name }))
    };

    return renderPage<HomeProps>(Home, data);
  }

  @Post('results')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getFilter(@Body() body: DiscoverMovieQueryParams) {
    const results = await this.tmdbService.discoverMovies(body);
   
    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
        ${results.results.map((movie) => renderComponent<CardProps>(
          Card,
          {
            image: `https://media.themoviedb.org/t/p/w440_and_h660_face${movie.poster_path}`,
            title: `${movie.vote_average}`
          }
        )).join('')}
      </div>
    `;
  }
}