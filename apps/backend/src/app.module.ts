import { Module } from '@nestjs/common';
import { TmdbModule } from './tmdb/tmdb.module';
import { WebModule } from './web/web.module';

@Module({
  imports: [TmdbModule, WebModule],
})
export class AppModule {}
