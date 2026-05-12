Page({
  data: {
    selectedGenre: '',
    customTheme: '',
    canStart: false,
  },

  selectGenre(e) {
    const genre = e.currentTarget.dataset.genre;
    const desc = e.currentTarget.dataset.desc;
    this._genreDesc = desc || '';
    this.setData({
      selectedGenre: genre,
      canStart: genre !== '自由',
      customTheme: '',
    });
  },

  onThemeInput(e) {
    const val = e.detail.value.trim();
    this._genreDesc = val;
    this.setData({
      customTheme: e.detail.value,
      canStart: val.length > 0,
    });
  },

  startGame() {
    if (!this.data.canStart) return;

    const app = getApp();
    const genre = this.data.selectedGenre;
    const theme = this._genreDesc || genre;

    app.globalData.genre = genre;
    app.globalData.theme = theme;
    app.globalData.chapter = 1;
    app.globalData.choiceCount = 0;
    app.globalData.history = [];
    app.globalData.sceneCount = 0;

    wx.navigateTo({ url: '/pages/game/game' });
  },
});
