/* =========================================================
   GameScene : 本編（60秒）
   ・上からアイテムが落ちてくる
   ・20秒ごとにスポーン数と落下速度が増加
   ・矢印キー / 画面左右タップ で移動
   ========================================================= */
class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const W = GAME.WIDTH;

    /* ---- 状態 ---- */
    this.score = 0;
    this.plusCount = 0;
    this.missCount = 0;
    this.timeLeft = GAME.DURATION;
    this.phase = -1;
    this.running = false;
    this.finished = false;

    UI.background(this);

    /* ---- プレイヤー（タイトルで選んだキャラ） ---- */
    const chara = GAME.findChara(CharaStore.get());
    this.chara = chara;

    this.player = this.physics.add.sprite(W / 2, 0, chara.id);
    UI.fitWidth(this.player, chara.width);
    this.player.y = chara.bottom - this.player.displayHeight / 2;
    /* 演出でスケールを変えるので基準値を控えておく */
    this.baseScaleX = this.player.scaleX;
    this.baseScaleY = this.player.scaleY;
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);

    /* 当たり判定は元画像のピクセル基準（表示スケールが自動で掛かる） */
    const body = chara.body;
    this.player.body.setSize(body.w, body.h);
    this.player.body.setOffset(body.x, body.y);

    /*
      当たり判定は見た目より内側にあるため、左右それぞれの差分だけワールド境界を
      内側に狭めておくと、キャラクターが画面端で見切れなくなる。
      （判定が画像の中央からずれていても左右別々に計算するので正しく止まる）
      （落下アイテムは境界と衝突しないので影響を受けない）
      +6px は傾き演出のはみ出し分
    */
    const texW = this.player.width;
    const insetLeft = body.x * this.baseScaleX + 6;
    const insetRight = (texW - body.x - body.w) * this.baseScaleX + 6;
    this.physics.world.setBounds(insetLeft, 0, GAME.WIDTH - insetLeft - insetRight, GAME.HEIGHT);

    /* 影（キャラの表示サイズと足元の位置に合わせる） */
    this.shadow = this.add.ellipse(
      this.player.x,
      chara.bottom - 4,
      chara.width * 0.8,
      chara.width * 0.17,
      0x16305c,
      0.18
    ).setDepth(19);

    /* ---- アイテム ---- */
    this.items = this.physics.add.group();
    this.physics.add.overlap(this.player, this.items, this.onCatch, null, this);

    /* ---- 入力 ---- */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ a: 'A', d: 'D' });

    /* ---- HUD ---- */
    this.buildHud();

    /* ---- カウントダウン後に開始 ---- */
    this.cameras.main.fadeIn(300, 255, 255, 255);
    this.readyGo();
  }

  /* =======================================================
     HUD
     ======================================================= */
  buildHud() {
    const W = GAME.WIDTH;

    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x16305c, 0.12);
    bar.fillRoundedRect(14, 20, W - 28, 96, 20);
    bar.fillStyle(0xffffff, 1);
    bar.fillRoundedRect(14, 14, W - 28, 96, 20);

    this.scoreLabel = UI.text(this, 40, 40, 'SCORE', 18, '#4a6699', { originX: 0, strokeThickness: 0, shadow: false }).setDepth(101);
    this.scoreText = UI.text(this, 40, 76, '0', 42, '#16305c', { originX: 0, strokeThickness: 0, shadow: false }).setDepth(101);

    this.timeLabel = UI.text(this, W - 40, 40, 'TIME', 18, '#4a6699', { originX: 1, strokeThickness: 0, shadow: false }).setDepth(101);
    this.timeText = UI.text(this, W - 40, 76, String(GAME.DURATION), 42, '#16305c', { originX: 1, strokeThickness: 0, shadow: false }).setDepth(101);

    /* 獲得数の小表示（アイコン + 個数） */
    UI.itemImage(this, W / 2 - 66, 62, 'item_plus', 42).setDepth(101);
    this.plusText = UI.text(this, W / 2 - 50, 64, '0', 26, '#c0342a', { originX: 0, strokeThickness: 0, shadow: false }).setDepth(101);

    UI.itemImage(this, W / 2 + 28, 62, 'item_miss', 32).setDepth(101);
    this.missText = UI.text(this, W / 2 + 52, 64, '0', 26, '#54708a', { originX: 0, strokeThickness: 0, shadow: false }).setDepth(101);

    /* 残り時間ゲージ */
    this.gaugeW = W - 28;
    this.gaugeBg = this.add.graphics().setDepth(100);
    this.gaugeBg.fillStyle(0x16305c, 0.18);
    this.gaugeBg.fillRoundedRect(14, 116, this.gaugeW, 14, 7);
    this.gauge = this.add.graphics().setDepth(101);
    this.drawGauge(1);
  }

  drawGauge(rate) {
    const r = Phaser.Math.Clamp(rate, 0, 1);
    this.gauge.clear();
    this.gauge.fillStyle(r > 0.25 ? 0x35c46a : 0xff4f6d, 1);
    if (r > 0) {
      this.gauge.fillRoundedRect(14, 116, Math.max(14, this.gaugeW * r), 14, 7);
    }
  }

  /* =======================================================
     開始演出
     ======================================================= */
  readyGo() {
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;
    const words = ['3', '2', '1', 'START!'];
    let i = 0;
    let current = null;

    const show = () => {
      /* 直前の表示は必ず消してから次を出す */
      if (current) { current.destroy(); current = null; }

      const isLast = (i === words.length - 1);
      const t = UI.text(this, W / 2, H / 2 - 60, words[i], isLast ? 84 : 120, '#ffffff', { strokeThickness: 0 })
        .setDepth(200);
      t.setStroke('#16305c', 12);
      t.setScale(0.4);
      current = t;

      this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.out' });
      this.time.delayedCall(340, () => {
        if (!t.active) { return; }
        this.tweens.add({
          targets: t,
          alpha: 0,
          scale: 1.35,
          duration: 240,
          onComplete: () => {
            if (current === t) { current = null; }
            t.destroy();
          }
        });
      });

      if (isLast) { Sfx.start(); } else { Sfx.count(); }

      i++;
      if (i < words.length) {
        this.time.delayedCall(600, show);
      } else {
        this.time.delayedCall(420, () => this.startRound());
      }
    };

    show();
  }

  /* =======================================================
     ラウンド進行
     ======================================================= */
  startRound() {
    this.running = true;

    /* 1秒ごとのカウントダウン */
    this.tickTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.onSecond,
      callbackScope: this
    });

    this.applyPhase(0, true);
  }

  onSecond() {
    if (!this.running) { return; }

    this.timeLeft--;
    this.timeText.setText(String(Math.max(0, this.timeLeft)));
    this.drawGauge(this.timeLeft / GAME.DURATION);

    if (this.timeLeft <= 10 && this.timeLeft > 0) {
      this.timeText.setColor('#ff2f55');
      this.tweens.add({
        targets: this.timeText,
        scale: { from: 1.25, to: 1 },
        duration: 260,
        ease: 'Quad.out'
      });
      Sfx.count();
    }

    if (this.timeLeft <= 0) {
      this.endRound();
      return;
    }

    /* 20秒ごとに難易度アップ */
    const elapsed = GAME.DURATION - this.timeLeft;
    const next = GAME.phaseIndexOf(elapsed);
    if (next !== this.phase) {
      this.applyPhase(next, false);
    }
  }

  applyPhase(index, silent) {
    this.phase = index;
    const p = GAME.PHASES[index];

    if (this.spawnTimer) { this.spawnTimer.remove(false); }
    this.spawnTimer = this.time.addEvent({
      delay: p.interval,
      loop: true,
      callback: this.spawnBurst,
      callbackScope: this
    });

    if (!silent) { this.showSpeedUp(); }
  }

  showSpeedUp() {
    const t = UI.text(this, GAME.WIDTH / 2, 300, 'SPEED UP!', 62, '#ffffff', { strokeThickness: 0 })
      .setDepth(200)
      .setScale(0.5);
    t.setStroke('#ff4f6d', 12);

    this.tweens.add({ targets: t, scale: 1, duration: 240, ease: 'Back.out' });
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: 250,
      delay: 620,
      duration: 340,
      onComplete: () => t.destroy()
    });

    this.cameras.main.flash(180, 255, 220, 220);
    Sfx.tone(440, 880, 0.22, 'square', 0.12, 0);
  }

  /* =======================================================
     アイテム生成
     ======================================================= */
  spawnBurst() {
    if (!this.running) { return; }

    const p = GAME.PHASES[this.phase];
    const count = Phaser.Math.Between(p.burstMin, p.burstMax);

    for (let i = 0; i < count; i++) {
      this.spawnItem(p, i);
    }
  }

  spawnItem(p, index) {
    const isMiss = Math.random() < p.missRate;
    const key = isMiss ? 'item_miss' : 'item_plus';
    const x = Phaser.Math.Between(46, GAME.WIDTH - 46);
    const y = -50 - index * 90;

    const item = this.items.create(x, y, key);
    UI.fitHeight(item, GAME.ITEM_HEIGHT);
    item.setDepth(10);
    item.setData('miss', isMiss);

    /* 当たり判定は元画像のピクセル基準（表示スケールが自動で掛かる） */
    const b = isMiss ? GAME.ITEM_BODY.miss : GAME.ITEM_BODY.plus;
    item.body.setSize(b.w, b.h);
    item.body.setOffset(b.x, b.y);
    item.body.setAllowGravity(false);

    item.setVelocityY(Phaser.Math.Between(p.speedMin, p.speedMax));

    if (isMiss) {
      /* たらいはそのまま落ちてくる見た目にする（少しだけ傾ける） */
      item.setAngle(Phaser.Math.Between(-10, 10));
    } else {
      item.setAngularVelocity(Phaser.Math.Between(-150, 150));
    }

    return item;
  }

  /* =======================================================
     キャッチ
     ======================================================= */
  onCatch(player, item) {
    if (!this.running || item.getData('taken')) { return; }
    item.setData('taken', true);

    const isMiss = item.getData('miss');
    const gain = isMiss ? GAME.SCORE_MISS : GAME.SCORE_PLUS;

    this.score += gain;

    if (isMiss) {
      this.missCount++;
      this.missText.setText(String(this.missCount));
    } else {
      this.plusCount++;
      this.plusText.setText(String(this.plusCount));
    }

    this.scoreText.setText(String(this.score));
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.3, to: 1 },
      duration: 240,
      ease: 'Back.out'
    });

    this.popup(item.x, item.y, (gain > 0 ? '+' : '') + gain, isMiss);
    this.burst(item.x, item.y, isMiss);

    if (isMiss) {
      Sfx.miss();
      this.cameras.main.shake(220, 0.012);
      this.cameras.main.flash(220, 255, 90, 120);
      this.player.setTint(0xff6b83);
      this.time.delayedCall(260, () => this.player.clearTint());
    } else {
      Sfx.plus();
      /* 連続キャッチでスケールが累積しないよう、毎回基準値から演出する */
      this.tweens.killTweensOf(this.player);
      this.player.setScale(this.baseScaleX, this.baseScaleY);
      this.tweens.add({
        targets: this.player,
        scaleX: this.baseScaleX * 1.14,
        scaleY: this.baseScaleY * 1.14,
        duration: 110,
        yoyo: true,
        ease: 'Quad.out',
        onComplete: () => this.player.setScale(this.baseScaleX, this.baseScaleY)
      });
    }

    item.destroy();
  }

  popup(x, y, label, isMiss) {
    x = Phaser.Math.Clamp(x, 60, GAME.WIDTH - 60);

    const t = UI.text(this, x, y, label, isMiss ? 44 : 38, isMiss ? '#ff2f55' : '#ffa000', { strokeThickness: 0 })
      .setDepth(150);
    t.setStroke('#ffffff', 7);

    this.tweens.add({
      targets: t,
      y: y - 90,
      alpha: 0,
      scale: { from: 1.25, to: 0.9 },
      duration: 720,
      ease: 'Quad.out',
      onComplete: () => t.destroy()
    });
  }

  burst(x, y, isMiss) {
    const emitter = this.add.particles(x, y, 'spark', {
      speed: { min: 90, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: isMiss ? 0.9 : 0.7, end: 0 },
      lifespan: 420,
      quantity: isMiss ? 16 : 12,
      tint: isMiss ? [0xc9d4dd, 0x8fa3b5, 0xffffff] : [0xe23b2e, 0xffd66b, 0xffffff],
      emitting: false
    }).setDepth(140);

    emitter.explode();
    this.time.delayedCall(700, () => emitter.destroy());
  }

  /* =======================================================
     終了
     ======================================================= */
  endRound() {
    if (this.finished) { return; }
    this.finished = true;
    this.running = false;

    if (this.spawnTimer) { this.spawnTimer.remove(false); }
    if (this.tickTimer) { this.tickTimer.remove(false); }

    this.timeText.setText('0');
    this.drawGauge(0);
    this.player.setVelocityX(0);

    this.items.getChildren().slice().forEach((item) => {
      item.body.setVelocity(0, 0);
      item.setAngularVelocity(0);
      this.tweens.add({
        targets: item,
        alpha: 0,
        scale: 0.4,
        duration: 380,
        onComplete: () => item.destroy()
      });
    });

    Sfx.finish();

    const t = UI.text(this, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, 'TIME UP!', 92, '#ffffff', { strokeThickness: 0 })
      .setDepth(200)
      .setScale(0.4);
    t.setStroke('#16305c', 14);

    this.tweens.add({ targets: t, scale: 1, duration: 380, ease: 'Back.out' });

    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(280, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Result', {
          score: this.score,
          plus: this.plusCount,
          miss: this.missCount
        });
      });
    });
  }

  /* =======================================================
     毎フレーム
     ======================================================= */
  update() {
    const player = this.player;

    if (!this.running) {
      player.setVelocityX(0);
    } else {
      let dir = 0;

      if (this.cursors.left.isDown || this.keys.a.isDown) {
        dir = -1;
      } else if (this.cursors.right.isDown || this.keys.d.isDown) {
        dir = 1;
      } else {
        /* 画面の左半分 / 右半分をタップ（押しっぱなしで移動） */
        const pointer = this.input.activePointer;
        if (pointer.isDown) {
          dir = (pointer.worldX < GAME.WIDTH / 2) ? -1 : 1;
        }
      }

      player.setVelocityX(dir * GAME.PLAYER_SPEED);
      player.setAngle(Phaser.Math.Linear(player.angle, dir * 6, 0.2));
    }

    this.shadow.x = player.x;

    /* 画面外に落ちたアイテムを片付ける */
    const children = this.items.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      if (children[i].y > GAME.HEIGHT + 80) {
        children[i].destroy();
      }
    }
  }
}
