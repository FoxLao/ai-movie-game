/**
 * 华夏锋彩 1.8 - 后端服务
 * + TTS 语音代理
 * + 图片缓存代理
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || 'https://api.deepseek.com/v1';
const API_KEY = process.env.API_KEY || '';
const MODEL = process.env.MODEL || 'deepseek-chat';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

// ===== 图片缓存 =====
const imgCache = new Map();
const IMG_CACHE_MAX = 30;

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];
  filePath = path.join(__dirname, filePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    // 静态资源 - HTML 不缓存，JS/CSS 短缓存
    const cacheHeaders = ext === '.html'
      ? { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      : { 'Cache-Control': 'public, max-age=300' };
    res.writeHead(200, {
      'Content-Type': contentType,
      ...cacheHeaders,
    });
    res.end(data);
  });
}

// ===== 调用大模型 =====
async function callLLM(messages) {
  if (!API_KEY) throw new Error('未配置 API_KEY');

  const url = `${API_BASE}/chat/completions`;
  const body = { model: MODEL, messages, temperature: 0.85, max_tokens: 800, top_p: 0.9 };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ===== 图片代理（解决跨域 + 缓存） =====
async function proxyImage(req, res) {
  const urlStr = decodeURIComponent(req.url.replace('/api/image?url=', ''));
  if (!urlStr) {
    res.writeHead(400);
    return res.end('Missing url');
  }

  // 缓存检查
  if (imgCache.has(urlStr)) {
    const cached = imgCache.get(urlStr);
    res.writeHead(200, {
      'Content-Type': cached.type || 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'HIT',
    });
    return res.end(cached.data);
  }

  try {
    const r = await fetch(urlStr);
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const type = r.headers.get('content-type') || 'image/png';

    // 存缓存
    if (imgCache.size >= IMG_CACHE_MAX) {
      const firstKey = imgCache.keys().next().value;
      imgCache.delete(firstKey);
    }
    imgCache.set(urlStr, { data: buf, type });

    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    });
    res.end(buf);
  } catch (err) {
    res.writeHead(502);
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ===== HTTP 服务器 =====
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 健康检查
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', model: MODEL, version: '1.8' }));
  }

  // 图片代理
  if (req.method === 'GET' && req.url.startsWith('/api/image?url=')) {
    return proxyImage(req, res);
  }

  // 故事 API
  if (req.method === 'POST' && req.url === '/api/story') {
    try {
      const body = await readBody(req);
      const { messages } = JSON.parse(body);
      const content = await callLLM(messages);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content }));
    } catch (err) {
      console.error('[API Error]', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 静态文件
  serveStatic(req, res);
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 华夏锋彩 1.8 已启动 PORT=${PORT} MODEL=${MODEL}`);
});
