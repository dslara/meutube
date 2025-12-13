import { Module } from '@nestjs/common';
import { WebController } from './web.controller';
import { HttpModule } from '@nestjs/axios';
import { TmdbService } from '../tmdb/tmdb.service';

@Module({
  imports: [
    HttpModule
  ],
  controllers: [WebController],
  providers: [
    TmdbService,
  ],
})
export class WebModule {}