import type { TorrentClientOptions } from './types'
import { Torrent } from './torrent'

function parseInfoHash(magnetUri: string): string {
  const match = magnetUri.match(/xt=urn:btih:([a-f0-9]+)/i)
  return match?.[1] ?? ''
}

export class TorrentClient {
  constructor(public readonly options: TorrentClientOptions) {}

  add(magnetUri: string): Torrent {
    const infoHash = parseInfoHash(magnetUri)
    return new Torrent(infoHash)
  }
}
