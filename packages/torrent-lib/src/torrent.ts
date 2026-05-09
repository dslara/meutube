import type { TorrentInfo, TorrentStats, TorrentEvents } from './types'
import { TypedEmitter } from './typed-emitter'

export class Torrent extends TypedEmitter<TorrentEvents> {
  info: TorrentInfo | null = null
  stats: TorrentStats = {
    downloaded: 0,
    uploaded: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    peers: 0,
    progress: 0,
    timeRemaining: 0,
  }

  constructor(public readonly infoHash: string) {
    super()
  }
}
