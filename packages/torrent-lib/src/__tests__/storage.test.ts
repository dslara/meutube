import { createHash } from 'crypto'
import { mkdtempSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { DiskStorage } from '../storage'

function sha1(data: Buffer): Buffer {
  return createHash('sha1').update(data).digest()
}

describe('Storage', () => {
  let tmpDir: string
  let filePath: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'torrent-lib-'))
    filePath = join(tmpDir, 'test.dat')
  })

  afterEach(() => {
    try { unlinkSync(filePath) } catch {}
  })

  test('write piece and read it back', async () => {
    const pieceLength = 4
    const data = Buffer.from([1, 2, 3, 4])
    const pieceHashes = sha1(data)

    const storage = new DiskStorage(filePath, pieceLength, pieceHashes)
    await storage.write(0, data)

    const read = await storage.read(0, 4)
    expect(read).toEqual(data)
  })

  test('rejects write with invalid hash', async () => {
    const pieceLength = 4
    const correctData = Buffer.from([1, 2, 3, 4])
    const wrongData = Buffer.from([9, 9, 9, 9])
    const pieceHashes = sha1(correctData)

    const storage = new DiskStorage(filePath, pieceLength, pieceHashes)
    await expect(storage.write(0, wrongData)).rejects.toThrow('Hash mismatch')
  })

  test('write multiple pieces and read crossing boundaries', async () => {
    const pieceLength = 4
    const piece0 = Buffer.from([1, 2, 3, 4])
    const piece1 = Buffer.from([5, 6, 7, 8])
    const pieceHashes = Buffer.concat([sha1(piece0), sha1(piece1)])

    const storage = new DiskStorage(filePath, pieceLength, pieceHashes)
    await storage.write(0, piece0)
    await storage.write(1, piece1)

    // Read bytes 2..5 — spans piece 0 and piece 1
    const read = await storage.read(2, 4)
    expect(read).toEqual(Buffer.from([3, 4, 5, 6]))
  })

  test('has reflects written pieces', async () => {
    const pieceLength = 4
    const data = Buffer.from([1, 2, 3, 4])
    const pieceHashes = sha1(data)

    const storage = new DiskStorage(filePath, pieceLength, pieceHashes)
    expect(storage.has(0)).toBe(false)

    await storage.write(0, data)
    expect(storage.has(0)).toBe(true)
  })

  test('read rejects when pieces are not available', async () => {
    const pieceLength = 4
    const data = Buffer.from([1, 2, 3, 4])
    const pieceHashes = sha1(data)

    const storage = new DiskStorage(filePath, pieceLength, pieceHashes)
    await expect(storage.read(0, 4)).rejects.toThrow('not available')
  })
})
