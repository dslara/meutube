// apps/api/src/app/torrent/torrent.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import WebTorrent from 'webtorrent';

@Injectable()
export class TorrentService implements OnModuleInit {
  private client: WebTorrent.Instance;

  async onModuleInit() {
    await this.initializeClient();
  }

  private async initializeClient() {
    // Importação dinâmica se necessário
    const WebTorrent = (await import('webtorrent')).default;
    this.client = new WebTorrent();

    console.log('WebTorrent client initialized');
  }

  async downloadTorrent(magnetUri: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.add(magnetUri, (torrent) => {
        console.log('Downloading:', torrent.name);

        torrent.on('done', () => {
          console.log('Download completed');
          resolve({
            name: torrent.name,
            files: torrent.files.map(file => file.name),
            path: torrent.path
          });
        });

        torrent.on('error', reject);
      });
    });
  }

  getClient(): WebTorrent.Instance {
    return this.client;
  }
}
