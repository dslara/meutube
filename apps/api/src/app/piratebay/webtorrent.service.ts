// apps/api/src/app/torrent/torrent.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { ChildProcess } from 'child_process';

type IPCResponse = { id?: string | number; ok: boolean; data?: any; error?: string };

@Injectable()
export class TorrentService implements OnModuleInit, OnModuleDestroy {
  private worker: ChildProcess | null = null;
  private reqId = 0;
  private pending = new Map<number | string, { resolve: (v: any) => void; reject: (e: any) => void }>();

  async onModuleInit() {
    await this.initializeClient();
  }

  async onModuleDestroy() {
    if (this.worker) {
      this.worker.kill();
      this.worker = null;
    }
  }

  private async initializeClient() {
    const path = eval('require')('path');
    const workerPath = path.resolve(process.cwd(), 'dist', 'apps', 'api', 'assets', 'torrent-worker.js');
    // Fork the worker (the file is copied to dist via webpack assets)
    // Use a runtime require to avoid bundling Node built-ins into the webpack output.
    const runtimeRequire = eval('require');
    const childProcess = runtimeRequire('child_process');
    this.worker = childProcess.fork(workerPath, { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

    this.worker.on('message', (msg: IPCResponse) => {
      console.log('torrent-worker message:', msg);
      if (!msg || typeof msg !== 'object') return;
      const id = msg.id;
      if (id == null) return;
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      if (msg.ok) p.resolve(msg.data);
      else p.reject(new Error(msg.error || 'Unknown error'));
    });

    this.worker.on('exit', (code) => {
      console.warn('torrent-worker exited', code);
      // reject all pending
      for (const [, p] of this.pending) p.reject(new Error('Worker exited'));
      this.pending.clear();
      this.worker = null;
    });

    // Optionally ping the worker
    return new Promise<void>((res, rej) => {
      const timeout = setTimeout(() => rej(new Error('Worker did not respond')), 5000);
      const id = `ping-${Date.now()}`;
      this.pending.set(id, { resolve: () => { clearTimeout(timeout); res(); }, reject: rej });
      this.worker.send({ cmd: 'ping', id });
    });
  }

  async downloadTorrent(magnetUri: string): Promise<any> {
    if (!this.worker) throw new Error('Worker not available');
    const id = ++this.reqId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.send({ cmd: 'download', id, magnet: magnetUri });
    });
  }

  getClient(): any {
    return null;
  }
}
