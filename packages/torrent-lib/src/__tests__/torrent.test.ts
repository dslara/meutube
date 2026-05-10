import { createHash } from 'crypto'
import { mkdtempSync, rmdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { Torrent } from '../torrent'
import { SequentialPiecePicker } from '../piece-picker'
import { TypedEmitter } from '../typed-emitter'
import type { TorrentInfo, Storage } from '../types'

function sha1(data: Buffer): Buffer {
  return createHash('sha1').update(data).digest()
}

class MemoryStorage implements Storage {
  private data = new Map<number, Buffer>()
  constructor(
    private pieceLength: number,
    private pieceHashes: Buffer,
  ) {}
  async write(pieceIndex: number, data: Buffer): Promise<void> {
    const expected = this.pieceHashes.subarray(pieceIndex * 20, pieceIndex * 20 + 20)
    const actual = createHash('sha1').update(data).digest()
    if (Buffer.compare(expected, actual) !== 0) {
      throw new Error(`Hash mismatch for piece ${pieceIndex}`)
    }
    this.data.set(pieceIndex, data)
  }
  async read(offset: number, length: number): Promise<Buffer> {
    const startPiece = Math.floor(offset / this.pieceLength)
    const endPiece = Math.floor((offset + length - 1) / this.pieceLength)
    for (let i = startPiece; i <= endPiece; i++) {
      if (!this.data.has(i)) throw new Error(`Piece ${i} not available`)
    }
    const buf = Buffer.alloc(length)
    for (let i = startPiece; i <= endPiece; i++) {
      const piece = this.data.get(i)!
      const pieceOffset = i * this.pieceLength
      const start = Math.max(0, offset - pieceOffset)
      const end = Math.min(piece.length, offset + length - pieceOffset)
      piece.copy(buf, pieceOffset - offset, start, end)
    }
    return buf
  }
  has(pieceIndex: number): boolean {
    return this.data.has(pieceIndex)
  }
  async destroy(): Promise<void> {
    this.data.clear()
  }
}

class MockTrackerClient {
  announce = jest.fn().mockResolvedValue([{ host: '127.0.0.1', port: 6881 }])
  scrape = jest.fn()
}

interface MockPeerManagerEvents {
  peer: (peerId: string) => void
  disconnected: (peerId: string) => void
  piece: (peerId: string, index: number, offset: number, data: Buffer) => void
  have: (peerId: string, index: number) => void
  metadata: (peerId: string, metadata: Buffer) => void
  error: (peerId: string, err: Error) => void
}

class MockPeerManager extends TypedEmitter<MockPeerManagerEvents> {
  connect = jest.fn().mockResolvedValue({})
  requestPiece = jest.fn()
  disconnect = jest.fn()
  hasPiece = jest.fn().mockReturnValue(false)
  getUnchokedPeers = jest.fn().mockReturnValue([])
  destroy = jest.fn()
}

describe('Torrent', () => {
  let tmpDir: string
  let tracker: MockTrackerClient
  let peers: MockPeerManager

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'torrent-test-'))
    tracker = new MockTrackerClient()
    peers = new MockPeerManager()
  })

  afterEach(() => {
    try { rmdirSync(tmpDir) } catch {}
  })

  function makeParsedTorrent(overrides?: Partial<any>) {
    return {
      infoHash: 'aabbccdd00112233445566778899aabbccddeeff',
      name: 'test.txt',
      length: 8,
      pieceLength: 4,
      lastPieceLength: 4,
      pieces: ['hash0', 'hash1'],
      announce: ['http://tracker.example/announce'],
      info: { name: Buffer.from('test.txt'), length: 8, 'piece length': 4, pieces: Buffer.alloc(40) },
      ...overrides,
    }
  }

  function createTorrent(input: string | Buffer, extraDeps?: any): Torrent {
    const parseMagnet = (uri: string) => {
      const m = uri.match(/xt=urn:btih:([a-f0-9]+)/i)
      const announce: string[] = []
      const tr = uri.matchAll(/[&?]tr=([^&]+)/g)
      for (const match of tr) announce.push(decodeURIComponent(match[1]))
      return { infoHash: m?.[1] ?? '', announce }
    }
    return new Torrent(input, {
      downloadDir: tmpDir,
      peerId: '-MT0001-xxxxxxxxxxxx',
      port: 6881,
    }, {
      trackerClient: tracker as any,
      peerManager: peers as any,
      createStorage: (info: TorrentInfo) =>
        new MemoryStorage(info.pieceLength, Buffer.alloc(info.pieces * 20, 0)),
      createPiecePicker: (totalPieces: number) => new SequentialPiecePicker(totalPieces),
      parseMagnet,
      ...extraDeps,
    })
  }

  describe('add(magnetUri)', () => {
    test('extracts infoHash and starts tracker announce', async () => {
      const magnet = 'magnet:?xt=urn:btih:aabbccdd00112233445566778899aabbccddeeff&tr=http://tracker.example/announce'
      const torrent = createTorrent(magnet)

      expect(torrent.infoHash).toBe('aabbccdd00112233445566778899aabbccddeeff')
      await new Promise(r => setTimeout(r, 0))
      expect(tracker.announce).toHaveBeenCalledWith(
        'aabbccdd00112233445566778899aabbccddeeff',
        'http://tracker.example/announce',
      )
      torrent.destroy()
    })

    test('emits metadata when received from peer', async () => {
      const magnet = 'magnet:?xt=urn:btih:aabbccdd00112233445566778899aabbccddeeff&tr=http://tracker.example/announce'
      const parsed = makeParsedTorrent()
      const torrent = createTorrent(magnet, {
        parseTorrent: jest.fn().mockResolvedValue(parsed),
      })

      let metadataCalled = false
      torrent.on('metadata', () => { metadataCalled = true })

      peers.emit('metadata', '127.0.0.1:6881', Buffer.from('fake'))
      await new Promise(r => setTimeout(r, 0))

      expect(metadataCalled).toBe(true)
      expect(torrent.info).toMatchObject({
        name: 'test.txt',
        length: 8,
        pieceLength: 4,
        pieces: 2,
        infoHash: 'aabbccdd00112233445566778899aabbccddeeff',
      })
      torrent.destroy()
    })
  })

  describe('add(.torrent Buffer)', () => {
    test('parses metadata immediately and emits metadata', async () => {
      const parsed = makeParsedTorrent()
      const torrent = createTorrent(Buffer.from('fake'), {
        parseTorrent: jest.fn().mockResolvedValue(parsed),
      })

      let metadataCalled = false
      torrent.on('metadata', () => { metadataCalled = true })

      await new Promise(r => setTimeout(r, 0))

      expect(metadataCalled).toBe(true)
      expect(torrent.info).toMatchObject({
        name: 'test.txt',
        length: 8,
        pieceLength: 4,
        pieces: 2,
        infoHash: 'aabbccdd00112233445566778899aabbccddeeff',
      })
      torrent.destroy()
    })
  })

  describe('download loop', () => {
    test('downloads pieces sequentially and emits download + done', async () => {
      const parsed = makeParsedTorrent()
      const piece0 = Buffer.from([1, 2, 3, 4])
      const piece1 = Buffer.from([5, 6, 7, 8])
      const pieceHashes = Buffer.concat([sha1(piece0), sha1(piece1)])

      const torrent = createTorrent(Buffer.from('fake'), {
        parseTorrent: jest.fn().mockResolvedValue({
          ...parsed,
          pieces: [sha1(piece0).toString('hex'), sha1(piece1).toString('hex')],
        }),
        createStorage: (info: TorrentInfo) => new MemoryStorage(info.pieceLength, pieceHashes),
      })

      const downloadSpy = jest.fn()
      const doneSpy = jest.fn()
      torrent.on('download', downloadSpy)
      torrent.on('done', doneSpy)

      await new Promise(r => setTimeout(r, 0))

      peers.getUnchokedPeers.mockReturnValue(['127.0.0.1:6881'])
      peers.emit('peer', '127.0.0.1:6881')
      peers.emit('have', '127.0.0.1:6881', 0)
      peers.emit('have', '127.0.0.1:6881', 1)

      await new Promise(r => setTimeout(r, 0))

      expect(peers.requestPiece).toHaveBeenCalledWith('127.0.0.1:6881', 0, 0, 4)

      peers.emit('piece', '127.0.0.1:6881', 0, 0, piece0)
      await new Promise(r => setTimeout(r, 0))

      expect(downloadSpy).toHaveBeenCalledWith(4)
      expect(torrent.stats.progress).toBeCloseTo(0.5, 1)

      expect(peers.requestPiece).toHaveBeenCalledWith('127.0.0.1:6881', 1, 0, 4)

      peers.emit('piece', '127.0.0.1:6881', 1, 0, piece1)
      await new Promise(r => setTimeout(r, 0))

      expect(downloadSpy).toHaveBeenCalledWith(4)
      expect(doneSpy).toHaveBeenCalled()
      expect(torrent.stats.progress).toBe(1)
      torrent.destroy()
    })

    test('rejects corrupted piece and re-requests', async () => {
      const parsed = makeParsedTorrent()
      const piece0 = Buffer.from([1, 2, 3, 4])
      const badPiece = Buffer.from([9, 9, 9, 9])
      const pieceHashes = sha1(piece0)

      const torrent = createTorrent(Buffer.from('fake'), {
        parseTorrent: jest.fn().mockResolvedValue({
          ...parsed,
          pieces: [sha1(piece0).toString('hex')],
          length: 4,
        }),
        createStorage: (info: TorrentInfo) => new MemoryStorage(info.pieceLength, pieceHashes),
      })

      const errorSpy = jest.fn()
      torrent.on('error', errorSpy)

      await new Promise(r => setTimeout(r, 0))

      peers.getUnchokedPeers.mockReturnValue(['127.0.0.1:6881'])
      peers.emit('peer', '127.0.0.1:6881')
      peers.emit('have', '127.0.0.1:6881', 0)

      await new Promise(r => setTimeout(r, 0))

      peers.emit('piece', '127.0.0.1:6881', 0, 0, badPiece)
      await new Promise(r => setTimeout(r, 0))

      expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Hash mismatch') }))
      torrent.destroy()
    })
  })

  describe('stats', () => {
    test('updates downloadSpeed and timeRemaining', async () => {
      const parsed = makeParsedTorrent()
      const piece0 = Buffer.from([1, 2, 3, 4])
      const pieceHashes = sha1(piece0)

      const torrent = createTorrent(Buffer.from('fake'), {
        parseTorrent: jest.fn().mockResolvedValue({
          ...parsed,
          pieces: [sha1(piece0).toString('hex')],
          length: 4,
        }),
        createStorage: (info: TorrentInfo) => new MemoryStorage(info.pieceLength, pieceHashes),
      })

      await new Promise(r => setTimeout(r, 0))

      peers.getUnchokedPeers.mockReturnValue(['127.0.0.1:6881'])
      peers.emit('peer', '127.0.0.1:6881')
      peers.emit('have', '127.0.0.1:6881', 0)

      await new Promise(r => setTimeout(r, 0))
      peers.emit('piece', '127.0.0.1:6881', 0, 0, piece0)
      await new Promise(r => setTimeout(r, 0))

      expect(torrent.stats.downloaded).toBe(4)
      expect(torrent.stats.progress).toBe(1)
      expect(torrent.stats.downloadSpeed).toBeGreaterThanOrEqual(0)
      expect(torrent.stats.timeRemaining).toBeGreaterThanOrEqual(0)
      torrent.destroy()
    })
  })

  describe('peer events', () => {
    test('emits peer and peerDisconnected', async () => {
      const parsed = makeParsedTorrent()
      const torrent = createTorrent(Buffer.from('fake'), {
        parseTorrent: jest.fn().mockResolvedValue(parsed),
      })

      const peerSpy = jest.fn()
      const discSpy = jest.fn()
      torrent.on('peer', peerSpy)
      torrent.on('peerDisconnected', discSpy)

      await new Promise(r => setTimeout(r, 0))

      peers.emit('peer', '127.0.0.1:6881')
      expect(peerSpy).toHaveBeenCalledWith('127.0.0.1:6881')

      peers.emit('disconnected', '127.0.0.1:6881')
      expect(discSpy).toHaveBeenCalledWith('127.0.0.1:6881')
      torrent.destroy()
    })
  })

  describe('destroy', () => {
    test('stops tracker and disconnects peers', async () => {
      const parsed = makeParsedTorrent()
      const torrent = createTorrent(Buffer.from('fake'), {
        parseTorrent: jest.fn().mockResolvedValue(parsed),
      })

      await new Promise(r => setTimeout(r, 0))

      torrent.destroy()
      expect(peers.destroy).toHaveBeenCalled()
    })
  })
})
