// ===== 配置 =====
const API_URL = '/api/story';

// ===== 状态 =====
let gameState = {
  genre: '',
  theme: '',
  chapter: 1,
  choiceCount: 0,
  history: [],
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
  $('#start-screen').classList.remove('active');
  $('#game-screen').classList.add('active');
  $('#chapter-info').textContent = '第1章';
  $('#choice-count').textContent = '选择: 0';
  
  const systemPrompt = buildSystemPrompt();
  gameState.history = [{ role: 'system', content: systemPrompt }];
  
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
8. 在场景名之后，用 【画面：xxx】用一句英文描述这个场景的画面，用于AI生成配图

【输出格式】严格按以下格式：
【场景名】xxx
【画面】A dark corridor with flickering lights, cinematic style, 8k

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
        messages: gameState.history.slice(-10),
      }),
    });
    
    const data = await response.json();
    
    if (data.error) throw new Error(data.error);
    
    const storyText = data.content;
    gameState.history.push({ role: 'assistant', content: storyText });
    gameState.sceneCount++;
    
    hideLoading();
    
    // 提取画面描述并生成图片
    const imagePrompt = extractImagePrompt(storyText);
    if (imagePrompt) {
      generateSceneImage(imagePrompt);
    }
    
    if (storyText.includes('【THE END】') || storyText.includes('结局')) {
      await showScene(storyText, true);
    } else {
      await showScene(storyText, false);
    }
    
  } catch (err) {
    hideLoading();
    console.error('API Error:', err);
    showError('故事生成失败: ' + err.message);
  }
}

// ===== 图片生成 =====
function extractImagePrompt(text) {
  const match = text.match(/【画面】(.+)/);
  if (match) return match[1].trim();
  
  // 如果没有【画面】标签，从场景描述自动生成
  const sceneMatch = text.match(/【场景名】(.+)/);
  if (sceneMatch) {
    const sceneName = sceneMatch[1].trim();
    return `${gameState.genre} style, ${sceneName}, cinematic, moody lighting, 8k`;
  }
  return null;
}

function generateSceneImage(prompt) {
  // 使用 pollinations.ai 免费生成图片
  const seed = Math.floor(Math.random() * 999999);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&seed=${seed}&nologo=true`;
  
  const sceneImage = $('#scene-image');
  
  // 先添加淡出效果
  sceneImage.style.opacity = '0.3';
  
  // 预加载图片
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    sceneImage.style.backgroundImage = `url(${imageUrl})`;
    sceneImage.style.opacity = '1';
  };
  img.onerror = () => {
    // 图片加载失败，保持渐变背景
    sceneImage.style.opacity = '1';
  };
  img.src = imageUrl;
}

// ===== 场景展示 =====
async function showScene(text, isEnding) {
  gameState.isTyping = true;
  
  const sceneMatch = text.match(/【场景名】(.+)/);
  const sceneName = sceneMatch ? sceneMatch[1].trim() : `场景 ${gameState.sceneCount}`;
  
  const { narrative, choices } = parseStory(text);
  
  $('#scene-title').textContent = sceneName;
  
  const storyEl = $('#story-text');
  const choicesEl = $('#choices');
  storyEl.innerHTML = '';
  choicesEl.innerHTML = '';
  
  for (let i = 0; i < narrative.length; i++) {
    if (!gameState.isTyping) break;
    
    storyEl.innerHTML = narrative.substring(0, i + 1) + '<span class="cursor"></span>';
    
    const char = narrative[i];
    if ('。！？…'.includes(char)) await sleep(200);
    else if ('，、；：'.includes(char)) await sleep(100);
    else await sleep(30);
  }
  
  storyEl.innerHTML = narrative;
  
  if (isEnding) {
    showEnding(narrative, text);
    return;
  }
  
  for (let i = 0; i < choices.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choices[i].text;
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(10px)';
    btn.addEventListener('click', () => handleChoice(choices[i]));
    choicesEl.appendChild(btn);
    await sleep(150);
    btn.style.transition = 'all 0.3s';
    btn.style.opacity = '1';
    btn.style.transform = 'translateY(0)';
  }
  
  gameState.isTyping = false;
}

function parseStory(text) {
  const choiceRegex = /\[([A-C])\]\s*(.+)/g;
  const choices = [];
  let match;
  while ((match = choiceRegex.exec(text)) !== null) {
    choices.push({ key: match[1], text: match[2].trim() });
  }
  
  let narrative = text
    .replace(/【场景名】.+\n?/, '')
    .replace(/【画面】.+\n?/, '')
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
  $('#choices').innerHTML = '';
  requestScene(`我选择 ${choice.key}：${choice.text}`);
}

// ===== 结局 =====
function showEnding(narrative, fullText) {
  gameState.isTyping = false;
  
  // 结局也生成一张图
  const imagePrompt = extractImagePrompt(fullText);
  if (imagePrompt) generateSceneImage(imagePrompt);
  
  setTimeout(() => {
    $('#game-screen').classList.remove('active');
    $('#ending-screen').classList.add('active');
    
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
  
  // 重置场景图
  const sceneImage = $('#scene-image');
  sceneImage.style.backgroundImage = '';
  sceneImage.style.opacity = '1';
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
  $('#story-text').innerHTML = `<span style="color:#ff6b6b">${msg}</span>`;
  $('#choices').innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = '🔄 重试';
  btn.addEventListener('click', () => {
    gameState.history.pop();
    requestScene('继续故事');
  });
  $('#choices').appendChild(btn);
  gameState.isTyping = false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
