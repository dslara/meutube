import { EventEmitter } from 'events'
import { Duplex } from 'stream'

interface WireOpts {
  [key: string]: any
}

class MockWire extends Duplex {
  peerId?: string
  infoHash?: string
  amChoking = true
  peerChoking = true
  amInterested = false
  peerInterested = false
  bitfield: boolean[] = []
  destroyed = false
  private _peer?: MockWire
  private _extensions: Map<string, any> = new Map()

  constructor(_opts?: WireOpts) {
    super({ objectMode: true })
  }

  use(ext: any) {
    const instance = new ext(this)
    this._extensions.set(ext.name, instance)
    return instance
  }

  handshake(infoHash: string, peerId: string, _extensions?: any) {
    this.infoHash = infoHash
    this.peerId = peerId
    queueMicrotask(() => this.emit('handshake', infoHash, peerId))
  }

  interested() {
    this.amInterested = true
    if (this._peer) {
      this._peer.peerInterested = true
      this._peer.emit('interested')
    }
  }

  uninterested() {
    this.amInterested = false
    if (this._peer) {
      this._peer.peerInterested = false
      this._peer.emit('uninterested')
    }
  }

  choke() {
    this.amChoking = true
    if (this._peer) {
      this._peer.peerChoking = true
      this._peer.emit('choke')
    }
  }

  unchoke() {
    this.amChoking = false
    if (this._peer) {
      this._peer.peerChoking = false
      this._peer.emit('unchoke')
    }
  }

  // Simula o peer deschokando-nos (para testes)
  simulatePeerUnchoke() {
    this.peerChoking = false
    this.emit('unchoke')
  }

  request(index: number, offset: number, length: number) {
    if (this._peer) {
      this._peer.emit('request', index, offset, length)
    }
  }

  // Simula recebimento de piece do peer
  receivePiece(index: number, offset: number, buffer: Buffer) {
    this.emit('piece', index, offset, buffer)
  }

  // Simula recebimento de have do peer
  receiveHave(index: number) {
    this.bitfield[index] = true
    this.emit('have', index)
  }

  // Simula envio de piece para o peer
  piece(index: number, offset: number, buffer: Buffer) {
    if (this._peer) {
      this._peer.receivePiece(index, offset, buffer)
    }
  }

  have(index: number) {
    if (this._peer) {
      this._peer.receiveHave(index)
    }
  }

  // Conecta este wire a outro (duplex)
  connect(peer: MockWire) {
    this._peer = peer
    peer._peer = this
  }

  destroy() {
    this.destroyed = true
    this.emit('close')
  }

  _read() {}
  _write(_chunk: any, _encoding: string, callback: () => void) {
    callback()
  }
}

export default MockWire