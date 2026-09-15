/* =========================================================
   ResultScene : リザルト表示 + ハイスコア保存
   ========================================================= */
class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.result = {
      score: (data && data.score) || 0,
      plus: (data && data.plus) || 0,
      miss: (data && data.miss) || 0
    };
  }

  create() {
    const W = GAME.WIDTH;

    /* ---- 記録の保存（ハイスコア更新なら true） ---- */
    this.isNewRecord = ScoreStore.submit(this.result);
    const best = ScoreStore.load();

    UI.background(this);

    UI.text(this, W / 2, 84, 'RESULT', 58, '#ffffff', { strokeThickness: 0 })
      .setStroke('#16305c', 10);

    /* ---- 称号 ---- */
    this.rankBadge(W / 2, 174, GAME.rankOf(this.result.score));

    /* ---- メインパネル ---- */
    UI.panel(this, W / 2, 420, 470, 396, { radius: 28, alpha: 0.93 });

    UI.text(this, W / 2, 282, 'SCORE', 24, '#4a6699', { strokeThickness: 0 });

    const scoreText = UI.text(this, W / 2, 350, '0', 92, '#ff8a00', { strokeThickness: 0 });
    scoreText.setStroke('#ffffff', 8);
    scoreText.setShadow(0, 5, 'rgba(22,48,92,0.25)', 6, false, true);
    UI.countUp(this, scoreText, this.result.score, 900, '', 260);

    /* 区切り線 */
    const line = this.add.graphics();
    line.lineStyle(3, 0x16305c, 0.14);
    line.beginPath();
    line.moveTo(W / 2 - 180, 424);
    line.lineTo(W / 2 + 180, 424);
    line.strokePath();

    /* ---- 内訳 ---- */
    this.row(478, 'item_plus', 48, 'ジュース（プラス）', this.result.plus, '本', '#c0342a',
      '+' + (this.result.plus * GAME.SCORE_PLUS));
    this.row(556, 'item_miss', 40, 'たらい（ミス）', this.result.miss, '個', '#54708a',
      String(this.result.miss * GAME.SCORE_MISS));

    /* ---- ハイスコア ---- */
    UI.panel(this, W / 2, 688, 470, 96, { radius: 22, alpha: 0.86 });
    UI.text(this, W / 2 - 200, 688, 'HI-SCORE', 22, '#4a6699', { originX: 0, strokeThickness: 0 });

    if (best) {
      UI.text(this, W / 2 + 200, 682, String(best.score), 44, '#16305c', { originX: 1, strokeThickness: 0 });
      UI.text(this, W / 2 + 200, 716, 'ジュース ' + best.plus + '　たらい ' + best.miss, 18, '#4a6699',
        { originX: 1, strokeThickness: 0 });
    }

    if (this.isNewRecord) {
      this.newRecordBadge(W / 2, 612);
    }

    /* ---- ボタン ---- */
    UI.button(this, W / 2, 810, 320, 76, 'もう一度あそぶ', () => this.goto('Game'), { fontSize: 30 });
    UI.button(this, W / 2, 900, 260, 64, 'タイトルへ', () => this.goto('Title'), {
      fontSize: 26,
      color: 0x6f8cc4,
      shade: 0x4d6a9f
    });

    this.input.keyboard.on('keydown-SPACE', () => this.goto('Game'));
    this.input.keyboard.on('keydown-ENTER', () => this.goto('Game'));
    this.input.keyboard.on('keydown-ESC', () => this.goto('Title'));

    this.leaving = false;
    this.cameras.main.fadeIn(320, 255, 255, 255);
  }

  /* 内訳の1行 */
  row(y, iconKey, iconHeight, label, count, unit, color, detail) {
    const W = GAME.WIDTH;

    UI.itemImage(this, W / 2 - 170, y, iconKey, iconHeight);
    UI.text(this, W / 2 - 132, y, label, 24, '#16305c', { originX: 0, strokeThickness: 0 });
    UI.text(this, W / 2 + 176, y - 8, count + ' ' + unit, 30, color, { originX: 1, strokeThickness: 0 });
    UI.text(this, W / 2 + 176, y + 20, detail + ' pt', 18, '#4a6699', { originX: 1, strokeThickness: 0 });
  }

  /* 称号バッジ（スコアのカウントアップが終わってから出す） */
  rankBadge(x, y, rank) {
    const w = 400;
    const h = 74;
    const chipW = 92;
    const isGood = GAME.isGoodRank(rank);

    const badge = this.add.container(x, y).setDepth(110);

    const g = this.add.graphics();
    g.fillStyle(0x16305c, 0.18);
    g.fillRoundedRect(-w / 2, -h / 2 + 7, w, h, h / 2);
    g.fillStyle(rank.shade, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, h / 2);
    g.fillStyle(rank.color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.fillStyle(0xffffff, 0.22);
    g.fillRoundedRect(-w / 2 + 10, -h / 2 + 8, w - 20, h * 0.32, h * 0.2);
    g.lineStyle(4, 0xffffff, 0.95);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    /* 左側の「称号」チップ */
    const chip = this.add.graphics();
    chip.fillStyle(0xffffff, 0.9);
    chip.fillRoundedRect(-w / 2 + 12, -24, chipW, 48, 24);

    const chipText = this.add.text(-w / 2 + 12 + chipW / 2, 0, '称号', {
      fontFamily: FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#16305c'
    }).setOrigin(0.5);

    const nameText = this.add.text((-w / 2 + 12 + chipW + w / 2) / 2 + 6, 0, rank.label, {
      fontFamily: FONT,
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    nameText.setStroke(Phaser.Display.Color.IntegerToColor(rank.shade).rgba, 6);
    nameText.setShadow(0, 3, 'rgba(0,0,0,0.3)', 4, false, true);

    badge.add([g, chip, chipText, nameText]);
    badge.setScale(1.9);
    badge.setAlpha(0);
    badge.setAngle(-8);

    /* スタンプを押すように出す */
    this.tweens.add({
      targets: badge,
      scale: 1,
      angle: -3,
      alpha: 1,
      duration: 420,
      delay: 1150,
      ease: 'Back.out',
      onComplete: () => {
        Sfx.rank(isGood);
        this.cameras.main.shake(160, 0.006);
        this.tweens.add({
          targets: badge,
          angle: { from: -3, to: 2 },
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });
  }

  newRecordBadge(x, y) {
    const badge = this.add.container(x, y);

    const g = this.add.graphics();
    g.fillStyle(0xff4f6d, 1);
    g.fillRoundedRect(-125, -24, 250, 48, 24);
    g.lineStyle(4, 0xffffff, 1);
    g.strokeRoundedRect(-125, -24, 250, 48, 24);

    const t = this.add.text(0, 0, 'NEW RECORD !', {
      fontFamily: FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    badge.add([g, t]);
    badge.setAngle(-6);
    badge.setScale(0);
    badge.setDepth(120);

    this.tweens.add({
      targets: badge,
      scale: 1,
      duration: 420,
      delay: 1900,
      ease: 'Back.out',
      onComplete: () => {
        Sfx.finish();
        this.tweens.add({
          targets: badge,
          angle: { from: -6, to: 4 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });

    /* お祝いの紙吹雪 */
    this.time.delayedCall(1900, () => {
      const emitter = this.add.particles(GAME.WIDTH / 2, -20, 'spark', {
        x: { min: 0, max: GAME.WIDTH },
        speedY: { min: 120, max: 300 },
        speedX: { min: -60, max: 60 },
        scale: { start: 0.8, end: 0.2 },
        lifespan: 3200,
        frequency: 90,
        tint: [0xe23b2e, 0xffd66b, 0x35c46a, 0x63b4ff],
        quantity: 2
      }).setDepth(-10);
      this.time.delayedCall(2600, () => emitter.stop());
    });
  }

  goto(sceneKey) {
    if (this.leaving) { return; }
    this.leaving = true;

    this.cameras.main.fadeOut(260, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }
}
