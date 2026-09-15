/* =========================================================
   ゲーム全体の設定値
   ========================================================= */
const GAME = {
  WIDTH: 540,
  HEIGHT: 960,

  TITLE: 'DEAD OR ALIVE',
  TITLE_SUB: 'よいちゃんのチキチキたらいおとし',

  /* 1ゲームの長さ（秒） */
  DURATION: 60,
  /* 何秒ごとに難易度を上げるか */
  PHASE_SECONDS: 20,

  /* 得点 */
  SCORE_PLUS: 20,
  SCORE_MISS: -50,

  /* プレイヤー */
  PLAYER_SPEED: 540,
  PLAYER_WIDTH: 150,
  PLAYER_Y: 838,

  /* 地面（草地）の高さ */
  GROUND_H: 84,

  /* ロゴ（assets/img/logo.png）の表示幅 */
  LOGO_WIDTH: 486,

  /*
    アイテムの表示サイズ（高さ基準・幅は元画像の比率で自動計算）と当たり判定。
    当たり判定は元画像のピクセル基準で指定する（表示スケールが自動で掛かる）。
      plus … assets/img/item_1.png（ジュース 101 x 250）
      miss … assets/img/item_2.png（たらい   400 x 340／余白が多いので内側だけ判定）
  */
  ITEM_HEIGHT: 86,
  ITEM_BODY: {
    plus: { w: 78, h: 241, x: 11, y: 3 },
    miss: { w: 356, h: 224, x: 22, y: 58 }
  },

  /*
    難易度フェーズ（0-20秒 / 20-40秒 / 40-60秒）
    interval : スポーン間隔(ms)
    burst    : 1回のスポーンで降ってくる個数
    speed    : 落下速度(px/秒)
    missRate : ミスアイテムの出現率
  */
  PHASES: [
    { interval: 780, burstMin: 1, burstMax: 1, speedMin: 190, speedMax: 250, missRate: 0.30 },
    { interval: 620, burstMin: 1, burstMax: 2, speedMin: 250, speedMax: 340, missRate: 0.36 },
    { interval: 500, burstMin: 2, burstMax: 3, speedMin: 320, speedMax: 440, missRate: 0.42 }
  ],

  /*
    リザルトで表示する称号（スコアの高い順に並べる）
    min 以上なら、その称号になる。
      0 〜  300 親衛隊        /    -1 〜  -500 愉悦部員
    301 〜  600 親衛隊の先輩  /  -501 〜 -1000 愉悦部先輩
    601 〜 1000 親衛隊隊長    / -1001 〜 -2000 愉悦部部長
   1001 〜      親衛隊の王    / -2001 〜       愉悦王
  */
  RANKS: [
    { min: 1001, label: '親衛隊の王', color: 0xffb61f, shade: 0xc98100 },
    { min: 601, label: '親衛隊隊長', color: 0x2f8fe0, shade: 0x1d63a5 },
    { min: 301, label: '親衛隊の先輩', color: 0x35bf6a, shade: 0x218a49 },
    { min: 0, label: '親衛隊', color: 0x5fbfe8, shade: 0x3a8db2 },
    { min: -500, label: '愉悦部員', color: 0xa877dd, shade: 0x7549ab },
    { min: -1000, label: '愉悦部先輩', color: 0x8a49cf, shade: 0x5d2c92 },
    { min: -2000, label: '愉悦部部長', color: 0xcf4090, shade: 0x922a63 },
    { min: -Infinity, label: '愉悦王', color: 0xe2332f, shade: 0x9b1a17 }
  ],

  /* 配色 */
  COLOR: {
    skyTop: 0x63b4ff,
    skyBottom: 0xdcf1ff,
    ground: 0x7dd47f,
    groundDark: 0x54b45c,
    ink: 0x16305c,
    inkSoft: 0x4a6699,
    white: 0xffffff,
    plus: 0xe23b2e,
    plusDark: 0x8f1f16,
    miss: 0x8fa3b5,
    missAccent: 0xff4f6d,
    panel: 0xffffff
  }
};

/* Phaser のテキストで使うフォント */
const FONT = '"Yu Gothic", "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif';

/* 経過秒数からフェーズ番号を求める */
GAME.phaseIndexOf = function (elapsedSec) {
  const i = Math.floor(elapsedSec / GAME.PHASE_SECONDS);
  return Phaser.Math.Clamp(i, 0, GAME.PHASES.length - 1);
};

/* スコアから称号を求める */
GAME.rankOf = function (score) {
  for (let i = 0; i < GAME.RANKS.length; i++) {
    if (score >= GAME.RANKS[i].min) { return GAME.RANKS[i]; }
  }
  return GAME.RANKS[GAME.RANKS.length - 1];
};

/* プラス側の称号かどうか（演出の出し分け用） */
GAME.isGoodRank = function (rank) {
  return rank.min >= 0;
};
