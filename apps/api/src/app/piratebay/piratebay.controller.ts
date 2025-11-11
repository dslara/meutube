import { Controller, Get, Param } from '@nestjs/common';
import { PirateBayService } from './piratebay.service';

@Controller('torrents')
export class PirateBayController {
  constructor(
    private readonly pirateBayService: PirateBayService,
  ) { }

  @Get(':name')
  async getData(@Param('name') name: string) {
    const result = await this.pirateBayService.search(name);
    const torrent = this.pirateBayService.sortBySeeders(
      this.pirateBayService.filterBySeeders(result, 10)
    )[0];
    return this.pirateBayService.generateMagnetLink(torrent)

  }
}
