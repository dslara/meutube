import { TorrentClient } from '../torrent-client'
import { Torrent } from '../torrent'

function parseMagnet(uri: string) {
  const m = uri.match(/xt=urn:btih:([a-f0-9]+)/i)
  const announce: string[] = []
  const tr = uri.matchAll(/[&?]tr=([^&]+)/g)
  for (const match of tr) announce.push(decodeURIComponent(match[1]))
  return { infoHash: m?.[1] ?? '', announce }
}

function parseTorrent(buf: Buffer) {
  if (buf.toString() === 'fake-torrent') {
    return {
      infoHash: 'aabbccdd00112233445566778899aabbccddeeff',
      name: 'test.txt',
      length: 8,
      pieceLength: 4,
      pieces: ['hash0', 'hash1'],
      announce: [],
    }
  }
  throw new Error('Invalid torrent')
}

describe('TorrentClient', () => {
  let client: TorrentClient

  beforeEach(() => {
    client = new TorrentClient(
      { downloadDir: '/tmp/downloads' },
      { parseMagnet, parseTorrent },
    )
  })

  afterEach(() => {
    client.destroy()
  })

  describe('add', () => {
    test('add(magnetUri) creates Torrent and adds to torrents list', () => {
      const magnet = 'magnet:?xt=urn:btih:abc123&tr=http://tracker.example/announce'
      const torrent = client.add(magnet)

      expect(torrent).toBeInstanceOf(Torrent)
      expect(client.torrents).toContain(torrent)
      expect(torrent.infoHash).toBe('abc123')
    })

    test('add(.torrent Buffer) creates Torrent and adds to torrents list', async () => {
      const torrent = client.add(Buffer.from('fake-torrent'))

      expect(torrent).toBeInstanceOf(Torrent)
      expect(client.torrents).toContain(torrent)

      await new Promise(r => setTimeout(r, 0))
      expect(torrent.infoHash).toBe('aabbccdd00112233445566778899aabbccddeeff')
    })

    test('throws when adding duplicate magnet URI', () => {
      const magnet = 'magnet:?xt=urn:btih:dup123&tr=http://tracker.example/announce'
      client.add(magnet)

      expect(() => client.add(magnet)).toThrow('duplicate')
    })
  })
})
