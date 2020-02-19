import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Observable } from 'rxjs';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { LoadSongListData, ChangeControlValue, LoadSongUrl } from '../../../store';
import { HotState, SongListDetail } from '../../../store/reducers/hot.reducer';
import { Position } from '../../common/scroll/scroll.component';
import { controlStore, ControlState } from '../../../store/reducers/control.reducer';


@Component({
  selector: 'song-list-detail',
  templateUrl: './song-list-detail.component.html',
  styleUrls: ['./song-list-detail.component.less'],
  animations: [
    trigger('flyInOut', [
      state('in', style({
        opacity: 1,
        transform: 'translateY(0)',
      })),
      state('out', style({
        opacity: 0,
        transform: 'translateY(100%)',
      })),
      transition('* => *', [
        animate('300ms ease-in-out')
      ]),
    ])
  ]
})
export class SongListDetailComponent implements OnInit {
  @ViewChild('coverImage') coverImage: ElementRef;
  @ViewChild('scrollEl') scrollEl: ElementRef;
  @ViewChild('filterEl') filterEl: ElementRef;
  @ViewChild('playButtonEl') playButtonEl: ElementRef;
  @ViewChild('layerFillEl') layerFillEl: ElementRef;

  public detailStore$: Observable<HotState>;
  public songDetailList: SongListDetail = {
    coverImgUrl: '',
    name: '',
    listData: []
  };
  public isShow: boolean = true;

  private static fixedHeight: number = 40;
  private scrollTop: number = 260;
  private coverImageHeight: number;

  // 构造方法时注入了HotState,ControlState,我们现在可以在store里调用两个action
  constructor(
    public router: Router,
    private store: Store<{ hotStore: HotState, controlStore: ControlState }>,
    private activeRouter: ActivatedRoute,
    private renderer: Renderer2
  ) {
    this.detailStore$ = store.pipe(select('hotStore'));
  }

  ngOnInit() {
    // 获取路由上的id,然后发送请求
    const songId: number = Number(this.activeRouter.snapshot.paramMap.get('id'));
    this.store.dispatch(new LoadSongListData(songId));
    this.detailStore$.subscribe(data => {
      this.songDetailList = data.songListDetail;
    })
  }

  ngAfterViewInit(): void {
    // 获取背景图高度
    this.coverImageHeight = this.coverImage.nativeElement.clientHeight;
    // 设置top高度
    // 使用renderer：Renderer修改样式
    this.renderer.setStyle(this.scrollEl.nativeElement, 'top', `${this.coverImageHeight}px`);
  }


  public goBack(arg?: boolean): void {
    if (arg) {
      if (!this.isShow) {
        this.router.navigate(['/hot']);
      }
    } else {
      this.isShow = false;
    }
  }

  public handlerScroll(position: Position): void {
    // 当触发滚动时      
    let minScrollY = -this.coverImageHeight + SongListDetailComponent.fixedHeight;
    let moveY = Math.max(minScrollY, position.y);
    let zIndex = 0;

    // 当向上推得时候填充背景
    this.renderer.setStyle(this.layerFillEl.nativeElement, 'transform', `translate3d(0 ,${moveY}px, 0)`);
    this.renderer.setStyle(this.layerFillEl.nativeElement, 'webkit-transform', `translate3d(0 ,${moveY}px, 0)`);


    // 下拉放大、上拉模糊
    let scale = 1;
    let blur = 0;
    const formula = Math.abs(position.y / this.coverImageHeight);

    if (position.y > 0) {
      zIndex = 10;
      scale = 1 + formula;
      this.renderer.setStyle(this.coverImage.nativeElement, 'transform', `scale(${scale})`);
      this.renderer.setStyle(this.coverImage.nativeElement, 'webkitTransform', `scale(${scale})`);
    } else {
      blur = Math.min(20 * formula, 20);
      this.renderer.setStyle(this.filterEl.nativeElement, 'backdrop-filter', `blur(${blur}px)`);
      this.renderer.setStyle(this.filterEl.nativeElement, 'webkitBackdrop-filter', `blur(${blur}px)`);
    }

    // 不推到顶，留一部分
    if (position.y < minScrollY) {
      zIndex = 10;
      this.renderer.setStyle(this.coverImage.nativeElement, 'padding-top', 0);
      this.renderer.setStyle(this.coverImage.nativeElement, 'height', `${SongListDetailComponent.fixedHeight}px`);
      // 隐藏 随机播放全部 按钮
      this.renderer.setStyle(this.playButtonEl.nativeElement, 'display', 'none');
    } else {
      this.renderer.setStyle(this.coverImage.nativeElement, 'padding-top', '70%');
      this.renderer.setStyle(this.coverImage.nativeElement, 'height', '0');
      // 显示 随机播放全部 按钮
      this.renderer.setStyle(this.playButtonEl.nativeElement, 'display', 'block');
    }
    this.renderer.setStyle(this.coverImage.nativeElement, 'z-index', zIndex);
  }

  // 播放歌曲
  public handlerPlay(data?: any): void {
    const { listData } = this.songDetailList;
    const currentId: number = data ? data.currentId : listData[0].id;
    // 点击的全部播放从第一首开始播放
    this.store.dispatch(new ChangeControlValue({ key: 'current', value: data ? data.current : 0 }));
    this.store.dispatch(new ChangeControlValue({ key: 'currentId', value: currentId }));
    // 播放列表
    this.store.dispatch(new ChangeControlValue({ key: 'playList', value: this.songDetailList.listData }));
    // mini播放器
    this.store.dispatch(new ChangeControlValue({ key: 'miniPlayer', value: true }));
    // 播放器
    this.store.dispatch(new ChangeControlValue({ key: 'player', value: true }));
    // 获取歌曲详情
    this.store.dispatch(new LoadSongUrl(currentId));
  }
}
