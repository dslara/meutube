import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TmdbModule } from './tmdb/tmdb.module';

@Module({
  imports: [TmdbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
