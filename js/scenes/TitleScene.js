/* =========================================================
   TitleScene : タイトル / 遊び方 / ハイスコア表示
   ========================================================= */
class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;

    UI.background(this);

    /* ---- タイトルロゴ ---- */
    const logo = this.add.container(W / 2, 150);

    const logoImage = this.add.image(0, 0, 'logo');
    UI.fitWidth(logoImage, GAME.LOGO_WIDTH);

    const badge = UI.text(this, 0, logoImage.displayHeight / 2 + 22, '- 60 SECONDS -', 20, '#4a6699');

    logo.add([logoImage, badge]);

    this.tweens.add({
      targets: logo,
      y: 160,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    /* ---- キャラクター選択 ---- */
    this.buildCharaSelect(W / 2, 406);

    /* 落ちてくるアイテムの見本 */
    this.demoItems();

    /* ---- 遊び方 ---- */
    UI.panel(this, W / 2, 574, 452, 118, { radius: 22, alpha: 0.86 });
    UI.itemImage(this, W / 2 - 170, 552, 'item_plus', 46);
    UI.text(this, W / 2 - 140, 552, 'ジュースをキャッチ　+' + GAME.SCORE_PLUS + 'pt', 24, '#16305c', { originX: 0, strokeThickness: 0 });
    UI.itemImage(this, W / 2 - 170, 604, 'item_miss', 40);
    UI.text(this, W / 2 - 140, 604, 'たらいはよけて　' + GAME.SCORE_MISS + 'pt', 24, '#c0304b', { originX: 0, strokeThickness: 0 });

    UI.text(this, W / 2, 664, '← → キー / 画面の左右タップ で移動', 22, '#16305c');

    /* ---- ハイスコア ---- */
    this.drawHighScore(W / 2, 762);

    /* ---- スタートボタン ---- */
    const btn = UI.button(this, W / 2, 884, 320, 82, 'ゲームスタート', () => this.startGame(), { fontSize: 32 });
    this.tweens.add({
      targets: btn,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    /* ---- 入力 ---- */
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-D', () => this.moveSelection(1));

    this.starting = false;
    this.cameras.main.fadeIn(320, 255, 255, 255);
  }

  /* =======================================================
     キャラクター選択（横スクロール式）
     ・スワイプ / ドラッグで横に流し、中央の枠に止まったキャラが選択になる
     ・はじくと勢いで次のキャラへ、離すと一番近いキャラに吸着する
     ・左右の矢印、← → キー、横に見えているキャラのタップでも移動できる
     ======================================================= */
  buildCharaSelect(centerX, centerY) {
    const SPACING = 230;   /* キャラ同士の間隔（中央から隣のキャラまで） */
    const FRAME_W = 204;
    const FRAME_H = 160;
    const BAND_H = 190;    /* スワイプを受け付ける帯の高さ */

    const cs = {
      centerX: centerX,
      centerY: centerY,
      spacing: SPACING,
      scroll: 0,           /* 中央に来ている位置（px）。index × SPACING で止まる */
      index: -1,           /* 現在の選択 */
      targetIndex: 0,      /* 吸着アニメーション中の行き先 */
      items: [],
      dots: [],
      drag: null,
      snapTween: null
    };
    this.carousel = cs;

    UI.text(this, centerX, centerY - FRAME_H / 2 - 30, 'キャラクターをえらぶ（スワイプ / ← →）', 20, '#16305c');

    /* 中央の選択枠（キャラはこの上を横切っていく） */
    const frame = this.add.graphics().setDepth(0);
    frame.fillStyle(0x16305c, 0.2);
    frame.fillRoundedRect(centerX - FRAME_W / 2, centerY - FRAME_H / 2 + 6, FRAME_W, FRAME_H, 24);
    frame.fillStyle(0xffffff, 0.95);
    frame.fillRoundedRect(centerX - FRAME_W / 2, centerY - FRAME_H / 2, FRAME_W, FRAME_H, 24);
    frame.lineStyle(6, 0xffb020, 1);
    frame.strokeRoundedRect(centerX - FRAME_W / 2, centerY - FRAME_H / 2, FRAME_W, FRAME_H, 24);

    /* キャラ（holder で位置・大きさ・透明度、中の img でゆらゆら） */
    cs.items = GAME.CHARAS.map((chara) => {
      const holder = this.add.container(centerX, centerY).setDepth(1);
      const img = this.add.image(0, 0, chara.id);
      UI.fitContain(img, FRAME_W - 30, FRAME_H - 24);
      holder.add(img);
      return { id: chara.id, holder: holder, img: img };
    });

    /* 選択枠の右上のチェック */
    const check = this.add.graphics().setDepth(2);
    const cx = centerX + FRAME_W / 2 - 20;
    const cy = centerY - FRAME_H / 2 + 20;
    check.fillStyle(0xffb020, 1);
    check.fillCircle(cx, cy, 16);
    check.lineStyle(3, 0xffffff, 1);
    check.strokeCircle(cx, cy, 16);
    check.lineStyle(4, 0xffffff, 1);
    check.beginPath();
    check.moveTo(cx - 7, cy + 1);
    check.lineTo(cx - 2, cy + 6);
    check.lineTo(cx + 8, cy - 6);
    check.strokePath();

    /* 何番目かを示すドット */
    const count = GAME.CHARAS.length;
    cs.dots = GAME.CHARAS.map((chara, i) => {
      return this.add.circle(centerX + (i - (count - 1) / 2) * 20, centerY + FRAME_H / 2 + 16, 5, 0x16305c, 0.25)
        .setDepth(2);
    });

    /* スワイプを受け付ける透明な帯（矢印ボタンより下の重なり順） */
    const zone = this.add.zone(centerX, centerY, GAME.WIDTH, BAND_H).setDepth(3);
    zone.setInteractive();
    this.carouselZone = zone;

    /* 左右の矢印 */
    cs.prevBtn = this.buildArrow(36, centerY, -1);
    cs.nextBtn = this.buildArrow(GAME.WIDTH - 36, centerY, 1);

    this.setupCarouselInput(zone);

    /* 保存されている選択から始める */
    const startIndex = Math.max(0, GAME.CHARAS.findIndex((c) => c.id === CharaStore.get()));
    cs.targetIndex = startIndex;
    this.setScroll(startIndex * SPACING);
  }

  buildArrow(x, y, dir) {
    const R = 24;
    const container = this.add.container(x, y).setDepth(4);
    const face = this.add.container(0, 0);
    const g = this.add.graphics();

    g.fillStyle(0x16305c, 0.18);
    g.fillCircle(0, 4, R);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(0, 0, R);
    g.lineStyle(3, 0xffb020, 1);
    g.strokeCircle(0, 0, R);
    g.fillStyle(0xff8a00, 1);
    g.fillTriangle(dir * 9, 0, -dir * 6, -10, -dir * 6, 10);

    face.add(g);
    container.add(face);

    /* 効果音は選択が切り替わったときに鳴らすので、ここでは鳴らさない */
    UI.pressable(this, container, face, R * 2, R * 2, () => this.moveSelection(dir), { pad: 10, sound: false });
    return container;
  }

  /* ドラッグ・スワイプ・タップの処理 */
  setupCarouselInput(zone) {
    const cs = this.carousel;

    zone.on('pointerdown', (pointer) => {
      if (this.starting) { return; }
      if (cs.snapTween) {
        cs.snapTween.stop();
        cs.snapTween = null;
      }
      const now = window.performance.now();
      cs.drag = {
        startX: pointer.x,
        startScroll: cs.scroll,
        lastX: pointer.x,
        lastT: now,
        velocity: 0,
        moved: 0
      };
    });

    const onMove = (pointer) => {
      const d = cs.drag;
      if (!d || this.starting) { return; }

      const now = window.performance.now();
      const dt = Math.max(1, now - d.lastT);
      /* はじいた速さ（px/ms）。ブレを抑えるため少しならす */
      d.velocity = d.velocity * 0.4 + ((pointer.x - d.lastX) / dt) * 0.6;
      d.lastX = pointer.x;
      d.lastT = now;

      const dx = pointer.x - d.startX;
      d.moved = Math.max(d.moved, Math.abs(dx));
      this.setScroll(this.rubberBand(d.startScroll - dx));
    };

    const onUp = (pointer) => {
      const d = cs.drag;
      if (!d) { return; }
      cs.drag = null;
      if (this.starting) { return; }

      if (d.moved < 10) {
        /* ほとんど動かしていなければタップ扱い：押した位置のキャラへ移動 */
        this.snapTo(Math.round((pointer.x - cs.centerX + cs.scroll) / cs.spacing));
        return;
      }

      /* 指を止めてから離した場合は勢いをつけない */
      const velocity = (window.performance.now() - d.lastT > 80) ? 0 : d.velocity;
      const projected = cs.scroll - velocity * 160;
      this.snapTo(Math.round(projected / cs.spacing));
    };

    this.input.on('pointermove', onMove);
    this.input.on('pointerup', onUp);
    this.events.once('shutdown', () => {
      this.input.off('pointermove', onMove);
      this.input.off('pointerup', onUp);
    });
  }

  /* 端を越えて引っぱったときは、抵抗がかかったように少しだけ動かす */
  rubberBand(value) {
    const max = (GAME.CHARAS.length - 1) * this.carousel.spacing;
    if (value < 0) { return value * 0.35; }
    if (value > max) { return max + (value - max) * 0.35; }
    return value;
  }

  /* 指定のキャラが中央に来るまでスクロールして止める */
  snapTo(index) {
    const cs = this.carousel;
    const target = Phaser.Math.Clamp(index, 0, GAME.CHARAS.length - 1);
    cs.targetIndex = target;

    if (cs.snapTween) { cs.snapTween.stop(); }
    const proxy = { v: cs.scroll };
    cs.snapTween = this.tweens.add({
      targets: proxy,
      v: target * cs.spacing,
      duration: 280,
      ease: 'Cubic.out',
      onUpdate: () => this.setScroll(proxy.v),
      onComplete: () => {
        this.setScroll(target * cs.spacing);
        cs.snapTween = null;
      }
    });
  }

  /* スクロール位置に合わせて並べ、中央から離れるほど小さく薄くする */
  setScroll(value) {
    const cs = this.carousel;
    cs.scroll = value;

    cs.items.forEach((item, i) => {
      const x = cs.centerX + i * cs.spacing - value;
      const distance = Math.min(1, Math.abs(x - cs.centerX) / cs.spacing);
      item.holder.x = x;
      item.holder.setScale(1 - 0.3 * distance);
      item.holder.setAlpha(1 - 0.55 * distance);
    });

    const index = Phaser.Math.Clamp(Math.round(value / cs.spacing), 0, GAME.CHARAS.length - 1);
    if (index !== cs.index) {
      this.onSelectIndex(index);
    }
  }

  /* 中央のキャラが変わったとき */
  onSelectIndex(index) {
    const cs = this.carousel;
    const isFirst = (cs.index === -1);
    cs.index = index;

    this.selectedId = GAME.CHARAS[index].id;
    CharaStore.set(this.selectedId);

    /* 中央のキャラだけ、ゆらゆら動かす */
    cs.items.forEach((item, i) => {
      this.tweens.killTweensOf(item.img);
      item.img.setPosition(0, 0);
      item.img.setAngle(0);
      if (i === index) {
        this.tweens.add({
          targets: item.img,
          y: -6,
          angle: { from: -3, to: 3 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });

    cs.dots.forEach((dot, i) => {
      const active = (i === index);
      dot.setFillStyle(active ? 0xff8a00 : 0x16305c, active ? 1 : 0.25);
      dot.setScale(active ? 1.3 : 1);
    });

    /* 端では矢印を薄くする */
    cs.prevBtn.setAlpha(index > 0 ? 1 : 0.35);
    cs.nextBtn.setAlpha(index < GAME.CHARAS.length - 1 ? 1 : 0.35);

    if (!isFirst) { Sfx.ui(); }
  }

  /* 矢印ボタン・← → キーで1つずつ移動 */
  moveSelection(dir) {
    if (this.starting) { return; }
    const cs = this.carousel;
    /* 吸着中にもう一度押したら、行き先からさらに進める */
    const base = cs.snapTween ? cs.targetIndex : cs.index;
    const next = Phaser.Math.Clamp(base + dir, 0, GAME.CHARAS.length - 1);

    if (next === base) {
      this.bumpCarousel(dir);
      return;
    }
    this.snapTo(next);
  }

  /* 端でそれ以上進めないときは、少しだけ揺らして知らせる */
  bumpCarousel(dir) {
    const cs = this.carousel;
    if (cs.snapTween) { return; }
    const base = cs.index * cs.spacing;
    const proxy = { v: base };
    cs.targetIndex = cs.index;
    cs.snapTween = this.tweens.add({
      targets: proxy,
      v: base + dir * 22,
      duration: 90,
      yoyo: true,
      ease: 'Quad.out',
      onUpdate: () => this.setScroll(proxy.v),
      onComplete: () => {
        this.setScroll(base);
        cs.snapTween = null;
      }
    });
  }

  /* タイトル画面で降ってくる飾りのアイテム */
  demoItems() {
    this.time.addEvent({
      delay: 1300,
      loop: true,
      callback: () => {
        const key = Math.random() < 0.7 ? 'item_plus' : 'item_miss';
        const item = UI.itemImage(this, Phaser.Math.Between(40, GAME.WIDTH - 40), -60, key, 54)
          .setAlpha(0.38)
          .setDepth(-70);
        this.tweens.add({
          targets: item,
          y: GAME.HEIGHT + 60,
          angle: Phaser.Math.Between(-220, 220),
          duration: Phaser.Math.Between(4200, 6400),
          onComplete: () => item.destroy()
        });
      }
    });
  }

  drawHighScore(x, y) {
    const best = ScoreStore.load();

    UI.panel(this, x, y, 452, 132, { radius: 22, alpha: 0.92 });
    UI.text(this, x, y - 44, 'HI-SCORE', 22, '#4a6699', { strokeThickness: 0 });

    if (!best) {
      UI.text(this, x, y + 14, 'まだ記録がありません', 26, '#4a6699', { strokeThickness: 0 });
      return;
    }

    UI.text(this, x, y - 2, String(best.score), 52, '#ff8a00', { strokeThickness: 0 })
      .setShadow(0, 3, 'rgba(22,48,92,0.25)', 4, false, true);

    UI.text(this, x, y + 42,
      'ジュース ' + best.plus + ' 本　たらい ' + best.miss + ' 個' + (best.date ? '　(' + best.date + ')' : ''),
      20, '#16305c', { strokeThickness: 0 });
  }

  startGame() {
    if (this.starting) { return; }
    this.starting = true;

    Sfx.start();
    this.cameras.main.fadeOut(260, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game');
    });
  }
}
