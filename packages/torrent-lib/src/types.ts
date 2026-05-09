export interface TorrentClientOptions {
  downloadDir: string
  maxPeers?: number
}

export interface TorrentInfo {
  name: string
  length: number
  pieceLength: number
  pieces: number
  infoHash: string
}

export interface TorrentStats {
  downloaded: number
  uploaded: number
  downloadSpeed: number
  uploadSpeed: number
  peers: number
  progress: number
  timeRemaining: number
}

export interface TorrentEvents {
  metadata: () => void
  done: () => void
  error: (err: Error) => void
  download: (bytes: number) => void
  upload: (bytes: number) => void
  [event: string]: (...args: any[]) => void
}

export interface Storage {
  write(pieceIndex: number, data: Buffer): Promise<void>
  read(offset: number, length: number): Promise<Buffer>
  has(pieceIndex: number): boolean
  destroy(): Promise<void>
}

export interface PiecePicker {
  getNext(availablePieces: Set<number>, inFlight: Set<number>): number | null
  markHave(pieceIndex: number): void
  markRequested(pieceIndex: number): void
  markReceived(pieceIndex: number): void
  readonly remaining: number
}
