App({
  globalData: {
    apiBase: 'https://your-server.com',  // 换成你的服务器地址
    apiKey: '',                            // 或通过后端代理，不需要前端填
    genre: '',
    theme: '',
    chapter: 1,
    choiceCount: 0,
    history: [],
    sceneCount: 0,
    endingText: '',
    endingType: '',
  },

  onLaunch() {
    console.log('AI影游生成器启动');
  }
});
