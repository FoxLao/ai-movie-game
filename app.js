// ===== 华夏锋彩 1.8 - AI互动影游 =====

const API_URL = '/api/story';

const STYLES = {
  '2d-anime': {
    label: '2D动漫',
    prompt: '2d anime illustration, cel shading, vibrant colors, detailed background, studio ghibli inspired, cinematic composition, masterpiece, beautiful detailed face, symmetrical eyes, correct facial features, clean lineart, single character portrait'
    model: 'flux',
    particles: {
      '科幻':{colors:['#00d4ff','#6c5ce7','#a855f7'],size:3,speed:2,count:20},
      '悬疑':{colors:['#ff6b6b','#ffa502','#ddd'],size:2,speed:1,count:10},
      '古风':{colors:['#ffa502','#ff6348','#ff9ff3'],size:4,speed:1.2,count:15},
      '恋爱':{colors:['#ff6b9d','#c44569','#f8a5c2'],size:5,speed:1,count:18},
      '恐怖':{colors:['#2ed573','#a4b0be','#747d8c'],size:2,speed:0.6,count:8},
      '自由':{colors:['#6c5ce7','#a855f7','#00d4ff'],size:3,speed:1.5,count:16},
    },
  },
  'realistic': {
    label: 'AI真人',
    prompt: 'photorealistic, cinematic still frame, single person portrait, perfect symmetrical face, clear detailed eyes, natural facial features, professional photography, dramatic lighting, shallow depth of field, film grain, anamorphic lens flare, 35mm, color grading, 8k, masterpiece, best quality, sharp focus on face, correct facial anatomy, normal hands, natural skin texture',
    model: 'flux-realism',
    particles: {
      '科幻':{colors:['#00a8ff','#0066ff','#88ccff'],size:2,speed:1,count:12},
      '悬疑':{colors:['#ff4444','#ff8800','#ffcc00'],size:1,speed:0.5,count:6},
      '古风':{colors:['#ffcc44','#ff8844','#ffaa66'],size:3,speed:0.8,count:10},
      '恋爱':{colors:['#ff88aa','#ffaacc','#ff66aa'],size:2,speed:0.8,count:12},
      '恐怖':{colors:['#44ff66','#888888','#66aa66'],size:1,speed:0.3,count:5},
      '自由':{colors:['#8888ff','#aa88ff','#88aaff'],size:2,speed:1,count:10},
    },
  },
};

const KB = ['kb-zoom-in','kb-zoom-out','kb-pan-left','kb-pan-right','kb-pan-up','kb-rotate','kb-dramatic','kb-slow-zoom'];

// ===== State =====
let state = {
  genre:'', theme:'', chapter:1, choiceCount:0, history:[],
  sceneCount:0, isTyping:false, imageUrl:null, visualStyle:'2d-anime',
  imageLoading:false, abortTyping:false, activeLayer:0,
};

let selectedGenre = null;
let genreDesc = '';

// ===== Init =====
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.visualStyle = btn.dataset.style;
  });
});

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

document.getElementById('restart-btn').addEventListener('click', () => {
  state.abortTyping = true;
  if (confirm('确定重新开始？')) resetGame();
});
document.getElementById('replay-btn').addEventListener('click', resetGame);

// ===== Game =====
function startGame() {
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  document.getElementById('scanlines').classList.toggle('hidden', state.visualStyle !== 'realistic');
  updateStatus();

  const sc = STYLES[state.visualStyle];
  const sys = `你是"华夏锋彩"互动影游引擎，创作${sc.label}风格的电影级故事。

【类型】${state.genre}
【主题】${state.theme}
【画面风格】${sc.label}

【核心规则】
1. 第二人称"你"叙述，电影镜头般描写
2. 每次回复：场景描写（200-300字）+ 2-3个选项
3. 选项用 [A] [B] [C] 标注
4. 每3-4个选择设一个关键转折
5. 根据所有历史选择影响剧情
6. 场景要有画面感：环境、声音、光影、氛围
7. 开头用 【场景名】标注
8. 场景名后用 【画面】用英文描述画面（适合${sc.label}风格渲染）

【输出格式】
【场景名】标题
【画面】英文描述，${state.visualStyle === 'realistic' ? 'IMPORTANT: describe ONLY ONE person in frame, medium shot or wide shot, avoid close-up of multiple faces. single person, correct face, natural expression' : 'IMPORTANT: focus on ONE main character in frame, medium shot preferred, avoid multiple faces close-up. 2D anime style illustration, colorful, dynamic composition, beautiful detailed face'}

场景描写...

[A] 选项一
[B] 选项二
[C] 选项三

【结局】第8-12个选择后，用【结局：好/普通/坏】标注，【THE END】结束。`;

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
    state.abortTyping = false;

    hideLoading();

    const imgP = extractPrompt(text);
    if (imgP) generateImage(imgP);

    const isEnd = text.includes('【THE END】') || /【结局[：:]/.test(text);
    await showScene(text, isEnd);
  } catch (err) {
    hideLoading();
    state.history.pop();
    showError(err.message);
  }
}

// ===== Image =====
function extractPrompt(text) {
  const m = text.match(/【画面】(.+)/);
  const styleP = STYLES[state.visualStyle].prompt;
  let extra = ', 1girl or 1boy, solo, beautiful detailed face, symmetrical eyes, correct anatomy';
  if (state.visualStyle === 'realistic') {
    extra = ', one person only, medium shot, symmetrical face, looking at camera, centered composition';
  }
  if (m) return `${m[1].trim()}, ${styleP}${extra}`;
  const s = text.match(/【场景名】(.+)/);
  if (s) return `${s[1].trim()}, ${state.genre} theme, ${styleP}${extra}`;
  return null;
}

function generateImage(prompt) {
  const styleCfg = STYLES[state.visualStyle];
  const model = styleCfg.model;
  const seed = Date.now();
  const isMobile = window.innerWidth < 768;
  // 动漫：竖屏场景 576x832（快）；真人：横屏 768x432
  let w, h;
  if (state.visualStyle === '2d-anime') {
    w = isMobile ? 512 : 768;
    h = isMobile ? 768 : 1024;
  } else {
    w = isMobile ? 640 : 768;
    h = isMobile ? 854 : 432;
  }

  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=${model}`;

  const proxyUrl = `/api/image?url=${encodeURIComponent(pollinationsUrl)}`;
  state.imageUrl = proxyUrl;
  state.imageLoading = true;

  const layers = [
    document.getElementById('img-layer-0'),
    document.getElementById('img-layer-1'),
  ];
  const nextLayer = state.activeLayer === 0 ? 1 : 0;

  const img = new Image();
  img.onload = () => {
    const el = layers[nextLayer];
    KB.forEach(c => el.classList.remove(c));
    el.style.backgroundImage = `url(${proxyUrl})`;
    // 先设好 KB 动画（包含 background-size），然后淡入
    requestAnimationFrame(() => {
      el.classList.add(KB[Math.floor(Math.random() * KB.length)]);
      layers[state.activeLayer].style.opacity = '0';
      el.style.opacity = '1';
      state.activeLayer = nextLayer;
      state.imageLoading = false;
    });
  };
  img.onerror = () => {
    console.warn('Image load failed, using gradient fallback');
    // 加载失败：在当前活跃层显示场景氛围渐变
    const el = layers[state.activeLayer];
    const genreColors = {
      '科幻': 'linear-gradient(135deg,#0a0a2e,#1a0a4e,#0a1a3e)',
      '悬疑': 'linear-gradient(135deg,#1a0a0a,#2e0a1a,#0a0a1a)',
      '古风': 'linear-gradient(135deg,#1a1000,#2e1a0a,#1a0a0a)',
      '恋爱': 'linear-gradient(135deg,#1a0a1e,#2e0a2e,#1a0a1a)',
      '恐怖': 'linear-gradient(135deg,#0a1a0a,#0a0a0a,#0a1a0a)',
      '自由': 'linear-gradient(135deg,#0a0a2e,#1a0a3e,#0a1a2e)',
    };
    el.style.backgroundImage = genreColors[state.genre] || genreColors['自由'];
    KB.forEach(c => el.classList.remove(c));
    state.imageLoading = false;
  };
  img.src = proxyUrl;
}

// ===== Particles =====
function spawnParticles() {
  const box = document.getElementById('particles');
  box.innerHTML = '';
  const cfgs = STYLES[state.visualStyle].particles;
  const cfg = cfgs[state.genre] || cfgs['自由'];
  for (let i = 0; i < cfg.count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const op = 0.15 + Math.random() * 0.45;
    p.style.cssText = `left:${Math.random()*100}%;top:${15+Math.random()*85}%;width:${cfg.size}px;height:${cfg.size}px;background:${cfg.colors[i%cfg.colors.length]};animation-duration:${(3+Math.random()*6)/cfg.speed}s;animation-delay:${Math.random()*4}s;--p-opacity:${op};`;
    box.appendChild(p);
  }
}

// ===== Scene =====
async function showScene(text, isEnd) {
  state.isTyping = true;
  state.abortTyping = false;

  const sceneName = (text.match(/【场景名】(.+)/) || [,''])[1].trim() || `场景 ${state.sceneCount}`;
  const { narrative, choices } = parse(text);

  document.getElementById('scene-badge').textContent = sceneName;
  document.getElementById('scene-title').textContent = `第${state.chapter}章 · ${sceneName}`;

  const storyEl = document.getElementById('story-text');
  const choicesEl = document.getElementById('choices');
  storyEl.innerHTML = '';
  choicesEl.innerHTML = '';
  storyEl.scrollTop = 0;

  spawnParticles();

  // Typewriter — batch innerHTML updates for performance
  const LEN = narrative.length;
  let lastHtml = '';
  for (let i = 0; i < LEN; i++) {
    if (state.abortTyping) break;

    const newHtml = esc(narrative.substring(0, i + 1));
    if (i === LEN - 1 || i % 3 === 0) {
      storyEl.innerHTML = newHtml + (i < LEN - 1 ? '<span class="cursor"></span>' : '');
      lastHtml = newHtml;
      storyEl.scrollTop = storyEl.scrollHeight;
    }

    const ch = narrative[i];
    if ('。！？…'.includes(ch)) await sleep(120);
    else if ('，、；：\n'.includes(ch)) await sleep(50);
    else await sleep(18);
  }

  if (!state.abortTyping) {
    storyEl.innerHTML = esc(narrative);
  }

  if (isEnd && !state.abortTyping) { showEnding(narrative, text); return; }

  if (!state.abortTyping) {
    for (let i = 0; i < choices.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<b>${choices[i].key}.</b> ${esc(choices[i].text)}`;
      btn.style.cssText = 'opacity:0;transform:translateY(8px);';
      btn.addEventListener('click', () => choose(choices[i]));
      choicesEl.appendChild(btn);
      await sleep(80);
      btn.style.transition = 'all 0.3s cubic-bezier(0.4,0,0.2,1)';
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
    }
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
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { narrative, choices };
}

function choose(c) {
  state.choiceCount++;
  state.chapter = Math.floor(state.choiceCount / 3) + 1;
  state.isTyping = false;
  state.abortTyping = true;
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
  let type = '普通结局', color = '#ffa502';
  if (/好/.test(fullText)) { type = '✨ 好结局'; color = '#2ed573'; }
  else if (/坏/.test(fullText)) { type = '💀 坏结局'; color = '#ff6b6b'; }

  if (state.imageUrl) {
    document.getElementById('ending-bg').style.backgroundImage = `url(${state.imageUrl})`;
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
function resetGame() {
  state = {
    genre:'', theme:'', chapter:1, choiceCount:0, history:[],
    sceneCount:0, isTyping:false, imageUrl:null, visualStyle:state.visualStyle,
    imageLoading:false, abortTyping:false, activeLayer:0,
  };

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('start-screen').classList.add('active');
  document.getElementById('custom-theme').classList.add('hidden');
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('start-btn').disabled = true;
  document.getElementById('theme-input').value = '';

  // Reset image layers — layer 0 active, layer 1 hidden
  const l0 = document.getElementById('img-layer-0');
  const l1 = document.getElementById('img-layer-1');
  KB.forEach(c => { l0.classList.remove(c); l1.classList.remove(c); });
  l0.style.backgroundImage = '';
  l1.style.backgroundImage = '';
  l0.style.opacity = '1';
  l1.style.opacity = '0';
  document.getElementById('particles').innerHTML = '';
  document.getElementById('scanlines').classList.add('hidden');
}

// ===== Share =====
function shareResult() {
  const t = `🎬 我在华夏锋彩1.8中做出${state.choiceCount}次选择，经历了${state.sceneCount}个场景！`;
  if (navigator.share) {
    navigator.share({ title: '华夏锋彩1.8', text: t, url: location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(t + ' ' + location.href).then(() => alert('已复制！')).catch(() => {});
  }
}

// ===== Helpers =====
function showLoading() {
  const label = STYLES[state.visualStyle].label;
  document.getElementById('loading-text').textContent = `🎬 ${label}画面生成中...`;
  document.getElementById('loading-overlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}
function showError(msg) {
  document.getElementById('story-text').innerHTML = `<span style="color:#ff6b6b">⚠️ ${esc(msg)}</span>`;
  const c = document.getElementById('choices');
  c.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = '🔄 重试';
  btn.onclick = () => { state.isTyping = false; requestScene('继续故事'); };
  c.appendChild(btn);
  state.isTyping = false;
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
