import type { TorrentInfo, TorrentStats, TorrentEvents, Storage, PiecePicker } from './types'
import { TypedEmitter } from './typed-emitter'
import { TrackerClient } from './tracker-client'
import { PeerManager } from './peer-manager'
import { DiskStorage } from './storage'
import { SequentialPiecePicker } from './piece-picker'
import { join } from 'path'
import { Readable } from 'stream'

interface TorrentOptions {
  downloadDir: string
  peerId: string
  port: number
  maxPeers?: number
}

interface TorrentDeps {
  trackerClient?: TrackerClient
  peerManager?: PeerManager
  createStorage?: (info: TorrentInfo) => Storage
  createPiecePicker?: (totalPieces: number) => PiecePicker
  parseMagnet?: (uri: string) => any | Promise<any>
  parseTorrent?: (buf: Buffer) => any | Promise<any>
}

export class Torrent extends TypedEmitter<TorrentEvents> {
  info: TorrentInfo | null = null
  infoHash: string = ''
  private options: TorrentOptions
  private deps: Required<Pick<TorrentDeps, 'createStorage' | 'createPiecePicker'>> &
    Pick<TorrentDeps, 'trackerClient' | 'peerManager' | 'parseMagnet' | 'parseTorrent'>
  private trackerClient: TrackerClient
  private peerManager: PeerManager
  private storage: Storage | null = null
  private piecePicker: PiecePicker | null = null
  private inFlight = new Set<number>()
  private peerPieces = new Map<string, Set<number>>()
  private destroyed = false
  private discoveryStarted = false
  private speedWindow: { time: number; bytes: number }[] = []
  private streams = new Set<Readable>()

  stats: TorrentStats = {
    downloaded: 0,
    uploaded: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    peers: 0,
    progress: 0,
    timeRemaining: 0,
  }

  constructor(
    private input: string | Buffer,
    options: TorrentOptions,
    deps?: TorrentDeps,
  ) {
    super()
    this.options = options
    this.deps = {
      createStorage:
        deps?.createStorage ??
        ((info: TorrentInfo) =>
          new DiskStorage(
            join(this.options.downloadDir, info.name),
            info.pieceLength,
            Buffer.alloc(info.pieces * 20),
          )),
      createPiecePicker: deps?.createPiecePicker ?? ((total: number) => new SequentialPiecePicker(total)),
      parseMagnet: deps?.parseMagnet,
      parseTorrent: deps?.parseTorrent,
      trackerClient: deps?.trackerClient,
      peerManager: deps?.peerManager,
    }
    // Synchronous extraction for sync parsers (magnet URI)
    if (typeof this.input === 'string' && this.deps.parseMagnet) {
      try {
        const parsed = this.deps.parseMagnet(this.input)
        if (parsed && typeof parsed.then !== 'function') {
          this.infoHash = parsed.infoHash ?? ''
        }
      } catch {}
    }
    this.trackerClient = this.deps.trackerClient ?? new TrackerClient({ port: this.options.port })
    this.peerManager = this.deps.peerManager ?? new PeerManager()
    this.setupPeerListeners()
    this.init()
  }

  private setupPeerListeners(): void {
    this.peerManager.on('peer', (peerId: string) => {
      this.stats.peers = this.peerManager.getUnchokedPeers().length
      this.emit('peer', peerId)
      this.tryDownload()
    })

    this.peerManager.on('disconnected', (peerId: string) => {
      this.peerPieces.delete(peerId)
      this.stats.peers = this.peerManager.getUnchokedPeers().length
      this.emit('peerDisconnected', peerId)
    })

    this.peerManager.on('metadata', async (_peerId: string, metadata: Buffer) => {
      if (this.info) return
      try {
        if (!this.deps.parseTorrent) {
          this.emit('error', new Error('parseTorrent not available'))
          return
        }
        const parsed = await this.deps.parseTorrent(metadata)
        this.handleParsedMetadata(parsed)
      } catch (err) {
        this.emit('error', err as Error)
      }
    })

    this.peerManager.on('have', (peerId: string, index: number) => {
      if (!this.peerPieces.has(peerId)) {
        this.peerPieces.set(peerId, new Set())
      }
      this.peerPieces.get(peerId)!.add(index)
      this.tryDownload()
    })

    this.peerManager.on('piece', (_peerId: string, index: number, _offset: number, data: Buffer) => {
      this.handlePiece(index, data)
    })

    this.peerManager.on('error', (_peerId: string, err: Error) => {
      this.emit('error', err)
    })
  }

  private async init(): Promise<void> {
    try {
      if (typeof this.input === 'string') {
        const parsed = this.deps.parseMagnet ? await this.deps.parseMagnet(this.input) : { infoHash: '', announce: [] }
        this.infoHash = parsed.infoHash ?? ''
        const announce: string[] = parsed.announce ?? []
        if (!this.infoHash) {
          this.emit('error', new Error('Invalid magnet URI'))
          return
        }
        this.startDiscovery(announce)
      } else {
        if (!this.deps.parseTorrent) {
          this.emit('error', new Error('parseTorrent not provided'))
          return
        }
        const parsed = await this.deps.parseTorrent(this.input)
        this.handleParsedMetadata(parsed)
      }
    } catch (err) {
      this.emit('error', err as Error)
    }
  }

  private async startDiscovery(announce: string[]): Promise<void> {
    if (this.discoveryStarted) return
    this.discoveryStarted = true

    for (const url of announce) {
      try {
        const peers = await this.trackerClient.announce(this.infoHash, url)
        for (const p of peers) {
          await this.peerManager.connect(p, this.infoHash, this.options.peerId)
        }
      } catch (err) {
        this.emit('error', err as Error)
      }
    }
  }

  private handleParsedMetadata(parsed: any): void {
    if (this.info) return

    this.infoHash = parsed.infoHash ?? this.infoHash
    const piecesCount = Array.isArray(parsed.pieces) ? parsed.pieces.length : parsed.pieces

    this.info = {
      name: parsed.name ?? '',
      length: parsed.length ?? 0,
      pieceLength: parsed.pieceLength ?? 0,
      pieces: piecesCount,
      infoHash: this.infoHash,
    }

    this.storage = this.deps.createStorage(this.info)
    this.piecePicker = this.deps.createPiecePicker(this.info.pieces)

    this.emit('metadata')

    if (!this.discoveryStarted && parsed.announce?.length > 0) {
      this.startDiscovery(parsed.announce)
    }

    this.tryDownload()
  }

  private tryDownload(): void {
    if (!this.info || !this.piecePicker || !this.storage || this.destroyed) return

    const unchoked = this.peerManager.getUnchokedPeers()
    for (const peerId of unchoked) {
      const available = this.peerPieces.get(peerId)
      if (!available || available.size === 0) continue

      const next = this.piecePicker.getNext(available, this.inFlight)
      if (next === null) continue

      this.piecePicker.markRequested(next)
      this.inFlight.add(next)

      const isLastPiece = next === this.info.pieces - 1
      const length = isLastPiece
        ? this.info.length - next * this.info.pieceLength
        : this.info.pieceLength

      this.peerManager.requestPiece(peerId, next, 0, length)
    }
  }

  private async handlePiece(index: number, data: Buffer): Promise<void> {
    if (!this.storage || !this.piecePicker || !this.info) return

    this.inFlight.delete(index)

    try {
      await this.storage.write(index, data)
    } catch (err) {
      this.emit('error', err as Error)
      this.tryDownload()
      return
    }

    this.piecePicker.markReceived(index)
    this.stats.downloaded += data.length
    this.emit('download', data.length)
    this.updateProgress()
    this.updateSpeed(data.length)

    if (this.piecePicker.remaining === 0) {
      this.emit('done')
      this.stopSpeedTimer()
      return
    }

    this.tryDownload()
  }

  private updateProgress(): void {
    if (!this.info) return
    this.stats.progress = this.info.pieces > 0 ? (this.info.pieces - (this.piecePicker?.remaining ?? 0)) / this.info.pieces : 0
  }

  private updateSpeed(bytes: number): void {
    const now = Date.now()
    this.speedWindow.push({ time: now, bytes })
    const cutoff = now - 10000
    this.speedWindow = this.speedWindow.filter((w) => w.time > cutoff)

    const totalBytes = this.speedWindow.reduce((sum, w) => sum + w.bytes, 0)
    const windowDuration = now - (this.speedWindow[0]?.time ?? now)
    this.stats.downloadSpeed = windowDuration > 0 ? (totalBytes / windowDuration) * 1000 : 0

    const remaining = (this.piecePicker?.remaining ?? 0) * (this.info?.pieceLength ?? 0)
    this.stats.timeRemaining = this.stats.downloadSpeed > 0 ? remaining / this.stats.downloadSpeed : 0
  }

  private stopSpeedTimer(): void {
    this.stats.timeRemaining = 0
  }

  createReadStream(range?: { start?: number; end?: number }): Readable {
    if (!this.info || !this.storage) {
      throw new Error('Metadata not available')
    }

    const start = Math.max(0, range?.start ?? 0)
    const end = Math.min(this.info.length - 1, range?.end ?? this.info.length - 1)

    if (start > end || start >= this.info.length) {
      const empty = new Readable({ read() {} })
      empty.push(null)
      return empty
    }

    let offset = start
    let filling = false

    const stream = new Readable({
      read() {
        if (!filling && !stream.destroyed && offset <= end) {
          fill().catch(err => stream.destroy(err))
        }
      },
    })

    const fill = async () => {
      if (filling || stream.destroyed || offset > end) return
      filling = true

      try {
        while (offset <= end && !stream.destroyed) {
          const bytesInPiece = this.info!.pieceLength - (offset % this.info!.pieceLength)
          const chunkSize = Math.min(64 * 1024, end - offset + 1, bytesInPiece)
          const data = await this.storage!.read(offset, chunkSize)
          offset += data.length
          if (!stream.push(data)) {
            break
          }
        }
        if (offset > end && !stream.destroyed) {
          stream.push(null)
        }
      } catch (err) {
        if ((err as Error).message.includes('not available')) {
          // Piece not yet downloaded, wait for next download event
        } else {
          stream.destroy(err as Error)
        }
      } finally {
        filling = false
      }
    }

    const onDownload = () => {
      if (!filling && !stream.destroyed && offset <= end) {
        fill().catch(err => stream.destroy(err))
      }
    }

    this.on('download', onDownload)

    stream.on('close', () => {
      this.off('download', onDownload)
      this.streams.delete(stream)
    })

    this.streams.add(stream)
    return stream
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.stopSpeedTimer()
    for (const stream of Array.from(this.streams)) {
      stream.destroy()
    }
    this.streams.clear()
    this.peerManager.destroy()
    this.storage?.destroy()
  }
}
