import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RemoteService } from './shared/remote.service';
import { AsyncPipe } from '@angular/common';
import WebTorrent from 'webtorrent';
import { tap } from 'rxjs';


@Component({
  imports: [
    RouterModule,
    AsyncPipe,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  //private client = new WebTorrent();
  private readonly remoteService = inject(RemoteService);
  protected title = 'frontend';

  public stream$ = this.remoteService.getMagnetLink$('cidade-de-deus').pipe(
    tap((res) => {
      console.log(`🦖 : res:`, res);
      /*this.client.add(res.magnet, (torrent: WebTorrent.Torrent) => {
        const file = torrent.files.find(function (file) {
          return file.name.endsWith('.mp4')
        })
        console.log(`🦖 : file:`, file);
      })*/

    })
  );

  ngOnInit(): void {
  }
}
