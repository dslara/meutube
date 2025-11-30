// Simple worker that loads WebTorrent via dynamic import and handles download requests
const { once } = require('events');

let client = null;

// Notify parent that worker started (if IPC is available)
try {
  if (process && typeof process.send === 'function') {
    process.send({ event: 'worker-started' });
  }
}
catch (err) {
  console.error('Error notifying parent', err);
}

async function ensureClient() {
  if (!client) {
    const WebTorrent = (await import('webtorrent')).default;
    client = new WebTorrent();
    console.log('torrent-worker: WebTorrent client initialized');
  }
  return client;
}

process.on('message', async (msg) => {
  try {
    if (!msg || !msg.cmd) return;
    if (msg.cmd === 'download') {
      const magnet = msg.magnet;
      const id = msg.id;
      const client = await ensureClient();
      client.add(magnet, (torrent) => {
        torrent.on('done', () => {
          const info = {
            name: torrent.name,
            files: torrent.files.map(f => f.name),
            path: torrent.path,
          };
          process.send({ id, ok: true, data: info });
        });
        torrent.on('error', (err) => {
          process.send({ id, ok: false, error: String(err) });
        });
      });
    }
    if (msg.cmd === 'ping') {
      process.send({ id: msg.id, ok: true });
    }
  }
  catch (err) {
    if (msg && msg.id) process.send({ id: msg.id, ok: false, error: String(err) });
  }
});

// keep process alive
process.on('disconnect', () => process.exit(0));
