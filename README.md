# AI 影游生成器

AI 驱动的互动影游 H5 原型，用户选择题材 → AI 实时生成分支剧情 → 互动体验。

## 快速启动

```bash
# 1. 配置 API Key（支持任何 OpenAI 兼容 API）
export API_KEY=sk-your-key

# 2. 可选配置
export API_BASE=https://api.openai.com/v1  # API 地址
export MODEL=gpt-4o-mini                     # 模型名
export PORT=3000                             # 端口

# 3. 启动
node server.js
```

## 支持的 API

任何 OpenAI 兼容接口都可以：
- OpenAI: `API_BASE=https://api.openai.com/v1`
- DeepSeek: `API_BASE=https://api.deepseek.com/v1`
- 智谱: `API_BASE=https://open.bigmodel.cn/api/paas/v4`
- Moonshot: `API_BASE=https://api.moonshot.cn/v1`
- 本地 Ollama: `API_BASE=http://localhost:11434/v1`

## 功能

- 🎭 6种题材：科幻、悬疑、古风、恋爱、恐怖、自定义
- 🤖 AI 实时生成分支剧情
- ✍️ 打字机效果展示
- 🔀 玩家选择影响结局
- 📱 手机/电脑自适应

## 文件结构

```
├── index.html   # 主页面
├── style.css    # 样式
├── app.js       # 前端逻辑
├── server.js    # 后端 API 代理
└── README.md    # 说明
```

## 后续升级方向

- [ ] 接入图片生成（ComfyUI/可灵）
- [ ] 接入 TTS 配音
- [ ] 添加音效/BGM
- [ ] 支持用户自定义角色
- [ ] 打包成微信小程序
- [ ] 多人在线互动
