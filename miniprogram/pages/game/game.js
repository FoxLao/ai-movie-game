/**
 * 游戏核心页面
 * 管理剧情展示、用户选择、AI交互
 */
const app = getApp();

// 题材对应的场景配色
const SCENE_COLORS = {
  '科幻': 'linear-gradient(135deg, #0a1628, #1a0a3e, #0a1a3e)',
  '悬疑': 'linear-gradient(135deg, #1a1a1a, #2a1a1a, #1a1a2a)',
  '古风': 'linear-gradient(135deg, #1a1208, #2a1a0a, #1a1a08)',
  '恋爱': 'linear-gradient(135deg, #1a0a1e, #2a0a1a, #1a0818)',
  '恐怖': 'linear-gradient(135deg, #0a0a0a, #1a0a0a, #0a0a1a)',
  '自由': 'linear-gradient(135deg, #0a1a2e, #1a0a2e, #0a0a1e)',
};

Page({
  data: {
    chapter: 1,
    choiceCount: 0,
    sceneName: '开场',
    sceneColor: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    displayText: '',
    isTyping: false,
    showChoices: false,
    choices: [],
    isLoading: false,
    loadingText: 'AI 正在编织故事...',
    scrollTarget: '',
    history: [],
  },

  onLoad() {
    const g = app.globalData;
    this.setData({
      sceneColor: SCENE_COLORS[g.genre] || SCENE_COLORS['自由'],
      chapter: g.chapter,
      choiceCount: g.choiceCount,
    });

    // 构建系统提示
    const systemPrompt = this.buildPrompt(g.genre, g.theme);
    this.setData({ history: [{ role: 'system', content: systemPrompt }] });

    // 请求开场
    this.requestScene('开始游戏');
  },

  buildPrompt(genre, theme) {
    return `你是一个专业的互动影游剧本引擎。

【类型】${genre}
【主题】${theme}

【核心规则】
1. 用第二人称"你"来叙述故事，像电影镜头一样描写场景
2. 每次回复包含：场景描写（200-300字）+ 2-3个选项
3. 选项前用 [A] [B] [C] 标注
4. 保持紧张感和悬念，每3-4个选择后设置一个关键转折
5. 根据玩家的所有历史选择影响剧情走向
6. 场景描写要有画面感，包含环境、声音、气味等感官细节
7. 在开头用 【场景名】标注当前场景名称

【输出格式】严格按以下格式：
【场景名】xxx

（场景描写文字）

[A] 选项一
[B] 选项二
[C] 选项三

【结局规则】
- 当玩家做出第8-12个选择后，根据选择质量决定结局
- 好结局/普通结局/坏结局，用 【结局：好/普通/坏】标注
- 结局时用 【THE END】标记

【重要】只输出故事内容和选项，不要输出任何解释或元信息。`;
  },

  async requestScene(userChoice) {
    if (this.data.isTyping) return;

    const history = this.data.history;
    history.push({ role: 'user', content: userChoice });

    this.setData({
      isLoading: true,
      loadingText: 'AI 正在编织故事...',
      showChoices: false,
      choices: [],
      history,
    });

    try {
      const content = await this.callAPI(history.slice(-10));
      history.push({ role: 'assistant', content });

      const isEnding = content.includes('【THE END】') || content.includes('结局');
      await this.showScene(content, isEnding);

    } catch (err) {
      console.error('API Error:', err);
      this.setData({
        isLoading: false,
        displayText: '生成失败：' + err.message + '\n\n请检查网络或服务器配置。',
        showChoices: true,
        choices: [{ key: 'R', text: '🔄 重试' }],
      });
    }
  },

  async callAPI(messages) {
    const apiBase = app.globalData.apiBase;

    return new Promise((resolve, reject) => {
      wx.request({
        url: apiBase + '/api/story',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { messages },
        success(res) {
          if (res.statusCode === 200 && res.data.content) {
            resolve(res.data.content);
          } else {
            reject(new Error(res.data.error || `HTTP ${res.statusCode}`));
          }
        },
        fail(err) {
          reject(new Error('网络请求失败'));
        },
        timeout: 30000,
      });
    });
  },

  // 打字机效果
  showScene(text, isEnding) {
    return new Promise((resolve) => {
      const { narrative, choices } = this.parseStory(text);
      const sceneMatch = text.match(/【场景名】(.+)/);
      const sceneName = sceneMatch ? sceneMatch[1].trim() : '...';

      this.setData({
        sceneName,
        isLoading: false,
        isTyping: true,
        displayText: '',
      });

      let i = 0;
      const timer = setInterval(() => {
        if (i >= narrative.length) {
          clearInterval(timer);
          this.setData({ isTyping: false });

          if (isEnding) {
            this.showEnding(narrative, text);
          } else {
            this.setData({
              showChoices: true,
              choices,
            });
          }
          resolve();
          return;
        }

        i++;
        this.setData({
          displayText: narrative.substring(0, i),
          scrollTarget: 'scroll-bottom',
        });
      }, 35);
    });
  },

  parseStory(text) {
    const choiceRegex = /\[([A-C])\]\s*(.+)/g;
    const choices = [];
    let match;
    while ((match = choiceRegex.exec(text)) !== null) {
      choices.push({ key: match[1], text: match[2].trim() });
    }

    const narrative = text
      .replace(/【场景名】.+\n?/, '')
      .replace(/\[[A-C]\].+/g, '')
      .replace(/【THE END】/g, '')
      .replace(/【结局[：:].+/g, '')
      .trim();

    return { narrative, choices };
  },

  makeChoice(e) {
    const idx = e.currentTarget.dataset.index;
    const choice = this.data.choices[idx];

    // 重试
    if (choice.key === 'R') {
      this.data.history.pop(); // 移除失败请求
      this.requestScene('继续故事');
      return;
    }

    const choiceCount = this.data.choiceCount + 1;
    const chapter = Math.floor(choiceCount / 3) + 1;

    this.setData({ choiceCount, chapter });

    app.globalData.choiceCount = choiceCount;
    app.globalData.chapter = chapter;

    this.requestScene(`我选择 ${choice.key}：${choice.text}`);
  },

  showEnding(narrative, fullText) {
    let endingType = '普通结局';
    if (fullText.includes('好')) endingType = '✨ 好结局';
    else if (fullText.includes('坏')) endingType = '💀 坏结局';

    app.globalData.endingText = narrative;
    app.globalData.endingType = endingType;

    setTimeout(() => {
      wx.redirectTo({ url: '/pages/ending/ending' });
    }, 500);
  },

  restartGame() {
    wx.showModal({
      title: '重新开始？',
      content: '当前进度将丢失',
      success: (res) => {
        if (res.confirm) {
          app.globalData.chapter = 1;
          app.globalData.choiceCount = 0;
          app.globalData.history = [];
          app.globalData.sceneCount = 0;
          wx.redirectTo({ url: '/pages/index/index' });
        }
      },
    });
  },
});
