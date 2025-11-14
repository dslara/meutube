import { Controller, Get, Param } from '@nestjs/common';
import { PirateBayService } from './piratebay.service';
import { TorrentService } from './webtorrent.service';

@Controller('torrents')
export class PirateBayController {

  constructor(
    private readonly pirateBayService: PirateBayService,
    private readonly torrentService: TorrentService,
  ) { }

  @Get(':name')
  async getData(@Param('name') name: string) {
    const result = await this.pirateBayService.search(name);
    const torrent = this.pirateBayService.sortBySeeders(
      this.pirateBayService.filterBySeeders(result, 10)
    )[0];


    const link = this.pirateBayService.generateMagnetLink(torrent);
    return this.torrentService.downloadTorrent(link);

  }
}
