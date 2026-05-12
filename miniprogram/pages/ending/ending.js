const app = getApp();

Page({
  data: {
    endingText: '',
    endingType: '',
    choiceCount: 0,
  },

  onLoad() {
    this.setData({
      endingText: app.globalData.endingText,
      endingType: app.globalData.endingType,
      choiceCount: app.globalData.choiceCount,
    });
  },

  replay() {
    app.globalData.chapter = 1;
    app.globalData.choiceCount = 0;
    app.globalData.history = [];
    app.globalData.sceneCount = 0;
    wx.redirectTo({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    return {
      title: `我在AI影游中做出了${this.data.choiceCount}个选择，结局是${this.data.endingType}`,
      path: '/pages/index/index',
    };
  },
});
