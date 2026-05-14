// ===== 华夏锋彩 1.8 - AI互动影游 =====

const API_URL = '/api/story';

// 画面风格配置
const STYLES = {
  '2d-anime': {
    label: '2D动漫',
    prompt: '2D anime style, hand-drawn animation, flat colors, clean line art, traditional anime aesthetic, cel shading, vibrant colors, detailed 2D illustration, manga style, dynamic composition, well proportioned face, moderate anime eyes not oversized, clear defined facial features, 8k quality',
    particles: { '科幻':{colors:['#00d4ff','#6c5ce7','#a855f7'],size:3,speed:2,count:25}, '悬疑':{colors:['#ff6b6b','#ffa502','#ddd'],size:2,speed:1,count:12}, '古风':{colors:['#ffa502','#ff6348','#ff9ff3'],size:4,speed:1.2,count:18}, '恋爱':{colors:['#ff6b9d','#c44569','#f8a5c2'],size:5,speed:1,count:22}, '历史':{colors:['#d4a574','#8b7355','#c9a96e'],size:3,speed:1.2,count:16}, '自由':{colors:['#6c5ce7','#a855f7','#00d4ff'],size:3,speed:1.5,count:20} },
  },
  'realistic': {
    label: 'AI真人',
    prompt: 'photorealistic, cinematic still frame, professional photography, dramatic lighting, shallow depth of field, film grain, anamorphic lens flare, 35mm, color grading, ultra realistic, 8k, detailed facial features, sharp face focus, natural proportions, correct anatomy',
    particles: { '科幻':{colors:['#00a8ff','#0066ff','#88ccff'],size:2,speed:1,count:15}, '悬疑':{colors:['#ff4444','#ff8800','#ffcc00'],size:1,speed:0.5,count:8}, '古风':{colors:['#ffcc44','#ff8844','#ffaa66'],size:3,speed:0.8,count:12}, '恋爱':{colors:['#ff88aa','#ffaacc','#ff66aa'],size:2,speed:0.8,count:15}, '历史':{colors:['#d4a574','#8b7355','#c9a96e'],size:2,speed:0.8,count:10}, '自由':{colors:['#8888ff','#aa88ff','#88aaff'],size:2,speed:1,count:12} },
  },
};

const KB = ['kb-zoom-in','kb-zoom-out','kb-pan-left','kb-pan-right','kb-pan-up','kb-rotate','kb-dramatic','kb-slow-zoom'];

// ===== 国际化系统 =====
const I18N = {
  zh: {
    title: '华夏锋彩',
    subtitle: 'AI 互动影游 · INTERACTIVE CINEMA',
    version: '1.8',
    visualStyle: '画面风格',
    selectGenre: '选择题材',
    animeStyle: '2D动漫',
    animeDesc: '手绘/日漫风',
    realisticStyle: 'AI真人',
    realisticDesc: '电影级写实',
    startBtn: '开始冒险',
    hint: '选择题材后开始',
    customPlaceholder: '输入你想要的主题...',
    chapter: '第{n}章',
    scene: '场景',
    choices: '次选择',
    scenes: '个场景',
    loading: '画面生成中...',
    storyEnd: '故事结束',
    replay: '🔄 再来一次',
    share: '📤 分享',
    shareText: '🎬 我在华夏锋彩1.8中做出{choices}次选择，经历了{scenes}个场景！',
    confirmRestart: '确定重新开始？',
    genres: {
      '科幻': { emoji: '🚀', name: '科幻', desc: '星际航行、AI觉醒、末日求生' },
      '悬疑': { emoji: '🔍', name: '悬疑', desc: '密室逃脱、案件调查、心理惊悚' },
      '古风': { emoji: '⚔️', name: '古风', desc: '江湖恩怨、宫廷权谋、修仙问道' },
      '恋爱': { emoji: '💕', name: '恋爱', desc: '校园邂逅、都市情缘、前世今生' },
      '历史': { emoji: '🏛️', name: '历史', desc: '王朝兴衰、英雄传奇、战争史诗' },
      '自由': { emoji: '✨', name: '自定义', desc: '' },
    },
    endingGood: '✨ 好结局',
    endingNormal: '普通结局',
    endingBad: '💀 坏结局',
  },
  en: {
    title: 'HuaXia Cinema',
    subtitle: 'AI Interactive Movie · INTERACTIVE CINEMA',
    version: '1.8',
    visualStyle: 'Visual Style',
    selectGenre: 'Select Genre',
    animeStyle: '2D Anime',
    animeDesc: 'Hand-drawn',
    realisticStyle: 'Realistic',
    realisticDesc: 'Cinematic',
    startBtn: 'Start Adventure',
    hint: 'Select a genre to begin',
    customPlaceholder: 'Enter your theme...',
    chapter: 'Ch.{n}',
    scene: 'Scene',
    choices: 'choices',
    scenes: 'scenes',
    loading: 'Generating visuals...',
    storyEnd: 'The End',
    replay: '🔄 Play Again',
    share: '📤 Share',
    shareText: '🎬 I made {choices} choices across {scenes} scenes in HuaXia Cinema 1.8!',
    confirmRestart: 'Start over?',
    genres: {
      'scifi': { emoji: '🚀', name: 'Sci-Fi', desc: 'Space, AI Awakening, Survival' },
      'mystery': { emoji: '🔍', name: 'Mystery', desc: 'Escape Room, Investigation, Thriller' },
      'wuxia': { emoji: '⚔️', name: 'Wuxia', desc: 'Martial Arts, Palace Intrigue, Cultivation' },
      'romance': { emoji: '💕', name: 'Romance', desc: 'Campus, Urban, Past Lives' },
      'history': { emoji: '🏛️', name: 'History', desc: 'Dynasties, Heroes, Epic Wars' },
      'custom': { emoji: '✨', name: 'Custom', desc: '' },
    },
    endingGood: '✨ Good Ending',
    endingNormal: 'Normal Ending',
    endingBad: '💀 Bad Ending',
  }
};

let currentLang = 'zh';
let LANG = I18N.zh;

// 英文 genre key 到中文的映射（BGM/particles 用中文 key）
const EN_ZH_GENRE_MAP = {
  'scifi': '科幻', 'mystery': '悬疑', 'wuxia': '古风',
  'romance': '恋爱', 'history': '历史', 'custom': '自由'
};

function getInternalGenre() {
  return EN_ZH_GENRE_MAP[state.genre] || state.genre;
}

function setLanguage(lang) {
  currentLang = lang;
  LANG = I18N[lang];

  // 更新启动页所有文本
  document.querySelector('.title-main').textContent = LANG.title;
  document.querySelector('.title-ver').textContent = LANG.version;
  document.querySelector('.title-sub').textContent = LANG.subtitle;

  // 画面风格
  document.querySelectorAll('.style-btn')[0].querySelector('.style-name').textContent = LANG.animeStyle;
  document.querySelectorAll('.style-btn')[0].querySelector('.style-desc').textContent = LANG.animeDesc;
  document.querySelectorAll('.style-btn')[1].querySelector('.style-name').textContent = LANG.realisticStyle;
  document.querySelectorAll('.style-btn')[1].querySelector('.style-desc').textContent = LANG.realisticDesc;

  // 题材按钮
  const genreKeys = Object.keys(LANG.genres);
  document.querySelectorAll('.genre-btn').forEach((btn, i) => {
    if (i >= genreKeys.length) return;
    const key = genreKeys[i];
    const g = LANG.genres[key];
    btn.innerHTML = `${g.emoji}<span>${g.name}</span>`;
    btn.dataset.genre = key;
    btn.dataset.desc = g.desc;
  });

  document.getElementById('start-btn').textContent = LANG.startBtn;
  document.querySelector('.hint').textContent = LANG.hint;
  document.getElementById('theme-input').placeholder = LANG.customPlaceholder;

  const sectionLabels = document.querySelectorAll('.section-label');
  if (sectionLabels[0]) sectionLabels[0].textContent = LANG.visualStyle;
  if (sectionLabels[1]) sectionLabels[1].textContent = LANG.selectGenre;

  // 重新映射已选 genre
  if (selectedGenre) {
    const newKeys = Object.keys(LANG.genres);
    // 尝试映射
    if (lang === 'en') {
      const mapped = EN_ZH_GENRE_MAP[selectedGenre] ? selectedGenre : Object.keys(EN_ZH_GENRE_MAP).find(k => EN_ZH_GENRE_MAP[k] === selectedGenre) || selectedGenre;
      selectedGenre = mapped;
    } else {
      selectedGenre = EN_ZH_GENRE_MAP[selectedGenre] || selectedGenre;
    }
    document.getElementById('start-btn').disabled = false;
    // 更新自定义区域
    const isCustom = (lang === 'zh' && selectedGenre === '自由') || (lang === 'en' && selectedGenre === 'custom');
    document.getElementById('custom-theme').classList.toggle('hidden', !isCustom);
  }

  // 更新字体大小标签
  updateFontSize();
}

// ===== 场景动画系统（替代视频） =====
const SceneAnim = {
  canvas: null, ctx: null, running: false, animId: null,
  particles: [],
  config: {},

  init() {
    this.canvas = document.getElementById('scene-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.offsetWidth;
    this.canvas.height = parent.offsetHeight;
  },

  start(genre) {
    if (!this.canvas) this.init();
    if (!this.ctx) return;
    this.stop();
    this.running = true;

    // 根据题材设置不同粒子效果
    const configs = {
      '科幻': { colors: ['#00d4ff','#6c5ce7','#a855f7','#00ff88'], count: 40, speed: 1.5, type: 'float', trail: true },
      '悬疑': { colors: ['#ff6b6b','#ffa502','#ff4444','#ffcc00'], count: 20, speed: 0.6, type: 'rain', trail: false },
      '古风': { colors: ['#ffa502','#ff6348','#ff9ff3','#ffeaa7'], count: 30, speed: 0.8, type: 'petal', trail: false },
      '恋爱': { colors: ['#ff6b9d','#c44569','#f8a5c2','#ff9ff3'], count: 35, speed: 0.7, type: 'heart', trail: false },
      '历史': { colors: ['#d4a574','#8b7355','#c9a96e','#e8d5b7'], count: 25, speed: 0.5, type: 'ember', trail: true },
    };
    // 英文 genre 映射
    const enMap = {'scifi':'科幻','mystery':'悬疑','wuxia':'古风','romance':'恋爱','history':'历史','custom':'自由'};
    const zhGenre = enMap[genre] || genre;
    this.config = configs[zhGenre] || configs['古风'] || { colors: ['#6c5ce7'], count: 20, speed: 1, type: 'float', trail: false };

    // 创建粒子
    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed - 0.3,
        size: 1 + Math.random() * 3,
        color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
        alpha: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.canvas.style.opacity = '1';
    this._animate();
  },

  // Bug 1 修复：根据场景描述动态调整粒子
  updateForScene(sceneText) {
    if (!this.canvas || !this.ctx) return;

    // 分析场景关键词来调整粒子
    const keywords = {
      fire: ['火','燃烧','焰','flame','fire','burn'],
      water: ['水','雨','海','河','湖','波','water','rain','sea','ocean'],
      snow: ['雪','冰','寒','冷','snow','ice','cold','frost'],
      night: ['夜','暗','黑','night','dark','shadow'],
      wind: ['风','狂','暴','wind','storm'],
      blood: ['血','红','杀','battle','fight','war'],
      light: ['光','亮','阳','金','light','bright','sun','golden'],
      forest: ['林','树','森','forest','tree','wood'],
    };

    let detected = 'default';
    const lower = (sceneText || '').toLowerCase();
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(w => lower.includes(w))) { detected = type; break; }
    }

    // 根据检测结果更新粒子属性
    const sceneConfigs = {
      fire: { colors: ['#ff4500','#ff6347','#ff8c00','#ffd700'], speed: 1.2, type: 'ember', trail: true },
      water: { colors: ['#00bfff','#1e90ff','#87ceeb','#4169e1'], speed: 0.8, type: 'rain', trail: false },
      snow: { colors: ['#fff','#e0e0e0','#b0c4de','#87ceeb'], speed: 0.4, type: 'snow', trail: false },
      night: { colors: ['#6c5ce7','#a855f7','#4834d4','#30336b'], speed: 0.6, type: 'float', trail: true },
      wind: { colors: ['#a0a0a0','#c0c0c0','#d0d0d0','#b0b0b0'], speed: 2.5, type: 'float', trail: true },
      blood: { colors: ['#8b0000','#dc143c','#ff0000','#b22222'], speed: 0.8, type: 'rain', trail: false },
      light: { colors: ['#ffd700','#ffed4a','#f9ca24','#fff'], speed: 0.5, type: 'float', trail: true },
      forest: { colors: ['#228b22','#32cd32','#006400','#90ee90'], speed: 0.3, type: 'petal', trail: false },
      default: null, // 保持原有题材配置
    };

    const newConfig = sceneConfigs[detected];
    if (!newConfig) return; // 没检测到就保持原样

    // 渐变更新粒子颜色
    this.particles.forEach(p => {
      p.color = newConfig.colors[Math.floor(Math.random() * newConfig.colors.length)];
      p.vx = (Math.random() - 0.5) * newConfig.speed;
      p.vy = (Math.random() - 0.5) * newConfig.speed - 0.3;
    });
    this.config = { ...this.config, ...newConfig };
  },

  // Bug 2 修复：重启动画
  restart(genre, sceneText) {
    this.stop();
    this.start(genre);
    if (sceneText) this.updateForScene(sceneText);
  },

  _animate() {
    if (!this.running) return;
    const { ctx, canvas, particles, config } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      // 移动
      p.x += p.vx + Math.sin(p.phase + Date.now() * 0.001) * 0.3;
      p.y += p.vy;
      p.phase += 0.01;

      // 边界循环
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.save();
      ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(Date.now() * 0.002 + p.phase));

      if (config.type === 'petal') {
        // 花瓣效果
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase + Date.now() * 0.001);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.type === 'rain') {
        // 雨滴效果
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 1, p.size * 4);
        p.vy = 2 + Math.random();
      } else if (config.type === 'snow') {
        // 雪花效果
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        p.vy = 0.3 + Math.random() * 0.3;
        p.vx = Math.sin(p.phase + Date.now() * 0.0005) * 0.5;
      } else if (config.type === 'heart') {
        // 爱心效果
        ctx.fillStyle = p.color;
        ctx.font = `${p.size * 4}px serif`;
        ctx.fillText('❤', p.x, p.y);
      } else if (config.type === 'ember') {
        // 火星效果
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.vy = -0.5 - Math.random() * 0.5;
      } else {
        // 默认浮动光点
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 拖尾
      if (config.trail) {
        ctx.globalAlpha = p.alpha * 0.15;
        ctx.beginPath();
        ctx.arc(p.x - p.vx * 3, p.y - p.vy * 3, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    this.animId = requestAnimationFrame(() => this._animate());
  },

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.canvas) this.canvas.style.opacity = '0';
  }
};

// ===== BGM 系统 — 和弦进行 + 混响 + 多变体 + pad 层 =====
const BGM = {
  ctx: null, masterGain: null, reverbNode: null, reverbGain: null, playing: false, muted: false,
  _chordTimer: null, _padOsc: null, _padGain: null,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.12;

    // 创建混响效果
    this.reverbNode = this.ctx.createConvolver();
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    this.reverbNode.buffer = impulse;

    // 路由：source -> reverb -> reverbGain -> masterGain -> destination
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.3;
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  },

  _playNote(freq, dur, type, vol, withReverb) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    if (withReverb !== false && this.reverbNode) {
      g.connect(this.reverbNode);
    }
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  },

  play(genre) {
    if (!this.ctx) this.init();
    this.resume();
    this.stop();
    this.playing = true;

    const progressions = {
      '科幻': {
        chords: [
          [[261.63,329.63,392], [293.66,349.23,440], [329.63,392,493.88], [349.23,440,523.25]],
          [[220,277.18,329.63], [261.63,329.63,392], [293.66,349.23,440], [261.63,329.63,523.25]],
          [[196,246.94,293.66], [220,277.18,329.63], [261.63,329.63,392], [220,329.63,440]],
        ],
        tempo: 2.8,
        pad: 110,
      },
      '悬疑': {
        chords: [
          [[246.94,293.66,349.23], [261.63,311.13,392], [220,277.18,329.63], [246.94,311.13,369.99]],
          [[207.65,261.63,311.13], [220,277.18,349.23], [196,246.94,293.66], [220,293.66,349.23]],
          [[174.61,220,261.63], [196,246.94,293.66], [207.65,261.63,311.13], [196,261.63,329.63]],
        ],
        tempo: 3.5,
        pad: 82.41,
      },
      '古风': {
        chords: [
          [[293.66,349.23,440], [329.63,392,523.25], [261.63,329.63,392], [293.66,440,523.25]],
          [[261.63,329.63,392], [293.66,349.23,523.25], [329.63,392,523.25], [261.63,392,493.88]],
          [[220,261.63,329.63], [261.63,329.63,392], [293.66,349.23,440], [261.63,392,493.88]],
        ],
        tempo: 3,
        pad: 130.81,
      },
      '恋爱': {
        chords: [
          [[329.63,392,440], [349.23,440,523.25], [293.66,349.23,440], [329.63,440,523.25]],
          [[349.23,440,523.25], [392,493.88,587.33], [329.63,440,523.25], [349.23,523.25,659.25]],
          [[293.66,349.23,440], [329.63,392,523.25], [349.23,440,523.25], [329.63,523.25,659.25]],
        ],
        tempo: 2.5,
        pad: 174.61,
      },
      '历史': {
        chords: [
          [[220,261.63,329.63], [246.94,293.66,369.99], [261.63,329.63,392], [220,329.63,440]],
          [[196,246.94,293.66], [220,261.63,329.63], [246.94,311.13,369.99], [220,293.66,369.99]],
          [[164.81,220,261.63], [196,246.94,293.66], [220,261.63,329.63], [196,293.66,369.99]],
        ],
        tempo: 3.2,
        pad: 65.41,
      },
      '自由': {
        chords: [
          [[261.63,329.63,392], [293.66,349.23,440], [329.63,392,523.25], [261.63,392,493.88]],
          [[220,261.63,329.63], [261.63,329.63,392], [293.66,349.23,440], [261.63,392,523.25]],
          [[293.66,349.23,440], [329.63,392,523.25], [261.63,329.63,392], [220,329.63,440]],
        ],
        tempo: 2.8,
        pad: 130.81,
      },
    };

    const cfg = progressions[genre] || progressions['自由'];
    // 随机选一组和弦
    const progs = cfg.chords[Math.floor(Math.random() * cfg.chords.length)];
    const tempo = cfg.tempo;
    let step = 0;

    // 持续低音层（pad）
    this._startPad(cfg.pad);

    const playChord = () => {
      if (!this.playing) return;
      const chord = progs[step % progs.length];
      chord.forEach((note, i) => {
        this._playNote(note, tempo * 0.8, 'sine', 0.05 + i * 0.008, true);
        if (i === 0) this._playNote(note / 2, tempo * 1.2, 'triangle', 0.025, true);
      });
      step++;
      this._chordTimer = setTimeout(playChord, tempo * 1000);
    };
    playChord();
  },

  _startPad(freq) {
    // 持续低音层
    if (!this.ctx) return;
    this._padOsc = this.ctx.createOscillator();
    this._padGain = this.ctx.createGain();
    this._padOsc.type = 'sine';
    this._padOsc.frequency.value = freq;
    this._padGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this._padGain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 2);
    this._padOsc.connect(this._padGain);
    this._padGain.connect(this.reverbNode || this.masterGain);
    this._padOsc.start();
  },

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  stop() {
    this.playing = false;
    clearTimeout(this._chordTimer);
    if (this._padOsc) {
      try { this._padGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5); this._padOsc.stop(this.ctx.currentTime + 0.6); } catch(e) {}
      this._padOsc = null;
      this._padGain = null;
    }
  },
  setVolume(v) { if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v)); },
  toggleMute() { this.muted = !this.muted; this.setVolume(this.muted ? 0 : 0.12); return this.muted; }
};

// ===== SFX 音效系统 — 带滤波器 + 新增音效 =====
const SFX = {
  ctx: null,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  _tone(type, freq, freqEnd, vol, dur, filterFreq) {
    if (!this.ctx) this.init();
    this.resume();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    // 可选低通滤波器让音色更温暖
    if (filterFreq) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq;
      f.Q.value = 1;
      o.connect(f); f.connect(g);
    } else {
      o.connect(g);
    }
    g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },

  choice() {
    this._tone('sine', 523, 784, 0.12, 0.25, 2000);
    setTimeout(() => this._tone('sine', 659, 1047, 0.08, 0.2, 2000), 80);
  },

  scene() {
    this._tone('sine', 261, 523, 0.08, 0.6, 1500);
    setTimeout(() => this._tone('triangle', 523, 784, 0.05, 0.4, 1500), 200);
    setTimeout(() => this._tone('sine', 784, 1047, 0.04, 0.3, 1500), 400);
  },

  endingGood() {
    [523, 659, 784, 1047, 1318].forEach((f, i) => {
      setTimeout(() => this._tone('sine', f, null, 0.1, 0.5, 3000), i * 120);
    });
  },

  endingBad() {
    this._tone('sawtooth', 220, 55, 0.06, 1.5, 800);
    setTimeout(() => this._tone('square', 110, 55, 0.04, 1, 600), 300);
  },

  typing() {
    this._tone('sine', 1200 + Math.random() * 400, 800, 0.02, 0.04, 3000);
  },

  // 新增音效
  hover() {
    this._tone('sine', 440, 460, 0.03, 0.08, 2000);
  },
  transition() {
    this._tone('sine', 523, 261, 0.06, 0.8, 1200);
    setTimeout(() => this._tone('triangle', 392, 196, 0.04, 0.5, 1000), 200);
  },
  chapterChange() {
    [392, 523, 659, 784].forEach((f, i) => {
      setTimeout(() => this._tone('sine', f, null, 0.08, 0.3, 2500), i * 100);
    });
  },

  // 打字机完成音效
  typingDone() {
    this._tone('sine', 523, 659, 0.05, 0.2, 2000);
    setTimeout(() => this._tone('sine', 659, 784, 0.04, 0.15, 2000), 80);
  },

  // 新场景出现
  newScene() {
    this._tone('triangle', 196, 392, 0.05, 0.5, 1000);
    setTimeout(() => this._tone('sine', 392, 784, 0.04, 0.4, 2000), 150);
    setTimeout(() => this._tone('sine', 523, 1047, 0.03, 0.3, 2500), 300);
  },

  // 角色声音 — 更真实的谐波合成 + 振幅调制
  voice(pitch) {
    if (!this.ctx) this.init();
    this.resume();
    const t = this.ctx.currentTime;
    const base = pitch || 180;

    // 用谐波+振幅调制模拟人声基频
    const harmonics = [
      { h: 1, vol: 0.025, type: 'sawtooth' },
      { h: 2, vol: 0.012, type: 'sine' },
      { h: 3, vol: 0.006, type: 'sine' },
      { h: 5, vol: 0.003, type: 'sine' },
    ];

    // 振幅调制（模拟语音节奏）
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 5 + Math.random() * 3; // 5-8Hz 语音节奏
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain);

    harmonics.forEach(({ h, vol, type }) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o.type = type;
      o.frequency.value = base * h + (Math.random() - 0.5) * 4;
      f.type = 'bandpass';
      f.frequency.value = base * h;
      f.Q.value = 1.5;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      // LFO 调制音量
      lfoGain.connect(g.gain);
      g.gain.setValueAtTime(vol, t + 0.04);
      g.gain.linearRampToValueAtTime(0, t + 0.1);
      o.connect(f); f.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + 0.12);
    });
    lfo.start(t); lfo.stop(t + 0.12);
  }
};

// ===== AI 视频生成系统 =====
// ===== 电影级特效系统（替代视频 API）=====
const CinemaFX = {
  overlay: null,
  style: '2d-anime',
  timer: null,

  init() {
    this.overlay = document.getElementById('cinema-overlay');
    if (!this.overlay) {
      const el = document.createElement('div');
      el.id = 'cinema-overlay';
      el.className = 'cinema-overlay';
      const sceneImg = document.getElementById('scene-image');
      if (sceneImg) sceneImg.appendChild(el);
      this.overlay = el;
    }
  },

  // 场景切换时触发特效
  playEffect(sceneText) {
    this.init();
    if (!this.overlay) return;
    this.style = state.visualStyle;

    const lower = (sceneText || '').toLowerCase();
    let effect = 'ambient';
    if (/打|战|攻|fight|battle|attack/i.test(lower)) effect = 'dramatic';
    else if (/哭|泪|悲|sad|cry|tear/i.test(lower)) effect = 'sorrow';
    else if (/笑|乐|欢|happy|laugh|joy/i.test(lower)) effect = 'warm';
    else if (/夜|暗|黑|night|dark|shadow/i.test(lower)) effect = 'noir';
    else if (/雨|雪|storm|rain|snow/i.test(lower)) effect = 'weather';
    else if (/爱|情|吻|love|romance|kiss/i.test(lower)) effect = 'romance';
    else if (/火|焰|燃|fire|flame|burn/i.test(lower)) effect = 'fire';

    // 真人模式更强烈的电影特效
    const isRealistic = this.style === 'realistic';
    const styles = {
      ambient: isRealistic
        ? 'background:radial-gradient(ellipse at 50% 50%,rgba(255,255,255,0.03) 0%,transparent 70%);animation:cineBreath 4s ease-in-out infinite'
        : 'background:radial-gradient(ellipse at 50% 50%,rgba(108,92,231,0.05) 0%,transparent 70%);animation:cineBreath 3s ease-in-out infinite',
      dramatic: isRealistic
        ? 'background:linear-gradient(135deg,rgba(255,60,0,0.08),rgba(0,0,0,0.15));animation:cineFlash 0.5s ease-out'
        : 'background:linear-gradient(135deg,rgba(255,100,50,0.1),rgba(255,0,0,0.05));animation:cinePulse 1s ease-in-out 3',
      sorrow: isRealistic
        ? 'background:linear-gradient(180deg,rgba(0,50,100,0.12),rgba(0,0,50,0.1));animation:cineFadeIn 2s ease-out'
        : 'background:linear-gradient(180deg,rgba(100,100,200,0.1),rgba(50,50,150,0.08));animation:cineFadeIn 1.5s ease-out',
      warm: isRealistic
        ? 'background:radial-gradient(ellipse at 50% 30%,rgba(255,200,50,0.08),transparent 60%);animation:cineGlow 3s ease-in-out infinite'
        : 'background:radial-gradient(ellipse at 50% 30%,rgba(255,220,100,0.12),transparent 60%);animation:cineGlow 2.5s ease-in-out infinite',
      noir: isRealistic
        ? 'background:linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,30,0.15));animation:cineFadeIn 3s ease-out'
        : 'background:linear-gradient(180deg,rgba(30,0,50,0.15),rgba(0,0,0,0.1));animation:cineFadeIn 2s ease-out',
      weather: isRealistic
        ? 'background:linear-gradient(180deg,rgba(100,120,140,0.1),rgba(50,50,70,0.08));animation:cineBreath 5s ease-in-out infinite'
        : 'background:linear-gradient(180deg,rgba(150,150,200,0.08),rgba(80,80,120,0.06));animation:cineBreath 4s ease-in-out infinite',
      romance: isRealistic
        ? 'background:radial-gradient(ellipse at 50% 50%,rgba(255,100,120,0.06),rgba(255,200,200,0.03) 60%);animation:cineGlow 4s ease-in-out infinite'
        : 'background:radial-gradient(ellipse at 50% 50%,rgba(255,100,150,0.1),rgba(255,180,200,0.05) 60%);animation:cineGlow 3s ease-in-out infinite',
      fire: isRealistic
        ? 'background:linear-gradient(0deg,rgba(255,80,0,0.08),rgba(255,200,0,0.03));animation:cineFlash 0.3s ease-out, cineBreath 2s ease-in-out infinite'
        : 'background:linear-gradient(0deg,rgba(255,100,0,0.1),rgba(255,200,50,0.05));animation:cinePulse 1.5s ease-in-out 2',
    };

    this.overlay.style.cssText = styles[effect] || styles.ambient;
    this.overlay.classList.add('active');
  },

  stop() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.overlay) this.overlay.classList.remove('active');
  }
};
// ===== 角色头像（CSS 生成，稳定可靠） =====
// ===== 角色 AI 头像（Pollinations 图片）=====
const CharAvatar = {
  cache: {},
  loading: {},

  getAvatarUrl(voiceType) {
    if (this.cache[voiceType]) return this.cache[voiceType];
    if (this.loading[voiceType]) return null; // 正在加载

    const isAnime = state.visualStyle === '2d-anime';
    const zhGenre = EN_ZH_GENRE_MAP[state.genre] || state.genre;
    const isChinese = currentLang === 'zh' || ['古风','历史'].includes(zhGenre);
    const race = isChinese ? 'East Asian, black hair, dark eyes' : '';

    const prompts = {
      old_man: isAnime
        ? `2D anime portrait of an elderly ${isChinese ? 'Chinese ' : ''}man with white beard and wise eyes, wearing ${zhGenre === '古风' ? 'ancient Chinese robes and hat' : 'traditional wise man clothes'}, anime art style, clean lines, white background, bust portrait`
        : `photorealistic portrait photo of an elderly ${isChinese ? 'Chinese ' : ''}man, distinguished, wrinkles, ${race}, dramatic lighting, white background, passport photo style`,
      young_man: isAnime
        ? `2D anime portrait of a handsome young ${isChinese ? 'Chinese ' : ''}man, ${zhGenre === '古风' ? 'wearing ancient Chinese swordsman outfit with flowing robes' : 'modern casual clothes'}, anime art style, clean lines, white background, bust portrait`
        : `photorealistic portrait photo of a handsome young ${isChinese ? 'Chinese ' : ''}man, ${race}, confident expression, dramatic lighting, white background, passport photo style`,
      woman: isAnime
        ? `2D anime portrait of a beautiful ${isChinese ? 'Chinese ' : ''}young woman, ${zhGenre === '古风' ? 'wearing elegant hanfu with hair ornaments' : 'elegant dress'}, anime art style, clean lines, white background, bust portrait`
        : `photorealistic portrait photo of a beautiful ${isChinese ? 'Chinese ' : ''}young woman, ${race}, soft lighting, white background, passport photo style`,
      child: isAnime
        ? `2D anime portrait of a cute ${isChinese ? 'Chinese ' : ''}child, big expressive eyes, cheerful smile, anime art style, clean lines, white background, bust portrait`
        : `photorealistic portrait photo of a cute ${isChinese ? 'Chinese ' : ''}child, ${race}, innocent smile, natural lighting, white background, passport photo style`,
      default: isAnime
        ? `2D anime portrait of a mysterious figure, anime art style, clean lines, white background, bust portrait`
        : `photorealistic portrait photo of a person, dramatic lighting, white background, passport photo style`
    };

    const p = prompts[voiceType] || prompts.default;
    const seed = voiceType.length * 1000 + (isAnime ? 42 : 99);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=128&height=128&seed=${seed}&nologo=true&model=flux`;

    this.loading[voiceType] = true;
    // 预加载
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { this.cache[voiceType] = url; this.loading[voiceType] = false; };
    img.onerror = () => { this.loading[voiceType] = false; };
    img.src = url;

    return url; // 可能还没加载完，先用着
  },

  clearCache() { this.cache = {}; this.loading = {}; },

  getStyle(voiceType) {
    const configs = {
      old_man:   { nameZh: '长者', nameEn: 'Elder' },
      young_man: { nameZh: '少年', nameEn: 'Youth' },
      woman:     { nameZh: '女子', nameEn: 'Lady' },
      child:     { nameZh: '孩童', nameEn: 'Child' },
      default:   { nameZh: '旁白', nameEn: 'Narrator' }
    };
    return configs[voiceType] || configs.default;
  }
};

// ===== 角色对话动画 =====
const DialogAnim = {
  overlay: null,
  currentDialogs: [],
  currentIdx: 0,
  timer: null,
  typeInterval: null,

  init() {
    this.overlay = document.getElementById('dialog-overlay');
    if (!this.overlay) {
      const el = document.createElement('div');
      el.id = 'dialog-overlay';
      el.className = 'dialog-overlay';
      el.innerHTML = '<div class="dialog-avatar" id="dialog-avatar"></div><div class="dialog-content"><div class="dialog-name" id="dialog-name"></div><div class="dialog-bubble" id="dialog-bubble"></div></div>';
      const sceneImg = document.getElementById('scene-image');
      if (sceneImg) sceneImg.appendChild(el);
      this.overlay = el;
    }
  },

  show(sceneText) {
    this.init();
    if (!this.overlay) return;

    // 清理上一场景的定时器，防止干扰
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.typeInterval) { clearInterval(this.typeInterval); this.typeInterval = null; }

    // v1.8: AI真人模式也显示对话

    // 用分离的正则精确匹配配对引号，避免开闭引号混搭
    const dialogPatterns = [
      /「([^」]{2,})」/g,
      /『([^』]{2,})』/g,
      /\u201c([^\u201d]{2,})\u201d/g,
      /"([^"]{2,})"/g,
    ];
    const dialogs = [];
    dialogPatterns.forEach(re => {
      let match;
      while ((match = re.exec(sceneText)) !== null) {
        const content = (match[1] || '').trim();
        if (content.length > 1 && content.length < 80 && !dialogs.includes(content)) dialogs.push(content);
      }
    });

    if (dialogs.length === 0) {
      // 无对话时显示旁白头像 + 第一句旁白
      const sentences = sceneText.match(/[^。！？.!?\n]+[。！？.!?]/g);
      if (sentences && sentences.length > 0) {
        const first = sentences[0].trim();
        if (first.length > 3 && first.length < 80) {
          this.currentDialogs = [first];
          this.currentIdx = 0;
          this._showNarratorLine(0);
          return;
        }
      }
      this.hide(); return;
    }

    this.currentDialogs = dialogs;
    this.currentIdx = 0;
    this.showDialog(0);
  },

  // 真人模式旁白字幕
  showNarratorSub(sceneText) {
    const dialogPatterns = [
      /「([^」]{2,})」/g,
      /『([^』]{2,})』/g,
      /\u201c([^\u201d]{2,})\u201d/g,
      /"([^"]{2,})"/g,
    ];
    const dialogs = [];
    dialogPatterns.forEach(re => {
      let match;
      while ((match = re.exec(sceneText)) !== null) {
        const content = (match[1] || '').trim();
        if (content.length > 1 && content.length < 80 && !dialogs.includes(content)) dialogs.push(content);
      }
    });
    if (dialogs.length === 0) { this.hide(); return; }

    this.currentDialogs = dialogs;
    this.currentIdx = 0;
    this.showNarratorLine(0);
  },

  showNarratorLine(idx) {
    if (idx >= this.currentDialogs.length) { this.hide(); return; }
    const text = this.currentDialogs[idx];
    const nameEl = document.getElementById('dialog-name');
    const bubble = document.getElementById('dialog-bubble');
    const avatarEl = document.getElementById('dialog-avatar');
    if (!bubble) return;

    const voiceType = TTS.detectVoice ? TTS.detectVoice(text, idx) : 'default';
    const cfg = CharAvatar.getStyle(voiceType);
    if (nameEl) { nameEl.textContent = currentLang === 'en' ? cfg.nameEn : cfg.nameZh; nameEl.style.color = '#fff'; }
    if (avatarEl) { const url = CharAvatar.getAvatarUrl(voiceType); if(url) avatarEl.style.backgroundImage = `url(${url})`; avatarEl.style.display = 'block'; }
    bubble.textContent = text;
    this.overlay.classList.add('active');
    bubble.classList.remove('typing');
    void bubble.offsetWidth;
    bubble.classList.add('typing');

    this.timer = setTimeout(() => this.showNarratorLine(idx + 1), Math.max(2500, text.length * 160));
  },

  // 旁白模式（无对话时显示第一句）
  _showNarratorLine(idx) {
    if (idx >= this.currentDialogs.length) { this.hide(); return; }
    const text = this.currentDialogs[idx];
    const nameEl = document.getElementById('dialog-name');
    const bubble = document.getElementById('dialog-bubble');
    const avatarEl = document.getElementById('dialog-avatar');
    if (!bubble) return;

    const cfg = CharAvatar.getStyle('default');
    if (nameEl) { nameEl.textContent = currentLang === 'en' ? cfg.nameEn : cfg.nameZh; nameEl.style.color = '#fff'; }
    if (avatarEl) { const url = CharAvatar.getAvatarUrl('default'); if(url) avatarEl.style.backgroundImage = `url(${url})`; avatarEl.style.display = 'block'; }

    bubble.textContent = '';
    this.overlay.classList.add('active');
    bubble.classList.remove('typing');
    void bubble.offsetWidth;
    bubble.classList.add('typing');

    if (this.typeInterval) clearInterval(this.typeInterval);
    let ci = 0;
    this.typeInterval = setInterval(() => {
      if (ci < text.length) { bubble.textContent += text[ci]; ci++; }
      else { clearInterval(this.typeInterval); this.typeInterval = null; }
    }, 40);

    this.timer = setTimeout(() => {
      if (this.typeInterval) { clearInterval(this.typeInterval); this.typeInterval = null; }
      this.hide();
    }, Math.max(8000, text.length * 200));
  },

  showDialog(idx) {
    if (idx >= this.currentDialogs.length) { this.hide(); return; }

    const text = this.currentDialogs[idx];
    const nameEl = document.getElementById('dialog-name');
    const bubble = document.getElementById('dialog-bubble');
    const avatarEl = document.getElementById('dialog-avatar');
    if (!bubble) return;

    const voiceType = TTS.detectVoice ? TTS.detectVoice(text, idx) : 'default';
    const cfg = CharAvatar.getStyle(voiceType);
    if (nameEl) {
      nameEl.textContent = currentLang === 'en' ? cfg.nameEn : cfg.nameZh;
      nameEl.style.color = '#fff';
    }
    if (avatarEl) {
      const url = CharAvatar.getAvatarUrl(voiceType);
      if(url) avatarEl.style.backgroundImage = `url(${url})`;
      avatarEl.style.display = 'block';
      avatarEl.style.display = 'block';
    }

    bubble.textContent = '';
    this.overlay.classList.add('active');
    bubble.classList.remove('typing');
    void bubble.offsetWidth;
    bubble.classList.add('typing');

    if (this.typeInterval) clearInterval(this.typeInterval);
    let charIdx = 0;
    this.typeInterval = setInterval(() => {
      if (charIdx < text.length) {
        bubble.textContent += text[charIdx];
        charIdx++;
      } else {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
      }
    }, 45);

    const duration = Math.max(6000, text.length * 200);
    this.timer = setTimeout(() => {
      if (this.typeInterval) { clearInterval(this.typeInterval); this.typeInterval = null; }
      this.showDialog(idx + 1);
    }, duration);
  },

  hide() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.typeInterval) { clearInterval(this.typeInterval); this.typeInterval = null; }
    if (this.overlay) this.overlay.classList.remove('active');
  }
};

// ===== TTS 角色语音系统（定制声音） =====
const TTS = {
  enabled: true,
  speaking: false,
  voices: [],
  zhVoice: null,
  enVoice: null,
  characterVoices: {
    default: { rate: 0.9, pitch: 1.0, volume: 0.85 },
    old_man: { rate: 0.75, pitch: 0.7, volume: 0.8 },
    young_man: { rate: 0.9, pitch: 0.95, volume: 0.85 },
    woman: { rate: 0.95, pitch: 1.3, volume: 0.8 },
    child: { rate: 1.1, pitch: 1.6, volume: 0.75 },
    narrator: { rate: 0.85, pitch: 0.85, volume: 0.7 },
  },
  detectVoice(text, idx) {
    if (/老夫|老朽|本官|朕|寡人|大人/.test(text)) return 'old_man';
    if (/在下|某|末将|小弟|兄弟/.test(text)) return 'young_man';
    if (/奴家|妾身|姐姐|妹妹|姑娘/.test(text)) return 'woman';
    const types = ['young_man', 'woman', 'old_man', 'child'];
    return types[idx % types.length];
  },

  init() {
    if (!window.speechSynthesis) { this.enabled = false; return; }
    const loadVoices = () => {
      this.voices = speechSynthesis.getVoices();
      this.zhVoice = this.voices.find(v => v.lang === 'zh-CN') || this.voices.find(v => v.lang.startsWith('zh')) || null;
      this.enVoice = this.voices.find(v => v.lang === 'en-US') || this.voices.find(v => v.lang.startsWith('en')) || null;
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  },

  speak(text) {
    if (!this.enabled || !window.speechSynthesis) return;
    this.stop();

    // 提取对话 — 用配对正则精确匹配
    const dialogs = [];
    const patterns = [
      /「([^」]{2,})」/g,
      /『([^』]{2,})』/g,
      /\u201c([^\u201d]{2,})\u201d/g,
      /"([^"]{2,})"/g
    ];
    patterns.forEach(re => {
      let m;
      while ((m = re.exec(text)) !== null) {
        const c = (m[1] || '').trim();
        if (c.length > 1 && c.length < 80 && !dialogs.includes(c)) dialogs.push(c);
      }
    });

    if (dialogs.length === 0) {
      // 朗读最后一句旁白
      const sentences = text.match(/[^。！？.!?\n]+[。！？.!?]/g);
      if (sentences && sentences.length > 0) {
        const last = sentences[sentences.length - 1].trim();
        if (last.length > 3 && last.length < 60) this._say(last, this.characterVoices.narrator);
      }
      return;
    }

    // 按顺序朗读，每句用不同角色声音
    let delay = 600;
    dialogs.forEach((d, i) => {
      const voiceType = this.detectVoice(d, i);
      const voice = this.characterVoices[voiceType] || this.characterVoices.default;
      setTimeout(() => this._say(d, voice), delay);
      delay += d.length * 200 + 800;
    });
  },

  _say(text, rate, pitch) {
    if (!window.speechSynthesis) return;
    const voiceConfig = typeof rate === 'object' ? rate : { rate: rate || 0.9, pitch: pitch || 1.0, volume: 0.85 };
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = currentLang === 'en' ? 'en-US' : 'zh-CN';
    utt.rate = voiceConfig.rate || 0.9;
    utt.pitch = voiceConfig.pitch || 1.0;
    utt.volume = voiceConfig.volume || 0.85;
    if (currentLang === 'zh' && this.zhVoice) utt.voice = this.zhVoice;
    else if (currentLang === 'en' && this.enVoice) utt.voice = this.enVoice;
    utt.onstart = () => { this.speaking = true; };
    utt.onend = () => { this.speaking = false; };
    utt.onerror = () => { this.speaking = false; };
    speechSynthesis.speak(utt);
  },

  stop() {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
    }
    this.speaking = false;
  },

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stop();
    return this.enabled;
  }
};

// ===== 字体大小调节 =====
const FONT_SIZES = [
  { label: '小', labelEn: 'S', size: 0.82 },
  { label: '中', labelEn: 'M', size: 0.95 },
  { label: '大', labelEn: 'L', size: 1.12 },
  { label: '特大', labelEn: 'XL', size: 1.3 },
];
let fontLevel = 1; // 默认"中"

function updateFontSize() {
  const cfg = FONT_SIZES[fontLevel];
  document.getElementById('story-text').style.fontSize = cfg.size + 'rem';
  document.getElementById('font-size-label').textContent = currentLang === 'en' ? cfg.labelEn : cfg.label;
  // 也调整选项字体
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.style.fontSize = (cfg.size - 0.07) + 'rem';
  });
}

// ===== State =====
let state = {
  genre:'', theme:'', chapter:1, choiceCount:0, history:[],
  sceneCount:0, isTyping:false, imageUrl:null, visualStyle:'2d-anime',
  imageLoading:false, abortTyping:false, muted:false,
  imgLayer: 'a',
};

// ===== 图片预加载缓存 =====
const imageCache = new Map();
const IMAGE_CACHE_MAX = 8;

function preloadImage(url) {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (imageCache.size >= IMAGE_CACHE_MAX) {
        const firstKey = imageCache.keys().next().value;
        imageCache.delete(firstKey);
      }
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ===== Init =====
let selectedGenre = null;
let genreDesc = '';

// 初始化 TTS
TTS.init();

// 语言切换
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    setLanguage(btn.dataset.lang);
  });
});

// 画面风格选择
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.visualStyle = btn.dataset.style;
    // 切换电影模式样式
    const sceneImg = document.getElementById('scene-image');
    if (sceneImg) sceneImg.classList.toggle('realistic-mode', state.visualStyle === 'realistic');
  });
});

// 题材选择
document.querySelectorAll('.genre-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedGenre = btn.dataset.genre;
    genreDesc = btn.dataset.desc;
    const isCustom = (currentLang === 'zh' && selectedGenre === '自由') || (currentLang === 'en' && selectedGenre === 'custom');
    document.getElementById('custom-theme').classList.toggle('hidden', !isCustom);
    document.getElementById('start-btn').disabled = false;
    if (isCustom) document.getElementById('theme-input').focus();
  });
});

document.getElementById('theme-input').addEventListener('input', e => {
  const isCustom = (currentLang === 'zh' && selectedGenre === '自由') || (currentLang === 'en' && selectedGenre === 'custom');
  if (isCustom) {
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
  TTS.stop();
  SceneAnim.stop();
  DialogAnim.hide(); CinemaFX.stop();
  if (confirm(LANG.confirmRestart)) resetGame();
});
document.getElementById('replay-btn').addEventListener('click', resetGame);

// 音量控制
document.getElementById('volume-btn').addEventListener('click', () => {
  const muted = BGM.toggleMute();
  state.muted = muted;
  document.getElementById('volume-btn').textContent = muted ? '🔇' : '🔊';
});

// TTS 语音控制
document.getElementById('voice-btn').addEventListener('click', () => {
  const on = TTS.toggle();
  document.getElementById('voice-btn').textContent = on ? '🗣️' : '🤐';
  if (!on) TTS.stop();
});

// 字体大小控制
document.getElementById('font-down').addEventListener('click', () => {
  if (fontLevel > 0) { fontLevel--; updateFontSize(); SFX.hover(); }
});
document.getElementById('font-up').addEventListener('click', () => {
  if (fontLevel < FONT_SIZES.length - 1) { fontLevel++; updateFontSize(); SFX.hover(); }
});

// ===== System Prompt =====
function getSystemPrompt() {
  const styleConfig = STYLES[state.visualStyle];
  if (currentLang === 'en') {
    return `You are "HuaXia Cinema" interactive movie engine. Create ${styleConfig.label} style cinematic stories.

[Genre] ${state.genre}
[Theme] ${state.theme}
[Visual Style] ${styleConfig.label}

[Core Rules]
1. Use second person "you" narration, cinematic descriptions
2. Each response: scene description (200-300 words) + 2-3 choices
3. Mark choices with [A] [B] [C]
4. Add a key plot twist every 3-4 choices
5. All previous choices affect the storyline
6. Scenes must be vivid: environment, sound, lighting, atmosphere
7. Character dialogue in quotes "like this", each character has distinct voice
8. Start with [Scene Name]
9. After scene name, use [Visual] for English image description (${styleConfig.label} style)

[Output Format]
[Scene Name] Title
[Visual] English description, ${state.visualStyle === 'realistic' ? 'realistic people, cinematic lighting, camera angle, depth of field, skin texture' : '2D anime characters, hand-drawn, cel shading, vibrant colors, dreamy lighting'}

Scene description...A character says "dialogue"...

[A] Choice one
[B] Choice two
[C] Choice three

[Ending] After 8-12 choices, mark with [Ending: good/normal/bad] and [THE END].`;
  }
  // 中文 prompt
  return `你是"华夏锋彩"互动影游引擎，创作${styleConfig.label}风格的电影级故事。

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
7. 角色对话用引号「」标注，不同角色要有不同说话风格
8. 开头用 【场景名】标注
9. 场景名后用 【画面】用英文描述画面（适合${styleConfig.label}风格渲染）
10. 对话中包含角色情感暗示

【重要：人物外貌】
画面描述中必须明确包含东亚/中国人外貌特征：
- East Asian/Chinese appearance, black hair, dark brown eyes, yellow-toned skin
- 不要描述金发碧眼或西方人特征

【输出格式】
【场景名】标题
【画面】英文描述，必须包含 "East Asian/Chinese appearance, black hair, dark eyes"。${state.visualStyle === 'realistic' ? '真实人物、电影布光、摄影机角度、景深效果、东亚人肤色质感' : '2D动漫角色、赛璐珞渲染、夸张表情、梦幻光影、东亚面孔'}

场景描写...角色说「对话内容」...

[A] 选项一
[B] 选项二
[C] 选项三

【结局】第8-12个选择后，用【结局：好/普通/坏】标注，【THE END】结束。`;
}

// ===== Game =====
function startGame() {
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  document.getElementById('scanlines').classList.toggle('hidden', state.visualStyle !== 'realistic');
  document.getElementById('scene-image').classList.toggle('realistic-mode', state.visualStyle === 'realistic');

  updateStatus();
  BGM.play(getInternalGenre());
  SceneAnim.start(state.genre);

  // 预加载角色头像
  ['old_man', 'young_man', 'woman', 'child', 'default'].forEach(t => CharAvatar.getAvatarUrl(t));

  const sys = getSystemPrompt();
  state.history = [{ role: 'system', content: sys }];
  requestScene(currentLang === 'en' ? 'Start game' : '开始游戏');
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

    // Bug 2 修复：确保动画在运行
    if (!SceneAnim.running) {
      SceneAnim.start(state.genre);
    }

    // 异步生成图片
    const imgP = extractPrompt(text);
    if (imgP) generateImage(imgP, text);

    // isEnd 检测兼容英文
    const isEnd = text.includes('【THE END】') || text.includes('[THE END]')
      || /【结局[：:]/.test(text) || /\[Ending[：:]/i.test(text);

    await showScene(text, isEnd);

  } catch (err) {
    hideLoading();
    state.history.pop();
    showError(err.message);
  }
}

// ===== Image（双层流畅切换 — 高分辨率） =====
function extractPrompt(text) {
  const m = text.match(/【画面】(.+)/) || text.match(/\[Visual\]\s*(.+)/);
  const styleP = STYLES[state.visualStyle].prompt;
  const ethnicityHint = currentLang === 'zh' ? ', East Asian appearance, black hair, dark eyes' : '';

  const faceHint = state.visualStyle === 'realistic'
    ? ', detailed face, natural proportions, symmetrical face, realistic skin texture'
    : ', well proportioned anime face, clear features, moderate eyes, symmetrical face';

  if (m) return `${m[1].trim()}, ${styleP}${ethnicityHint}${faceHint}`;
  const s = text.match(/【场景名】(.+)/) || text.match(/\[Scene Name\]\s*(.+)/);
  if (s) return `${s[1].trim()}, ${state.genre} theme, ${styleP}${ethnicityHint}${faceHint}`;
  return null;
}

function generateImage(prompt, sceneText) {
  const seed = Date.now();
  const isMobile = window.innerWidth < 768;
  const w = isMobile ? 896 : 1280;
  const h = isMobile ? 1152 : 720;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;
  state.imageUrl = url;
  state.imageLoading = true;

  // 场景过渡闪光效果
  const flash = document.getElementById('scene-flash');
  if (flash) {
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 150);
  }

  // 立即播放 CinemaFX 和更新动画，不依赖图片加载
  CinemaFX.playEffect(sceneText);
  if (sceneText && SceneAnim.running) {
    SceneAnim.updateForScene(sceneText);
  }

  // 带超时的图片加载
  const IMG_TIMEOUT = 18000;
  let settled = false;

  const timeoutP = new Promise((_, reject) =>
    setTimeout(() => { if (!settled) { settled = true; reject(new Error('timeout')); } }, IMG_TIMEOUT)
  );

  Promise.race([preloadImage(url), timeoutP])
    .then(() => {
      if (settled) return;
      settled = true;
      applyImage(url);
    })
    .catch(() => {
      state.imageLoading = false;
      // 超时/失败时用更小尺寸重试一次
      if (!settled) {
        settled = true;
        const retryUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=432&seed=${seed}&nologo=true&model=flux`;
        preloadImage(retryUrl).then(() => applyImage(retryUrl)).catch(() => {});
      }
    });
}

function applyImage(url) {
  const nextLayer = state.imgLayer === 'a' ? 'b' : 'a';
  const nextEl = document.getElementById(`img-layer-${nextLayer}`);
  const currEl = document.getElementById(`img-layer-${state.imgLayer}`);

  nextEl.style.backgroundImage = `url(${url})`;
  nextEl.classList.add('active');
  currEl.classList.remove('active');

  const container = document.getElementById('scene-image');
  KB.forEach(c => container.classList.remove(c));
  container.classList.add(KB[Math.floor(Math.random() * KB.length)]);

  state.imgLayer = nextLayer;
  state.imageLoading = false;
  SFX.transition();
}

// ===== Particles =====
function spawnParticles() {
  const box = document.getElementById('particles');
  box.innerHTML = '';
  const cfgs = STYLES[state.visualStyle].particles;
  const genre = getInternalGenre();
  const cfg = cfgs[genre] || cfgs['自由'];

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
  SFX.scene();

  // Bug 2 修复：确保 SceneAnim 在运行
  if (!SceneAnim.running) {
    SceneAnim.start(state.genre);
  }

  // 场景标题国际化
  const sceneNameMatch = text.match(/【场景名】(.+)/) || text.match(/\[Scene Name\]\s*(.+)/);
  const sceneName = (sceneNameMatch ? sceneNameMatch[1] : '').trim() || `${LANG.scene} ${state.sceneCount}`;
  const { narrative, choices } = parse(text);

  document.getElementById('scene-badge').textContent = sceneName;
  const chapterLabel = currentLang === 'en'
    ? LANG.chapter.replace('{n}', state.chapter)
    : `第${state.chapter}章`;
  document.getElementById('scene-title').textContent = `${chapterLabel} · ${sceneName}`;

  const storyEl = document.getElementById('story-text');
  const choicesEl = document.getElementById('choices');
  storyEl.innerHTML = '';
  choicesEl.innerHTML = '';
  storyEl.scrollTop = 0;

  spawnParticles();

  // Bug 1 修复：根据场景文本动态调整 Canvas 动画
  if (SceneAnim.running) SceneAnim.updateForScene(text);

  // v1.8: 角色对话动画（传清理后的叙事文本）
  DialogAnim.show(narrative);

  // 打字机音效计数器
  let typeCount = 0;
  let dialogMode = false;
  let dialogPitch = 180;

  // Typewriter
  for (let i = 0; i < narrative.length; i++) {
    if (state.abortTyping) break;

    const ch = narrative[i];

    // 检测对话模式
    if (ch === '「' || ch === '"' || ch === '"' || ch === '"') {
      dialogMode = true;
      dialogPitch = 150 + Math.floor(Math.random() * 100);
    }
    if (ch === '」' || ch === '"' || ch === '"' || ch === '"') {
      dialogMode = false;
    }

    storyEl.innerHTML = esc(narrative.substring(0, i + 1)) + '<span class="cursor"></span>';
    storyEl.scrollTop = storyEl.scrollHeight;

    // 音效
    typeCount++;
    if (typeCount >= 4 + Math.floor(Math.random() * 3)) {
      if (dialogMode) {
        SFX.voice(dialogPitch);
      } else {
        SFX.typing();
      }
      typeCount = 0;
    }

    if ('。！？…'.includes(ch) || ch === '.' || ch === '!' || ch === '?') await sleep(150);
    else if ('，、；：\n'.includes(ch) || ch === ',' || ch === ';') await sleep(60);
    else await sleep(dialogMode ? 30 : 20);
  }

  if (!state.abortTyping) {
    storyEl.innerHTML = esc(narrative);
    // 打字完成音效
    SFX.typingDone();
    TTS.speak(narrative);
  }

  if (isEnd && !state.abortTyping) { showEnding(narrative, text); return; }

  // Choices
  if (!state.abortTyping) {
    for (let i = 0; i < choices.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<b>${choices[i].key}.</b> ${esc(choices[i].text)}`;
      btn.style.cssText = 'opacity:0;transform:translateY(8px);';
      // hover 音效
      btn.addEventListener('mouseenter', () => SFX.hover());
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

// parse 函数兼容中英文格式（用 /g 全局替换）
function parse(text) {
  const choices = [];
  const re = /\[([A-C])\]\s*(.+)/g;
  let m;
  while ((m = re.exec(text)) !== null) choices.push({ key: m[1], text: m[2].trim() });

  const narrative = text
    .replace(/【场景名】.+\n?/g, '')
    .replace(/\[Scene Name\]\s*.+\n?/g, '')
    .replace(/【画面】.+\n?/g, '')
    .replace(/\[Visual\]\s*.+\n?/g, '')
    .replace(/\[[A-C]\].+/g, '')
    .replace(/【THE END】/g, '')
    .replace(/\[THE END\]/g, '')
    .replace(/【结局[：:].+/g, '')
    .replace(/\[Ending[：:].+/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { narrative, choices };
}

function choose(c) {
  if (state.isTyping) return;

  // 检测换章（用 getInternalGenre 确保一致性）
  const oldChapter = state.chapter;

  state.choiceCount++;
  state.chapter = Math.floor(state.choiceCount / 3) + 1;
  state.isTyping = false;
  state.abortTyping = true;
  TTS.stop();
  SFX.choice();

  // 换章音效
  if (state.chapter > oldChapter) SFX.chapterChange();

  updateStatus();
  document.getElementById('choices').innerHTML = '';
  const prefix = currentLang === 'en' ? 'I choose' : '我选择';
  requestScene(`${prefix} ${c.key}：${c.text}`);
}

function updateStatus() {
  // 章节信息国际化
  const ch = currentLang === 'en'
    ? LANG.chapter.replace('{n}', state.chapter)
    : `第${state.chapter}章`;
  document.getElementById('chapter-info').textContent = ch;
  document.getElementById('choice-count').textContent = state.choiceCount;

  // 更新章节进度点
  const progressContainer = document.getElementById('chapter-progress');
  if (progressContainer) {
    const totalDots = 9; // 最多9章（27次选择）
    const dots = progressContainer.querySelectorAll('.chapter-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i < state.chapter);
    });
  }
}

// ===== Ending =====
function showEnding(narrative, fullText) {
  state.isTyping = false;

  // 结局类型文字国际化
  let type, color, sfxType, starCount;
  if (/好|good/i.test(fullText)) { type = LANG.endingGood; color = '#2ed573'; sfxType = 'endingGood'; starCount = 5; }
  else if (/坏|bad/i.test(fullText)) { type = LANG.endingBad; color = '#ff6b6b'; sfxType = 'endingBad'; starCount = 2; }
  else { type = LANG.endingNormal; color = '#ffa502'; sfxType = 'endingGood'; starCount = 3; }

  SFX[sfxType]();
  BGM.stop();
  TTS.stop();
  SceneAnim.stop();
  DialogAnim.hide(); CinemaFX.stop();

  if (state.imageUrl) {
    document.getElementById('ending-bg').style.backgroundImage = `url(${state.imageUrl})`;
  }

  setTimeout(() => {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('ending-screen').classList.add('active');
    // 结局标题国际化
    document.getElementById('ending-title').textContent = LANG.storyEnd;
    document.getElementById('ending-type').textContent = type;
    document.getElementById('ending-type').style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44;`;
    document.getElementById('ending-text').textContent = narrative;
    // 统计数字
    document.getElementById('total-choices').textContent = state.choiceCount;
    document.getElementById('total-scenes').textContent = state.sceneCount;

    // 星级评分
    const starsEl = document.getElementById('ending-stars');
    if (starsEl) {
      starsEl.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'ending-star' + (i < starCount ? ' active' : '');
        star.textContent = '★';
        starsEl.appendChild(star);
      }
    }

    // 更新统计标签
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels[0]) statLabels[0].textContent = LANG.choices;
    if (statLabels[1]) statLabels[1].textContent = LANG.scenes;

    // 更新按钮文本
    document.getElementById('replay-btn').textContent = LANG.replay;
    document.querySelector('.btn-secondary').textContent = LANG.share;
  }, 800);
}

// ===== Reset =====
function resetGame() {
  state.abortTyping = true;
  TTS.stop();
  BGM.stop();
  SceneAnim.stop();
  DialogAnim.hide(); CinemaFX.stop();

  setTimeout(() => {
    state = { genre:'',theme:'',chapter:1,choiceCount:0,history:[],sceneCount:0,isTyping:false,imageUrl:null,visualStyle:state.visualStyle,imageLoading:false,abortTyping:false,muted:state.muted,imgLayer:state.imgLayer };

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('start-screen').classList.add('active');
    document.getElementById('custom-theme').classList.add('hidden');
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('start-btn').disabled = true;
    document.getElementById('theme-input').value = '';

    // 重置图片层
    document.getElementById('img-layer-a').classList.remove('active');
    document.getElementById('img-layer-a').style.backgroundImage = '';
    document.getElementById('img-layer-b').classList.remove('active');
    document.getElementById('img-layer-b').style.backgroundImage = '';

    const si = document.getElementById('scene-image');
    KB.forEach(c => si.classList.remove(c));
    document.getElementById('particles').innerHTML = '';
    document.getElementById('scanlines').classList.add('hidden');

    // 重置对话动画状态
    DialogAnim.currentDialogs = [];
    DialogAnim.currentIdx = 0;

    selectedGenre = null;
    genreDesc = '';
  }, 50);
}

// ===== Share =====
function shareResult() {
  // 分享文本国际化
  const t = LANG.shareText.replace('{choices}', state.choiceCount).replace('{scenes}', state.sceneCount);
  if (navigator.share) {
    navigator.share({ title: `${LANG.title} ${LANG.version}`, text: t, url: location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(t + ' ' + location.href).then(() => alert(currentLang === 'en' ? 'Copied!' : '已复制！')).catch(() => {});
  }
}

// ===== Helpers =====
function showLoading() {
  const styleName = STYLES[state.visualStyle].label;
  // loading 文本国际化
  document.getElementById('loading-text').textContent = currentLang === 'en'
    ? `🎬 ${styleName} ${LANG.loading}`
    : `🎬 ${styleName}${LANG.loading}`;
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
  btn.textContent = currentLang === 'en' ? '🔄 Retry' : '🔄 重试';
  btn.onclick = () => { state.isTyping = false; state.history.pop(); requestScene(currentLang === 'en' ? 'Continue story' : '继续故事'); };
  c.appendChild(btn);
  state.isTyping = false;
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
