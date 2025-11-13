import { Controller, Get, Param } from '@nestjs/common';
import { PirateBayService } from './piratebay.service';
import WebTorrent from 'webtorrent';

@Controller('torrents')
export class PirateBayController {
  private client = new WebTorrent();

  constructor(
    private readonly pirateBayService: PirateBayService,
  ) { }

  @Get(':name')
  async getData(@Param('name') name: string) {
    const result = await this.pirateBayService.search(name);
    const torrent = this.pirateBayService.sortBySeeders(
      this.pirateBayService.filterBySeeders(result, 10)
    )[0];

    const link = this.pirateBayService.generateMagnetLink(torrent);
    this.client.add(link, { path: '/home/dani/Documents/Media/Downloads' }, function (torrent) {
      torrent.on('done', function () {
        return 'torrent download finished'
      })
    })

  }
}
