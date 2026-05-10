import type { TorrentClientOptions } from './types'
import { Torrent } from './torrent'

function parseMagnetSync(uri: string): { infoHash: string; announce: string[] } {
  const match = uri.match(/xt=urn:btih:([a-f0-9]+)/i)
  const infoHash = match ? match[1] ?? '' : ''
  const announce: string[] = []
  const trMatches = uri.matchAll(/[&?]tr=([^&]+)/g)
  for (const m of trMatches) {
    const url = m[1]
    if (url) announce.push(decodeURIComponent(url))
  }
  return { infoHash, announce }
}

export class TorrentClient {
  constructor(public readonly options: TorrentClientOptions) {}

  add(input: string | Buffer): Torrent {
    if (typeof input === 'string') {
      return new Torrent(input, {
        downloadDir: this.options.downloadDir,
        peerId: '-MT0001-xxxxxxxxxxxx',
        port: 6881,
        maxPeers: this.options.maxPeers,
      }, {
        parseMagnet: parseMagnetSync,
      })
    }
    return new Torrent(input, {
      downloadDir: this.options.downloadDir,
      peerId: '-MT0001-xxxxxxxxxxxx',
      port: 6881,
      maxPeers: this.options.maxPeers,
    }, {
      parseTorrent: async (buf: Buffer) => {
        const { default: parse } = await import('parse-torrent')
        return parse(buf)
      },
    })
  }
}
