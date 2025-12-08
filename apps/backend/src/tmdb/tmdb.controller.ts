import { Controller, Get, Query, Header, Param } from '@nestjs/common';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Home } from 'ui';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) { }
  
  @Get('home')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHome() {
    const data = { title: 'Monorepo HTMX-TSX' };
    const html = renderToString(createElement(Home, data));

    return `<!DOCTYPE html>${html}`;
  }

  @Get('genres')
  async getGenres(@Query() query: Record<string, any>) {
    return this.tmdbService.getGenres(query);
  }

  @Get('genres/html')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getGenresHtml(@Query() query: Record<string, any>) {
    const data: any = await this.tmdbService.getGenres(query);
    const genres: Array<{ id: number; name: string }> = data?.genres || [];

    const buttons = genres.map((g) =>`
      <button
        type="button"
        class="genre-btn"
        data-id="${g.id}"
        hx-get="/tmdb/genres/${g.id}/html"
        hx-target="#detail"
        hx-swap="innerHTML">
        ${g.name}
      </button>
    `).join('');

    return `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>TMDB Genres</title>
          <script src="https://unpkg.com/htmx.org@1.9.4"></script>
        </head>
        <body>
          <h1>Gêneros</h1>
          <div class="container">
            ${buttons}
          </div>
          <div id="detail" aria-live="polite"></div>
        </body>
      </html>
    `;
  }

  @Get('genres/:id/html')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getGenreFragment(@Param('id') id: string) {
    const data: any = await this.tmdbService.getGenres();
    const genres: Array<{ id: number; name: string }> = data?.genres || [];
    const g = genres.find((x) => String(x.id) === String(id));

    return `<div class="genre-detail"><h2>${g?.name}</h2><p>ID: ${g?.id}</p></div>`;
  }
}
