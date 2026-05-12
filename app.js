// ===== AI 影游生成器 v2.0 =====

const API_URL = '/api/story';

// 3D动漫风格
const STYLE = '3D anime style, cel shading, Studio Ghibli, Pixar quality, volumetric lighting, cinematic, ultra detailed, 8k render';

// Ken Burns 动画
const KB_CLASSES = ['kb-zoom-in','kb-zoom-out','kb-pan-left','kb-pan-right','kb-pan-up','kb-rotate','kb-dramatic','kb-slow-zoom'];

// 粒子配置
const PARTICLE_CONFIG = {
  '科幻': { colors: ['#00d4ff','#6c5ce7','#a855f7'], size: 3, speed: 2, count: 25 },
  '悬疑': { colors: ['#ff6b6b','#ffa502','#ddd'], size: 2, speed: 1, count: 12 },
  '古风': { colors: ['#ffa502','#ff6348','#ff9ff3'], size: 4, speed: 1.2, count: 18 },
  '恋爱': { colors: ['#ff6b9d','#c44569','#f8a5c2'], size: 5, speed: 1, count: 22 },
  '恐怖': { colors: ['#2ed573','#a4b0be','#747d8c'], size: 2, speed: 0.6, count: 10 },
  '自由': { colors: ['#6c5ce7','#a855f7','#00d4ff'], size: 3, speed: 1.5, count: 20 },
};

// ===== State =====
let state = { genre:'', theme:'', chapter:1, choiceCount:0, history:[], sceneCount:0, isTyping:false, currentImageUrl:null };

// ===== DOM =====
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(sel => document.querySelectorAll(sel));

// ===== Start Screen =====
let selectedGenre = null;
let genreDesc = '';

document.querySelectorAll('.genre-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedGenre = btn.dataset.genre;
    genreDesc = btn.dataset.desc;
    
    document.getElementById('custom-theme').classList.toggle('hidden', selectedGenre !== '自由');
    document.getElementById('start-btn').disabled = false;
    
    if (selectedGenre === '自由') document.getElementById('theme-input').focus();
  });
});

document.getElementById('theme-input').addEventListener('input', e => {
  if (selectedGenre === '自由') {
    document.getElementById('start-btn').disabled = !e.target.value.trim();
    genreDesc = e.target.value.trim();
  }
});

document.getElementById('start-btn').addEventListener('click', () => {
  if (!selectedGenre) return;
  state.genre = selectedGenre;
  state.theme = genreDesc || selectedGenre;
  startGame();
});

document.getElementById('restart-btn').addEventListener('click', confirmRestart);
document.getElementById('replay-btn').addEventListener('click', resetGame);

// ===== Game =====
function startGame() {
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  updateStatus();
  
  const sys = `你是一个专业的互动影游剧本引擎，擅长创作电影级画面的故事。

【类型】${state.genre}
【主题】${state.theme}

【核心规则】
1. 用第二人称"你"叙述，像电影镜头一样描写
2. 每次回复：场景描写（200-300字）+ 2-3个选项
3. 选项用 [A] [B] [C] 标注
4. 每3-4个选择设置一个关键转折
5. 根据所有历史选择影响剧情
6. 场景要画面感：环境、声音、气味、光影
7. 开头用 【场景名】标注场景名
8. 场景名后用 【画面】用英文描述3D动漫画面（主体+环境+光影+氛围+构图）

【输出格式】严格如下：
【场景名】场景标题
【画面】A girl standing on a cliff overlooking a vast ocean at sunset, wind blowing her hair, magical particles, 3D anime cinematic wide shot, volumetric lighting

场景描写文字...

[A] 选项一
[B] 选项二
[C] 选项三

【画面要求】英文，具体详细，适合3D动漫渲染，电影分镜构图

【结局规则】
- 第8-12个选择后触发结局
- 好结局/普通结局/坏结局用 【结局：好/普通/坏】标注
- 结局用 【THE END】标记

【重要】只输出故事和选项，不输出任何解释。`;
  
  state.history = [{ role: 'system', content: sys }];
  requestScene('开始游戏');
}

async function requestScene(userChoice) {
  if (state.isTyping) return;
  
  state.history.push({ role: 'user', content: userChoice });
  showLoading();
  
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.history.slice(-12) }),
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    const text = data.content;
    state.history.push({ role: 'assistant', content: text });
    state.sceneCount++;
    
    hideLoading();
    
    // 生成图片（异步，不阻塞文字）
    const imgPrompt = extractPrompt(text);
    if (imgPrompt) generateImage(imgPrompt);
    
    const isEnd = text.includes('【THE END】') || /【结局[：:]/.test(text);
    await showScene(text, isEnd);
    
  } catch (err) {
    hideLoading();
    state.history.pop(); // 回滚 user message
    showError(err.message);
  }
}

// ===== Image =====
function extractPrompt(text) {
  const m = text.match(/【画面】(.+)/);
  if (m) return `${m[1].trim()}, ${STYLE}`;
  const s = text.match(/【场景名】(.+)/);
  if (s) return `${s[1].trim()}, ${state.genre} theme, ${STYLE}`;
  return null;
}

function generateImage(prompt) {
  const seed = Date.now();
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1344&height=768&seed=${seed}&nologo=true&model=flux`;
  state.currentImageUrl = url;
  
  const el = document.getElementById('scene-image');
  
  // 清旧动画
  KB_CLASSES.forEach(c => el.classList.remove(c));
  
  // 淡出
  el.style.opacity = '0.3';
  
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url(${url})`;
    el.classList.add(KB_CLASSES[Math.floor(Math.random() * KB_CLASSES.length)]);
    el.style.opacity = '1';
  };
  img.onerror = () => {
    // 图片失败，保持渐变
    el.style.opacity = '1';
  };
  img.src = url;
}

// ===== Particles =====
function spawnParticles() {
  const box = document.getElementById('particles');
  box.innerHTML = '';
  const cfg = PARTICLE_CONFIG[state.genre] || PARTICLE_CONFIG['自由'];
  
  for (let i = 0; i < cfg.count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const opacity = 0.2 + Math.random() * 0.5;
    p.style.cssText = `
      left:${Math.random()*100}%;
      top:${20+Math.random()*80}%;
      width:${cfg.size}px;
      height:${cfg.size}px;
      background:${cfg.colors[i % cfg.colors.length]};
      animation-duration:${(3+Math.random()*6)/cfg.speed}s;
      animation-delay:${Math.random()*4}s;
      --p-opacity:${opacity};
    `;
    box.appendChild(p);
  }
}

// ===== Scene Display =====
async function showScene(text, isEnd) {
  state.isTyping = true;
  
  const sceneName = (text.match(/【场景名】(.+)/) || [,''])[1].trim() || `场景 ${state.sceneCount}`;
  const { narrative, choices } = parse(text);
  
  // 更新UI
  document.getElementById('scene-badge').textContent = sceneName;
  document.getElementById('scene-title').textContent = `第${state.chapter}章 · ${sceneName}`;
  
  const storyEl = document.getElementById('story-text');
  const choicesEl = document.getElementById('choices');
  storyEl.innerHTML = '';
  choicesEl.innerHTML = '';
  storyEl.scrollTop = 0;
  
  // 生成粒子
  spawnParticles();
  
  // Typewriter
  for (let i = 0; i < narrative.length; i++) {
    if (!state.isTyping) break;
    
    storyEl.innerHTML = escHtml(narrative.substring(0, i + 1)) + '<span class="cursor"></span>';
    
    // 自动滚动
    storyEl.scrollTop = storyEl.scrollHeight;
    
    const ch = narrative[i];
    if ('。！？…'.includes(ch)) await sleep(160);
    else if ('，、；：'.includes(ch)) await sleep(70);
    else await sleep(22);
  }
  
  storyEl.innerHTML = escHtml(narrative);
  
  if (isEnd) { showEnding(narrative, text); return; }
  
  // 选项动画
  for (let i = 0; i < choices.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<b>${choices[i].key}.</b> ${escHtml(choices[i].text)}`;
    btn.style.cssText = 'opacity:0;transform:translateY(8px);';
    btn.addEventListener('click', () => choose(choices[i]));
    choicesEl.appendChild(btn);
    await sleep(120);
    btn.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)';
    btn.style.opacity = '1';
    btn.style.transform = 'translateY(0)';
  }
  
  state.isTyping = false;
}

function parse(text) {
  const choices = [];
  const re = /\[([A-C])\]\s*(.+)/g;
  let m;
  while ((m = re.exec(text)) !== null) choices.push({ key: m[1], text: m[2].trim() });
  
  const narrative = text
    .replace(/【场景名】.+\n?/, '')
    .replace(/【画面】.+\n?/, '')
    .replace(/\[[A-C]\].+/g, '')
    .replace(/【THE END】/g, '')
    .replace(/【结局[：:].+/g, '')
    .trim();
  
  return { narrative, choices };
}

function choose(c) {
  state.choiceCount++;
  state.chapter = Math.floor(state.choiceCount / 3) + 1;
  updateStatus();
  document.getElementById('choices').innerHTML = '';
  requestScene(`我选择 ${c.key}：${c.text}`);
}

function updateStatus() {
  document.getElementById('chapter-info').textContent = `第${state.chapter}章`;
  document.getElementById('choice-count').textContent = state.choiceCount;
}

// ===== Ending =====
function showEnding(narrative, fullText) {
  state.isTyping = false;
  
  let type = '普通结局';
  let color = '#ffa502';
  if (/好/.test(fullText)) { type = '✨ 好结局'; color = '#2ed573'; }
  else if (/坏/.test(fullText)) { type = '💀 坏结局'; color = '#ff6b6b'; }
  
  // 设置结局背景
  const bgEl = document.getElementById('ending-bg');
  if (state.currentImageUrl) {
    bgEl.style.backgroundImage = `url(${state.currentImageUrl})`;
  }
  
  setTimeout(() => {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('ending-screen').classList.add('active');
    document.getElementById('ending-title').textContent = '故事结束';
    document.getElementById('ending-type').textContent = type;
    document.getElementById('ending-type').style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44;`;
    document.getElementById('ending-text').textContent = narrative;
    document.getElementById('total-choices').textContent = state.choiceCount;
    document.getElementById('total-scenes').textContent = state.sceneCount;
  }, 800);
}

// ===== Reset =====
function confirmRestart() {
  if (state.isTyping) { state.isTyping = false; }
  if (confirm('确定重新开始？当前进度将丢失。')) resetGame();
}

function resetGame() {
  state = { genre:'', theme:'', chapter:1, choiceCount:0, history:[], sceneCount:0, isTyping:false, currentImageUrl:null };
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('start-screen').classList.add('active');
  document.getElementById('custom-theme').classList.add('hidden');
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('start-btn').disabled = true;
  document.getElementById('theme-input').value = '';
  
  const si = document.getElementById('scene-image');
  KB_CLASSES.forEach(c => si.classList.remove(c));
  si.style.backgroundImage = '';
  si.style.opacity = '1';
  document.getElementById('particles').innerHTML = '';
}

// ===== Share =====
function shareResult() {
  const text = `🎬 我在AI影游中做出了${state.choiceCount}次选择，经历了${state.sceneCount}个场景！快来试试 → `;
  if (navigator.share) {
    navigator.share({ title: 'AI影游', text, url: location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text + location.href).then(() => alert('链接已复制！')).catch(() => {});
  }
}

// ===== Helpers =====
function showLoading() {
  document.getElementById('loading-text').textContent = '🎬 AI 正在生成电影级画面...';
  document.getElementById('loading-overlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}
function showError(msg) {
  const el = document.getElementById('story-text');
  el.innerHTML = `<span style="color:#ff6b6b">⚠️ ${escHtml(msg)}</span>`;
  const c = document.getElementById('choices');
  c.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = '🔄 重试';
  btn.onclick = () => requestScene('继续故事');
  c.appendChild(btn);
  state.isTyping = false;
}
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
