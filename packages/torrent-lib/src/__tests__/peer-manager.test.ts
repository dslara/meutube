import { PeerManager } from '../peer-manager'

describe('PeerManager', () => {
  test('connects to peer and completes handshake', async () => {
    const manager = new PeerManager()
    const infoHash = 'aaaaaaaaaaaaaaaaaaaa'
    const peerId = '-MT0001-xxxxxxxxxxxx'

    const peer = await manager.connect({ host: '127.0.0.1', port: 6881 }, infoHash, peerId)

    expect(peer).toBeDefined()
    expect(peer.infoHash).toBe(infoHash)
  })

  test('emits piece event when peer sends piece', async () => {
    const manager = new PeerManager()
    const infoHash = 'aaaaaaaaaaaaaaaaaaaa'
    const peerId = '-MT0001-xxxxxxxxxxxx'

    const wire = await manager.connect({ host: '127.0.0.1', port: 6881 }, infoHash, peerId)

    let received: { index: number; offset: number; data: Buffer } | null = null
    manager.on('piece', (_peerId, index, offset, data) => {
      received = { index, offset, data }
    })

    const pieceData = Buffer.from([1, 2, 3, 4])
    wire.receivePiece(0, 0, pieceData)

    expect(received).not.toBeNull()
    expect(received!.index).toBe(0)
    expect(received!.data).toEqual(pieceData)
  })

  test('throws when requesting from choked peer', async () => {
    const manager = new PeerManager()
    const infoHash = 'aaaaaaaaaaaaaaaaaaaa'
    const peerId = '-MT0001-xxxxxxxxxxxx'

    await manager.connect({ host: '127.0.0.1', port: 6881 }, infoHash, peerId)

    expect(() => {
      manager.requestPiece('127.0.0.1:6881', 0, 0, 16384)
    }).toThrow('choking')
  })

  test('tracks which pieces peer has via have', async () => {
    const manager = new PeerManager()
    const infoHash = 'aaaaaaaaaaaaaaaaaaaa'
    const peerId = '-MT0001-xxxxxxxxxxxx'

    const wire = await manager.connect({ host: '127.0.0.1', port: 6881 }, infoHash, peerId)

    expect(manager.hasPiece('127.0.0.1:6881', 0)).toBe(false)

    wire.receiveHave(0)

    expect(manager.hasPiece('127.0.0.1:6881', 0)).toBe(true)
  })

  test('allows request after peer unchokes', async () => {
    const manager = new PeerManager()
    const infoHash = 'aaaaaaaaaaaaaaaaaaaa'
    const peerId = '-MT0001-xxxxxxxxxxxx'

    const wire = await manager.connect({ host: '127.0.0.1', port: 6881 }, infoHash, peerId)

    expect(() => {
      manager.requestPiece('127.0.0.1:6881', 0, 0, 16384)
    }).toThrow('choking')

    wire.simulatePeerUnchoke()

    // Should not throw now
    expect(() => {
      manager.requestPiece('127.0.0.1:6881', 0, 0, 16384)
    }).not.toThrow()
  })

  test('emits disconnected when peer disconnects', async () => {
    const manager = new PeerManager()
    const infoHash = 'aaaaaaaaaaaaaaaaaaaa'
    const peerId = '-MT0001-xxxxxxxxxxxx'

    const wire = await manager.connect({ host: '127.0.0.1', port: 6881 }, infoHash, peerId)

    let disconnectedPeer: string | null = null
    manager.on('disconnected', (peerId) => {
      disconnectedPeer = peerId
    })

    wire.destroy()

    expect(disconnectedPeer).toBe('127.0.0.1:6881')
  })
})