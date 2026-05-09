import { TrackerClient } from '../tracker-client'

describe('TrackerClient', () => {
  test('announce returns list of peers', async () => {
    const client = new TrackerClient({ port: 6881 })
    const peers = await client.announce(
      'aaaaaaaaaaaaaaaaaaaa',
      'http://tracker.example/announce',
    )

    expect(peers).toHaveLength(1)
    expect(peers[0]).toEqual({ host: '127.0.0.1', port: 6881 })
  })

  test('scrape returns seeders, leechers, downloaded', async () => {
    const client = new TrackerClient({ port: 6881 })
    const result = await client.scrape(
      'aaaaaaaaaaaaaaaaaaaa',
      'http://tracker.example/announce',
    )

    expect(result.seeders).toBe(5)
    expect(result.leechers).toBe(3)
    expect(result.downloaded).toBe(10)
  })

  test('announce rejects on tracker error', async () => {
    const client = new TrackerClient({ port: 6881 })
    await expect(
      client.announce(
        'aaaaaaaaaaaaaaaaaaaa',
        'http://error.example/announce',
      ),
    ).rejects.toThrow('tracker error')
  })
})