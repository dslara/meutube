declare module 'magnet-uri' {
  interface MagnetURI {
    xt?: string | string[]
    dn?: string
    tr?: string | string[]
    infoHash?: string
    name?: string
    announce?: string[]
    urlList?: string[]
    peerAddresses?: string[]
    [key: string]: any
  }
  export function decode(uri: string): MagnetURI
  export function encode(obj: MagnetURI): string
  export default function magnet(uri: string): MagnetURI
}

declare module 'parse-torrent' {
  interface ParsedTorrent {
    infoHash: string
    name: string
    length: number
    pieceLength: number
    lastPieceLength: number
    pieces: string[]
    announce: string[]
    info: any
    files?: Array<{ path: string; name: string; length: number; offset: number }>
    [key: string]: any
  }
  function parseTorrent(input: string | Buffer): Promise<ParsedTorrent>
  export default parseTorrent
}
