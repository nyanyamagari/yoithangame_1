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
    const logo = this.add.container(W / 2, 168);

    const logoImage = this.add.image(0, 0, 'logo');
    const logoSrc = logoImage.texture.getSourceImage();
    logoImage.setDisplaySize(GAME.LOGO_WIDTH, GAME.LOGO_WIDTH * (logoSrc.height / logoSrc.width));

    const badge = UI.text(this, 0, logoImage.displayHeight / 2 + 22, '- 60 SECONDS -', 20, '#4a6699');

    logo.add([logoImage, badge]);

    this.tweens.add({
      targets: logo,
      y: 178,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    /* ---- キャラクター ---- */
    const chara = this.add.image(W / 2, 430, 'chara');
    chara.setDisplaySize(GAME.PLAYER_WIDTH * 1.5, GAME.PLAYER_WIDTH * 1.5 * (1458 / 1828));
    this.tweens.add({
      targets: chara,
      y: 415,
      angle: { from: -3, to: 3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

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

    this.starting = false;
    this.cameras.main.fadeIn(320, 255, 255, 255);
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
