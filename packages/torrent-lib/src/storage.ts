import { open, writeFile } from 'fs/promises'
import { createHash } from 'crypto'
import type { Storage } from './types'

export class DiskStorage implements Storage {
  private bitmap: boolean[]
  private fileCreated = false

  constructor(
    private filePath: string,
    private pieceLength: number,
    private pieceHashes: Buffer,
  ) {
    this.bitmap = new Array(pieceHashes.length / 20).fill(false)
  }

  private async ensureFile(): Promise<void> {
    if (!this.fileCreated) {
      await writeFile(this.filePath, Buffer.alloc(0))
      this.fileCreated = true
    }
  }

  async write(pieceIndex: number, data: Buffer): Promise<void> {
    const expected = this.pieceHashes.subarray(
      pieceIndex * 20,
      pieceIndex * 20 + 20,
    )
    const actual = createHash('sha1').update(data).digest()
    if (Buffer.compare(expected, actual) !== 0) {
      throw new Error(`Hash mismatch for piece ${pieceIndex}`)
    }

    await this.ensureFile()
    const fd = await open(this.filePath, 'r+')
    await fd.write(data, 0, data.length, pieceIndex * this.pieceLength)
    await fd.close()

    this.bitmap[pieceIndex] = true
  }

  async read(offset: number, length: number): Promise<Buffer> {
    const startPiece = Math.floor(offset / this.pieceLength)
    const endPiece = Math.floor((offset + length - 1) / this.pieceLength)
    for (let i = startPiece; i <= endPiece; i++) {
      if (!this.bitmap[i]) {
        throw new Error(`Piece ${i} not available`)
      }
    }

    await this.ensureFile()
    const fd = await open(this.filePath, 'r')
    const buf = Buffer.alloc(length)
    await fd.read({ buffer: buf, offset: 0, length, position: offset })
    await fd.close()

    return buf
  }

  has(pieceIndex: number): boolean {
    return this.bitmap[pieceIndex] ?? false
  }

  async destroy(): Promise<void> {
    // no-op: file handles are opened/closed per operation
  }
}
