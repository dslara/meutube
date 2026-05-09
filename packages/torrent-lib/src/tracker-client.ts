import Client from 'bittorrent-tracker'

interface PeerInfo {
  host: string
  port: number
}

interface TrackerClientOptions {
  port: number
}

interface ScrapeResult {
  seeders: number
  leechers: number
  downloaded: number
}

export class TrackerClient {
  constructor(private options: TrackerClientOptions) {}

  announce(infoHash: string, announceUrl: string): Promise<PeerInfo[]> {
    return new Promise((resolve, reject) => {
      const peers: PeerInfo[] = []
      const client = new Client({
        infoHash,
        announce: [announceUrl],
        peerId: '-MT0001-',
        port: this.options.port,
      })

      client.on('peer', (peer: any) => {
        peers.push({ host: peer.host ?? peer.address, port: peer.port })
      })

      client.on('update', (data: any) => {
        client.stop()
        resolve(peers)
      })

      client.on('error', (err: Error) => {
        client.stop()
        reject(err)
      })

      client.start()
    })
  }

  scrape(infoHash: string, announceUrl: string): Promise<ScrapeResult> {
    return new Promise((resolve, reject) => {
      const client = new Client({
        infoHash,
        announce: [announceUrl.replace('/announce', '/scrape')],
        peerId: '-MT0001-',
        port: this.options.port,
      })

      client.on('scrape', (data: any) => {
        client.destroy()
        resolve({
          seeders: data.complete ?? 0,
          leechers: data.incomplete ?? 0,
          downloaded: data.downloaded ?? 0,
        })
      })

      client.on('error', (err: Error) => {
        client.destroy()
        reject(err)
      })

      client.scrape()
    })
  }
}
