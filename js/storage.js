/* =========================================================
   localStorage 保存まわり
   ハイスコアと、その記録を出したときのプラス数 / ミス数を保存する
   ========================================================= */
const ScoreStore = {
  KEY: 'taraiotoshi.best',

  /* 保存済みのベスト記録を取得（無ければ null） */
  load: function () {
    try {
      const raw = window.localStorage.getItem(this.KEY);
      if (!raw) { return null; }
      const d = JSON.parse(raw);
      if (!d || typeof d.score !== 'number') { return null; }
      return {
        score: d.score | 0,
        plus: d.plus | 0,
        miss: d.miss | 0,
        date: typeof d.date === 'string' ? d.date : ''
      };
    } catch (e) {
      return null;
    }
  },

  save: function (record) {
    try {
      window.localStorage.setItem(this.KEY, JSON.stringify(record));
      return true;
    } catch (e) {
      /* プライベートモード等で失敗しても遊べるようにする */
      return false;
    }
  },

  /* 結果を登録。ハイスコア更新なら true */
  submit: function (result) {
    const best = this.load();
    if (best && result.score <= best.score) { return false; }

    const d = new Date();
    const date = d.getFullYear() + '/' +
      ('0' + (d.getMonth() + 1)).slice(-2) + '/' +
      ('0' + d.getDate()).slice(-2);

    this.save({ score: result.score, plus: result.plus, miss: result.miss, date: date });
    return true;
  },

  clear: function () {
    try { window.localStorage.removeItem(this.KEY); } catch (e) { /* noop */ }
  }
};

/* =========================================================
   選択中のキャラクター
   ・リトライ時もそのまま使えるようメモリに持ち、次回起動用に localStorage にも保存
   ・localStorage が使えない環境でもメモリ上の値で動く
   ========================================================= */
const CharaStore = {
  KEY: 'taraiotoshi.chara',
  current: null,

  get: function () {
    if (this.current === null) {
      try {
        this.current = window.localStorage.getItem(this.KEY);
      } catch (e) {
        this.current = null;
      }
    }
    /* 保存値が古い・不正でも、必ず存在するキャラを返す */
    return GAME.findChara(this.current).id;
  },

  set: function (id) {
    this.current = GAME.findChara(id).id;
    try {
      window.localStorage.setItem(this.KEY, this.current);
    } catch (e) {
      /* 保存できなくてもメモリ上の選択で遊べる */
    }
  }
};
