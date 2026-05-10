import Wire from 'bittorrent-protocol'
import { TypedEmitter } from './typed-emitter'

interface PeerInfo {
  host: string
  port: number
}

interface PeerManagerEvents {
  peer: (peerId: string) => void
  disconnected: (peerId: string) => void
  piece: (peerId: string, index: number, offset: number, data: Buffer) => void
  have: (peerId: string, index: number) => void
  metadata: (peerId: string, metadata: Buffer) => void
  error: (peerId: string, err: Error) => void
  [event: string]: (...args: any[]) => void
}

export class PeerManager extends TypedEmitter<PeerManagerEvents> {
  private peers = new Map<string, Wire>()
  private peerBitfields = new Map<string, boolean[]>()

  async connect(peerInfo: PeerInfo, infoHash: string, peerId: string): Promise<Wire> {
    const wire = new Wire()
    const peerIdStr = `${peerInfo.host}:${peerInfo.port}`

    wire.handshake(infoHash, peerId)
    this.peers.set(peerIdStr, wire)
    this.peerBitfields.set(peerIdStr, [])

    wire.on('unchoke', () => {
      // peer unchoked us
    })

    wire.on('piece', (index: number, offset: number, buffer: Buffer) => {
      this.emit('piece', peerIdStr, index, offset, buffer)
    })

    wire.on('have', (index: number) => {
      const bitfield = this.peerBitfields.get(peerIdStr)!
      bitfield[index] = true
      this.emit('have', peerIdStr, index)
    })

    wire.on('close', () => {
      this.peers.delete(peerIdStr)
      this.peerBitfields.delete(peerIdStr)
      this.emit('disconnected', peerIdStr)
    })

    return wire
  }

  requestPiece(peerId: string, index: number, offset: number, length: number): void {
    const wire = this.peers.get(peerId)
    if (!wire) throw new Error(`Peer ${peerId} not found`)
    if (wire.peerChoking) throw new Error(`Peer ${peerId} is choking`)
    wire.request(index, offset, length)
  }

  disconnect(peerId: string): void {
    const wire = this.peers.get(peerId)
    if (wire) {
      wire.destroy()
    }
  }

  hasPiece(peerId: string, index: number): boolean {
    return this.peerBitfields.get(peerId)?.[index] ?? false
  }

  getUnchokedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([, wire]) => !wire.peerChoking)
      .map(([id]) => id)
  }

  destroy(): void {
    for (const wire of this.peers.values()) {
      wire.destroy()
    }
    this.peers.clear()
    this.peerBitfields.clear()
  }
}
