import { Injectable } from '@nestjs/common';
import axios from 'axios'
import { IPirateBayResult } from '../model/providers.models';


@Injectable()
export class PirateBayService {
  private baseUrl = 'https://apibay.org';

  async search(query: string): Promise<IPirateBayResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/q.php?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erro na busca:', error);
      return [];
    }
  }

  async searchByCategory(query: string, category: string): Promise<IPirateBayResult[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/q.php?q=${encodeURIComponent(query)}&cat=${category}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro na busca por categoria:', error);
      return [];
    }
  }

  async getTorrentDetails(id: string): Promise<IPirateBayResult | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/t.php?id=${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes:', error);
      return null;
    }
  }

  // Gerar link magnet a partir do info_hash
  generateMagnetLink(torrent: IPirateBayResult): string {
    const trackers = [
      'udp://tracker.coppersurfer.tk:6969/announce',
      'udp://tracker.openbittorrent.com:6969/announce',
      'udp://tracker.leechers-paradise.org:6969/announce',
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://explodie.org:6969/announce'
    ];

    const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');

    return `magnet:?xt=urn:btih:${torrent.info_hash}&dn=${encodeURIComponent(torrent.name)}&${trackerParams}`;
  }

  // Filtrar resultados por seeders (mais populares)
  filterBySeeders(torrents: IPirateBayResult[], minSeeders: number = 10): IPirateBayResult[] {
    return torrents.filter(torrent => parseInt(torrent.seeders) >= minSeeders);
  }

  // Ordenar por seeders (mais populares primeiro)
  sortBySeeders(torrents: IPirateBayResult[]): IPirateBayResult[] {
    return torrents.sort((a, b) => parseInt(b.seeders) - parseInt(a.seeders));
  }
}
