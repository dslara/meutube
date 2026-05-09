declare module 'bittorrent-tracker' {
  import { EventEmitter } from 'events'

  interface ClientOptions {
    infoHash: string
    announce: string[]
    peerId: string
    port: number
    [key: string]: any
  }

  class Client extends EventEmitter {
    constructor(opts: ClientOptions)
    start(): void
    stop(): void
    destroy(): void
    scrape(): void
  }

  export default Client
}
