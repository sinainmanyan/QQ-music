import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HotComponent } from './hot.component';
import { SongListDetailComponent } from './song-list-detail/song-list-detail.component';

const routes: Routes = [
  {
    path: '',
    component: HotComponent,
    data: { animation: 'hot' },
    children: [
      {
        path: ':id',
        component: SongListDetailComponent,
        data: { animation: 'songsList' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HotRoutingModule { }
