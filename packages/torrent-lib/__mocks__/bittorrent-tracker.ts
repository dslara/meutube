import { EventEmitter } from 'events'

class MockClient extends EventEmitter {
  peerId: string
  infoHash: string
  announce: string[]
  port: number
  destroyed = false

  constructor(opts: any) {
    super()
    this.peerId = opts.peerId
    this.infoHash = opts.infoHash
    this.announce = opts.announce
    this.port = opts.port
  }

  start() {
    queueMicrotask(() => {
      if (this.announce[0]?.includes('error')) {
        this.emit('error', new Error('tracker error'))
      } else {
        this.emit('peer', { host: '127.0.0.1', port: 6881 })
        this.emit('update', { complete: 5, incomplete: 3 })
      }
    })
  }

  stop() {
    this.destroyed = true
  }

  destroy() {
    this.destroyed = true
  }

  scrape() {
    queueMicrotask(() => {
      if (this.announce[0]?.includes('error')) {
        this.emit('error', new Error('tracker error'))
      } else {
        this.emit('scrape', {
          complete: 5,
          incomplete: 3,
          downloaded: 10,
        })
      }
    })
  }
}

export default MockClient
