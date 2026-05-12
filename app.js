// ===== 华夏锋彩 1.1 - AI互动影游 =====

const API_URL = '/api/story';

// 画面风格配置
const STYLES = {
  '3d-anime': {
    label: '3D动漫',
    prompt: '3D anime style, cel shading, Studio Ghibli, Pixar quality, volumetric lighting, cinematic composition, rich colors, ultra detailed, 8k render',
    particles: { '科幻':{colors:['#00d4ff','#6c5ce7','#a855f7'],size:3,speed:2,count:25}, '悬疑':{colors:['#ff6b6b','#ffa502','#ddd'],size:2,speed:1,count:12}, '古风':{colors:['#ffa502','#ff6348','#ff9ff3'],size:4,speed:1.2,count:18}, '恋爱':{colors:['#ff6b9d','#c44569','#f8a5c2'],size:5,speed:1,count:22}, '历史':{colors:['#d4a574','#8b7355','#c9a96e'],size:3,speed:1.2,count:16}, '自由':{colors:['#6c5ce7','#a855f7','#00d4ff'],size:3,speed:1.5,count:20} },
  },
  'realistic': {
    label: 'AI真人',
    prompt: 'photorealistic, cinematic still frame, professional photography, dramatic lighting, shallow depth of field, film grain, anamorphic lens flare, 35mm, color grading, ultra realistic, 8k, highly detailed face and skin texture',
    particles: { '科幻':{colors:['#00a8ff','#0066ff','#88ccff'],size:2,speed:1,count:15}, '悬疑':{colors:['#ff4444','#ff8800','#ffcc00'],size:1,speed:0.5,count:8}, '古风':{colors:['#ffcc44','#ff8844','#ffaa66'],size:3,speed:0.8,count:12}, '恋爱':{colors:['#ff88aa','#ffaacc','#ff66aa'],size:2,speed:0.8,count:15}, '历史':{colors:['#d4a574','#8b7355','#c9a96e'],size:2,speed:0.8,count:10}, '自由':{colors:['#8888ff','#aa88ff','#88aaff'],size:2,speed:1,count:12} },
  },
};

const KB = ['kb-zoom-in','kb-zoom-out','kb-pan-left','kb-pan-right','kb-pan-up','kb-rotate','kb-dramatic','kb-slow-zoom'];

// ===== BGM系统 - 使用 Web Audio API 生成氛围音乐 =====
const BGM = {
  ctx: null,
  gain: null,
  playing: false,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.15;
    this.gain.connect(this.ctx.destination);
  },

  play(genre) {
    if (!this.ctx) this.init();
    this.stop();
    this.playing = true;

    const scales = {
      '科幻': [261.63, 329.63, 392.00, 523.25, 659.25],
      '悬疑': [246.94, 293.66, 349.23, 415.30, 493.88],
      '古风': [293.66, 349.23, 440.00, 523.25, 587.33],
      '恋爱': [329.63, 392.00, 440.00, 523.25, 659.25],
      '历史': [220.00, 261.63, 329.63, 392.00, 440.00],
      '自由': [261.63, 329.63, 392.00, 493.88, 587.33],
    };

    const notes = scales[genre] || scales['自由'];
    const tempo = genre === '悬疑' ? 0.8 : genre === '恋爱' ? 0.4 : 0.5;

    this._loop(notes, tempo);
  },

  _loop(notes, tempo) {
    if (!this.playing) return;
    const note = notes[Math.floor(Math.random() * notes.length)];
    const dur = 1.5 + Math.random() * 2;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = note;
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.3);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.gain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur + 0.1);

    // 叠加一个低八度
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = note / 2;
    g2.gain.setValueAtTime(0, this.ctx.currentTime);
    g2.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.5);
    g2.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur * 1.2);
    osc2.connect(g2);
    g2.connect(this.gain);
    osc2.start();
    osc2.stop(this.ctx.currentTime + dur * 1.2 + 0.1);

    this._timer = setTimeout(() => this._loop(notes, tempo), (dur + 0.5 + Math.random()) * 1000 * tempo);
  },

  stop() {
    this.playing = false;
    clearTimeout(this._timer);
  },

  setVolume(v) {
    if (this.gain) this.gain.gain.value = Math.max(0, Math.min(1, v));
  }
};

// ===== SFX - 音效系统 =====
const SFX = {
  ctx: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  play(type) {
    if (!this.ctx) this.init();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    switch(type) {
      case 'choice': // 选择确认
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(659, this.ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.15, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
        break;
      case 'scene': // 场景切换
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(523, this.ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.4);
        break;
      case 'ending-good': // 好结局
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const gg = this.ctx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          gg.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.15);
          gg.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.15 + 0.4);
          o.connect(gg); gg.connect(this.ctx.destination);
          o.start(this.ctx.currentTime + i * 0.15);
          o.stop(this.ctx.currentTime + i * 0.15 + 0.4);
        });
        break;
      case 'ending-bad': // 坏结局
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.8);
        g.gain.setValueAtTime(0.08, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 1);
        break;
      case 'typing': // 打字音效（轻微点击）
        osc.type = 'sine';
        osc.frequency.value = 800 + Math.random() * 200;
        g.gain.setValueAtTime(0.03, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.05);
        break;
    }
  }
};

// ===== State =====
let state = {
  genre:'', theme:'', chapter:1, choiceCount:0, history:[],
  sceneCount:0, isTyping:false, imageUrl:null, visualStyle:'3d-anime',
  imageLoading:false, abortTyping:false, muted:false,
};

// ===== Init =====
let selectedGenre = null;
let genreDesc = '';

// 画面风格选择
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.visualStyle = btn.dataset.style;
  });
});

// 题材选择
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

// 音量控制
document.getElementById('volume-btn').addEventListener('click', () => {
  state.muted = !state.muted;
  const btn = document.getElementById('volume-btn');
  if (state.muted) {
    btn.textContent = '🔇';
    BGM.setVolume(0);
  } else {
    btn.textContent = '🔊';
    BGM.setVolume(0.15);
  }
});

// ===== Game =====
function startGame() {
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  
  // 真人模式：显示扫描线
  document.getElementById('scanlines').classList.toggle('hidden', state.visualStyle !== 'realistic');
  
  updateStatus();
  
  // 播放背景音乐
  BGM.play(state.genre);
  
  const styleConfig = STYLES[state.visualStyle];
  const sys = `你是"华夏锋彩"互动影游引擎，创作${styleConfig.label}风格的电影级故事。

【类型】${state.genre}
【主题】${state.theme}
【画面风格】${styleConfig.label}

【核心规则】
1. 第二人称"你"叙述，电影镜头般描写
2. 每次回复：场景描写（200-300字）+ 2-3个选项
3. 选项用 [A] [B] [C] 标注
4. 每3-4个选择设一个关键转折
5. 根据所有历史选择影响剧情
6. 场景要有画面感：环境、声音、光影、氛围
7. 开头用 【场景名】标注
8. 场景名后用 【画面】用英文描述画面（适合${styleConfig.label}风格渲染）

【输出格式】
【场景名】标题
【画面】英文描述，${state.visualStyle === 'realistic' ? '真实人物、电影布光、摄影机角度、景深效果、肤色质感' : '3D动漫角色、赛璐珞渲染、夸张表情、梦幻光影'}

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
    
    // 异步生成图片
    const imgP = extractPrompt(text);
    if (imgP) generateImage(imgP);
    
    const isEnd = text.includes('【THE END】') || /【结局[：:]/.test(text);
    await showScene(text, isEnd);
    
  } catch (err) {
    hideLoading();
    state.history.pop(); // pop 掉失败的 user message
    showError(err.message);
  }
}

// ===== Image =====
function extractPrompt(text) {
  const m = text.match(/【画面】(.+)/);
  const styleP = STYLES[state.visualStyle].prompt;
  if (m) return `${m[1].trim()}, ${styleP}`;
  const s = text.match(/【场景名】(.+)/);
  if (s) return `${s[1].trim()}, ${state.genre} theme, ${styleP}`;
  return null;
}

function generateImage(prompt) {
  const seed = Date.now();
  const isMobile = window.innerWidth < 768;
  const w = isMobile ? 768 : 1344;
  const h = isMobile ? 1024 : 768;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;
  state.imageUrl = url;
  state.imageLoading = true;
  
  const el = document.getElementById('scene-image');
  KB.forEach(c => el.classList.remove(c));
  el.style.opacity = '0.2';
  
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url(${url})`;
    el.classList.add(KB[Math.floor(Math.random() * KB.length)]);
    el.style.opacity = '1';
    state.imageLoading = false;
  };
  img.onerror = () => {
    el.style.opacity = '1';
    state.imageLoading = false;
  };
  img.src = url;
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
  
  // 场景切换音效
  SFX.play('scene');
  
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
  
  // 打字机音效计数器
  let typeCount = 0;
  
  // Typewriter
  for (let i = 0; i < narrative.length; i++) {
    if (state.abortTyping) break;
    
    storyEl.innerHTML = esc(narrative.substring(0, i + 1)) + '<span class="cursor"></span>';
    storyEl.scrollTop = storyEl.scrollHeight;
    
    // 每隔3-5个字符播放一次打字音效
    typeCount++;
    if (typeCount >= 3 + Math.floor(Math.random() * 3)) {
      SFX.play('typing');
      typeCount = 0;
    }
    
    const ch = narrative[i];
    if ('。！？…'.includes(ch)) await sleep(150);
    else if ('，、；：\n'.includes(ch)) await sleep(60);
    else await sleep(20);
  }
  
  if (!state.abortTyping) {
    storyEl.innerHTML = esc(narrative);
  }
  
  if (isEnd && !state.abortTyping) { showEnding(narrative, text); return; }
  
  // Choices
  if (!state.abortTyping) {
    for (let i = 0; i < choices.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<b>${choices[i].key}.</b> ${esc(choices[i].text)}`;
      btn.style.cssText = 'opacity:0;transform:translateY(8px);';
      btn.addEventListener('click', () => choose(choices[i]));
      choicesEl.appendChild(btn);
      await sleep(100);
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
  if (state.isTyping) return; // 快速点击保护
  state.choiceCount++;
  state.chapter = Math.floor(state.choiceCount / 3) + 1;
  state.isTyping = false;
  state.abortTyping = true;
  
  // 选择确认音效
  SFX.play('choice');
  
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
  
  let type = '普通结局', color = '#ffa502', sfxType = 'ending-good';
  if (/好/.test(fullText)) { type = '✨ 好结局'; color = '#2ed573'; sfxType = 'ending-good'; }
  else if (/坏/.test(fullText)) { type = '💀 坏结局'; color = '#ff6b6b'; sfxType = 'ending-bad'; }
  
  // 播放结局音效
  SFX.play(sfxType);
  
  // 停止背景音乐
  BGM.stop();
  
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
  state.abortTyping = true;
  
  // 停止背景音乐
  BGM.stop();
  
  setTimeout(() => {
    state = { genre:'',theme:'',chapter:1,choiceCount:0,history:[],sceneCount:0,isTyping:false,imageUrl:null,visualStyle:state.visualStyle,imageLoading:false,abortTyping:false,muted:state.muted };
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('start-screen').classList.add('active');
    document.getElementById('custom-theme').classList.add('hidden');
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('start-btn').disabled = true;
    document.getElementById('theme-input').value = '';
    
    const si = document.getElementById('scene-image');
    KB.forEach(c => si.classList.remove(c));
    si.style.backgroundImage = '';
    si.style.opacity = '1';
    document.getElementById('particles').innerHTML = '';
    document.getElementById('scanlines').classList.add('hidden');
  }, 50);
}

// ===== Share =====
function shareResult() {
  const t = `🎬 我在华夏锋彩1.0中做出${state.choiceCount}次选择，经历了${state.sceneCount}个场景！`;
  if (navigator.share) {
    navigator.share({ title: '华夏锋彩1.0', text: t, url: location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(t + ' ' + location.href).then(() => alert('已复制！')).catch(() => {});
  }
}

// ===== Helpers =====
function showLoading() {
  const styleName = STYLES[state.visualStyle].label;
  document.getElementById('loading-text').textContent = `🎬 ${styleName}画面生成中...`;
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
  btn.onclick = () => { state.isTyping = false; state.history.pop(); requestScene('继续故事'); };
  c.appendChild(btn);
  state.isTyping = false;
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
