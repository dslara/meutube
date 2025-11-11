import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PirateBayController } from './piratebay/piratebay.controller';
import { PirateBayService } from './piratebay/piratebay.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    PirateBayController
  ],
  providers: [
    AppService,
    PirateBayService
  ],
})
export class AppModule {}
