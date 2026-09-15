/* =========================================================
   BootScene : 画像の読み込みと、コードで作るテクスチャの生成
   ========================================================= */
class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.drawLoadingUI();

    this.load.image('chara', 'assets/img/chara.png');
    this.load.image('logo', 'assets/img/logo.png');
    this.load.image('item_plus', 'assets/img/item_1.png');   /* ジュース：プラス */
    this.load.image('item_miss', 'assets/img/item_2.png');   /* たらい　：ミス   */

    this.load.on('loaderror', function (file) {
      console.warn('[boot] 読み込みに失敗しました: ' + file.key + ' (' + file.url + ')');
    });
  }

  create() {
    /* 雲と粒子だけコードで生成する */
    this.makeCloudTexture('cloud');
    this.makeSparkTexture('spark');

    this.scene.start('Title');
  }

  /* ---------- ローディング表示 ---------- */
  drawLoadingUI() {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;

    const bg = this.add.graphics();
    bg.fillGradientStyle(GAME.COLOR.skyTop, GAME.COLOR.skyTop, GAME.COLOR.skyBottom, GAME.COLOR.skyBottom, 1);
    bg.fillRect(0, 0, W, H);

    const label = this.add.text(W / 2, H / 2 - 60, 'NOW LOADING', {
      fontFamily: FONT,
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#16305c'
    }).setOrigin(0.5);
    label.setStroke('#ffffff', 5);

    const barW = 320;
    const barH = 20;
    const x = (W - barW) / 2;
    const y = H / 2;

    const frame = this.add.graphics();
    frame.fillStyle(0xffffff, 0.75);
    frame.fillRoundedRect(x - 4, y - 4, barW + 8, barH + 8, 12);

    const bar = this.add.graphics();

    this.load.on('progress', function (value) {
      bar.clear();
      bar.fillStyle(0xffb020, 1);
      bar.fillRoundedRect(x, y, Math.max(barH, barW * value), barH, 10);
    });
  }

  /* ---------- 雲 ---------- */
  makeCloudTexture(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(60, 58, 38);
    g.fillCircle(108, 46, 46);
    g.fillCircle(160, 60, 34);
    g.fillRoundedRect(40, 58, 140, 34, 17);
    g.generateTexture(key, 220, 100);
    g.destroy();
  }

  /* ---------- 粒子 ---------- */
  makeSparkTexture(key) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }
}
