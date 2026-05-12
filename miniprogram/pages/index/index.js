Page({
  data: {
    selectedGenre: '',
    customTheme: '',
    canStart: false,
  },

  selectGenre(e) {
    const genre = e.currentTarget.dataset.genre;
    this.setData({
      selectedGenre: genre,
      canStart: genre !== '自由',
      customTheme: '',
    });
  },

  onThemeInput(e) {
    this.setData({
      customTheme: e.detail.value,
      canStart: e.detail.value.trim().length > 0,
    });
  },

  startGame() {
    if (!this.data.canStart) return;

    const app = getApp();
    const genre = this.data.selectedGenre;
    const desc = this.data.selectedGenre === '自由'
      ? this.data.customTheme
      : e.currentTarget.dataset.desc || genre;

    // 存到全局
    app.globalData.genre = genre;
    app.globalData.theme = desc || genre;
    app.globalData.chapter = 1;
    app.globalData.choiceCount = 0;
    app.globalData.history = [];
    app.globalData.sceneCount = 0;

    wx.navigateTo({ url: '/pages/game/game' });
  },
});
