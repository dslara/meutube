import { TorrentClient } from '../torrent-client'
import { Torrent } from '../torrent'
import * as index from '../index'

describe('TorrentClient', () => {
  test('can be created with downloadDir option', () => {
    const client = new TorrentClient({ downloadDir: '/tmp/downloads' })
    expect(client).toBeDefined()
  })

  test('add returns a Torrent with infoHash extracted from magnet URI', () => {
    const client = new TorrentClient({ downloadDir: '/tmp/downloads' })
    const magnet = 'magnet:?xt=urn:btih:abc123'
    const torrent = client.add(magnet)
    expect(torrent).toBeDefined()
    expect(torrent.infoHash).toBe('abc123')
  })
})

describe('Torrent', () => {
  test('emits typed metadata event', () => {
    const torrent = new Torrent('abc123')
    let called = false
    torrent.on('metadata', () => {
      called = true
    })
    torrent.emit('metadata')
    expect(called).toBe(true)
  })

  test('emits typed error event with Error payload', () => {
    const torrent = new Torrent('abc123')
    let receivedError: Error | null = null
    torrent.on('error', (err) => {
      receivedError = err
    })
    const err = new Error('test')
    torrent.emit('error', err)
    expect(receivedError).toBe(err)
  })
})

describe('public API', () => {
  test('exports TorrentClient, Torrent, TypedEmitter from index', () => {
    expect(index.TorrentClient).toBeDefined()
    expect(index.Torrent).toBeDefined()
    expect(index.TypedEmitter).toBeDefined()
  })
})
