declare module 'bittorrent-protocol' {
  import { Duplex } from 'stream'
  import { EventEmitter } from 'events'

  interface WireOpts {
    [key: string]: any
  }

  class Wire extends Duplex {
    peerId?: string
    infoHash?: string
    amChoking: boolean
    peerChoking: boolean
    amInterested: boolean
    peerInterested: boolean
    bitfield: boolean[]
    destroyed: boolean

    constructor(opts?: WireOpts)
    use(ext: any): any
    handshake(infoHash: string, peerId: string, extensions?: any): void
    interested(): void
    uninterested(): void
    choke(): void
    unchoke(): void
    request(index: number, offset: number, length: number): void
    piece(index: number, offset: number, buffer: Buffer): void
    have(index: number): void
    destroy(): void

    on(event: 'handshake', listener: (infoHash: string, peerId: string) => void): this
    on(event: 'unchoke', listener: () => void): this
    on(event: 'choke', listener: () => void): this
    on(event: 'interested', listener: () => void): this
    on(event: 'uninterested', listener: () => void): this
    on(event: 'piece', listener: (index: number, offset: number, buffer: Buffer) => void): this
    on(event: 'have', listener: (index: number) => void): this
    on(event: 'request', listener: (index: number, offset: number, length: number) => void): this
    on(event: 'close', listener: () => void): this
    on(event: string, listener: (...args: any[]) => void): this
  }

  export default Wire
}
