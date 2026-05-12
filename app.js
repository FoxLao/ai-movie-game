// ===== 配置 =====
const API_URL = '/api/story';  // 后端 API 地址

// ===== 状态 =====
let gameState = {
  genre: '',
  theme: '',
  chapter: 1,
  choiceCount: 0,
  history: [],       // { role, content }
  sceneCount: 0,
  isTyping: false,
};

// ===== DOM =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== 启动画面逻辑 =====
let selectedGenre = null;

$$('.genre-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.genre-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedGenre = btn.dataset.genre;
    
    if (selectedGenre === '自由') {
      $('#custom-theme').classList.remove('hidden');
      $('#theme-input').focus();
    } else {
      $('#custom-theme').classList.add('hidden');
    }
    $('#start-btn').disabled = false;
  });
});

$('#theme-input').addEventListener('input', () => {
  if (selectedGenre === '自由') {
    $('#start-btn').disabled = !$('#theme-input').value.trim();
  }
});

$('#start-btn').addEventListener('click', () => {
  if (!selectedGenre) return;
  
  gameState.genre = selectedGenre;
  gameState.theme = selectedGenre === '自由' 
    ? $('#theme-input').value.trim() 
    : $(`.genre-btn.selected`).dataset.desc;
  
  startGame();
});

$('#restart-btn').addEventListener('click', resetGame);
$('#replay-btn').addEventListener('click', resetGame);

// ===== 游戏核心 =====
async function startGame() {
  // 切换画面
  $('#start-screen').classList.remove('active');
  $('#game-screen').classList.add('active');
  $('#chapter-info').textContent = '第1章';
  $('#choice-count').textContent = '选择: 0';
  
  // 构建系统提示
  const systemPrompt = buildSystemPrompt();
  gameState.history = [{ role: 'system', content: systemPrompt }];
  
  // 请求开场
  await requestScene('开始游戏');
}

function buildSystemPrompt() {
  return `你是一个专业的互动影游剧本引擎。

【类型】${gameState.genre}
【主题】${gameState.theme}

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
}

async function requestScene(userChoice) {
  if (gameState.isTyping) return;
  
  gameState.history.push({ role: 'user', content: userChoice });
  
  showLoading('AI 正在编织故事...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: gameState.history.slice(-10), // 最近10条上下文
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const storyText = data.content;
    gameState.history.push({ role: 'assistant', content: storyText });
    gameState.sceneCount++;
    
    hideLoading();
    
    // 检查是否结局
    if (storyText.includes('【THE END】') || storyText.includes('结局')) {
      await showScene(storyText, true);
    } else {
      await showScene(storyText, false);
    }
    
  } catch (err) {
    hideLoading();
    console.error('API Error:', err);
    showError('故事生成失败: ' + err.message + '\n\n请检查后端服务是否启动。');
  }
}

// ===== 场景展示（打字机效果）=====
async function showScene(text, isEnding) {
  gameState.isTyping = true;
  
  // 解析场景名
  const sceneMatch = text.match(/【场景名】(.+)/);
  const sceneName = sceneMatch ? sceneMatch[1].trim() : `场景 ${gameState.sceneCount}`;
  
  // 解析正文和选项
  const { narrative, choices } = parseStory(text);
  
  // 更新场景标题
  $('#scene-title').textContent = sceneName;
  
  // 打字机效果
  const storyEl = $('#story-text');
  const choicesEl = $('#choices');
  storyEl.innerHTML = '';
  choicesEl.innerHTML = '';
  
  // 逐字显示
  for (let i = 0; i < narrative.length; i++) {
    if (!gameState.isTyping) break; // 如果被中断
    
    storyEl.innerHTML = narrative.substring(0, i + 1) + '<span class="cursor"></span>';
    
    // 标点停顿
    const char = narrative[i];
    if ('。！？…'.includes(char)) {
      await sleep(200);
    } else if ('，、；：'.includes(char)) {
      await sleep(100);
    } else {
      await sleep(30);
    }
  }
  
  // 移除光标
  storyEl.innerHTML = narrative;
  
  if (isEnding) {
    showEnding(narrative, text);
    return;
  }
  
  // 显示选项（带动画）
  for (let i = 0; i < choices.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choices[i].text;
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(10px)';
    
    btn.addEventListener('click', () => handleChoice(choices[i]));
    
    choicesEl.appendChild(btn);
    
    // 动画延迟
    await sleep(150);
    btn.style.transition = 'all 0.3s';
    btn.style.opacity = '1';
    btn.style.transform = 'translateY(0)';
  }
  
  gameState.isTyping = false;
}

function parseStory(text) {
  // 提取选项
  const choiceRegex = /\[([A-C])\]\s*(.+)/g;
  const choices = [];
  let match;
  
  while ((match = choiceRegex.exec(text)) !== null) {
    choices.push({
      key: match[1],
      text: match[2].trim(),
    });
  }
  
  // 提取正文（去掉场景名和选项）
  let narrative = text
    .replace(/【场景名】.+\n?/, '')
    .replace(/\[[A-C]\].+/g, '')
    .replace(/【THE END】/g, '')
    .replace(/【结局[：:].+/g, '')
    .trim();
  
  return { narrative, choices };
}

function handleChoice(choice) {
  gameState.choiceCount++;
  gameState.chapter = Math.floor(gameState.choiceCount / 3) + 1;
  
  $('#chapter-info').textContent = `第${gameState.chapter}章`;
  $('#choice-count').textContent = `选择: ${gameState.choiceCount}`;
  
  // 清空选项
  $('#choices').innerHTML = '';
  
  // 发送选择
  requestScene(`我选择 ${choice.key}：${choice.text}`);
}

// ===== 结局 =====
function showEnding(narrative, fullText) {
  gameState.isTyping = false;
  
  setTimeout(() => {
    $('#game-screen').classList.remove('active');
    $('#ending-screen').classList.add('active');
    
    // 结局类型
    let endingType = '普通结局';
    if (fullText.includes('好')) endingType = '✨ 好结局';
    else if (fullText.includes('坏')) endingType = '💀 坏结局';
    
    $('#ending-title').textContent = '故事结束';
    $('#ending-text').textContent = narrative;
    $('#total-choices').textContent = gameState.choiceCount;
    $('#ending-type').textContent = endingType;
  }, 1000);
}

// ===== 重置 =====
function resetGame() {
  gameState = {
    genre: '', theme: '', chapter: 1,
    choiceCount: 0, history: [], sceneCount: 0, isTyping: false,
  };
  
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#start-screen').classList.add('active');
  $('#custom-theme').classList.add('hidden');
  $$('.genre-btn').forEach(b => b.classList.remove('selected'));
  $('#start-btn').disabled = true;
  $('#theme-input').value = '';
  $('#story-text').innerHTML = '';
  $('#choices').innerHTML = '';
}

// ===== UI Helpers =====
function showLoading(text) {
  $('#loading-text').textContent = text || '加载中...';
  $('#loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  $('#loading-overlay').classList.add('hidden');
}

function showError(msg) {
  const storyEl = $('#story-text');
  storyEl.innerHTML = `<span style="color:#ff6b6b">${msg}</span>`;
  
  const choicesEl = $('#choices');
  choicesEl.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = '🔄 重试';
  btn.addEventListener('click', () => {
    gameState.history.pop(); // 移除失败的请求
    requestScene('继续故事');
  });
  choicesEl.appendChild(btn);
  
  gameState.isTyping = false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
