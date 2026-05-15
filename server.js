/**
 * 华夏锋彩 1.8 - 后端服务
 * 图片代理 + LRU缓存 + 失败重试
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
};

// ===== LRU Cache =====
const imgCache = new Map();
const MAX_CACHE = 150;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12h

function getCached(key) {
  const e = imgCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { imgCache.delete(key); return null; }
  imgCache.delete(key);
  imgCache.set(key, e);
  return e;
}

function setCache(key, buf, ct) {
  if (imgCache.size >= MAX_CACHE) {
    const first = imgCache.keys().next().value;
    imgCache.delete(first);
  }
  imgCache.set(key, { buf, ct, ts: Date.now() });
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];
  filePath = path.join(__dirname, filePath);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not Found'); }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
  });
}

async function callLLM(messages) {
  if (!API_KEY) throw new Error('未配置 API_KEY');
  const url = `${API_BASE}/chat/completions`;
  const body = { model: MODEL, messages, temperature: 0.85, max_tokens: 800, top_p: 0.9 };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// ===== Image Proxy with retry =====
async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(30000 + i * 15000), // 30s → 45s → 60s
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      if (i === retries) throw e;
      console.log(`[Image Proxy] Retry ${i+1}/${retries} for ${url.slice(0,80)}...`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function proxyImage(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const targetUrl = u.searchParams.get('url');
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'missing url' }));
  }

  const cacheKey = crypto.createHash('md5').update(targetUrl).digest('hex');
  const cached = getCached(cacheKey);
  if (cached) {
    res.writeHead(200, {
      'Content-Type': cached.ct,
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'HIT',
    });
    return res.end(cached.buf);
  }

  try {
    const r = await fetchWithRetry(targetUrl, 2);
    const ct = r.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await r.arrayBuffer());
    setCache(cacheKey, buf, ct);
    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    });
    res.end(buf);
  } catch (err) {
    console.error('[Image Proxy Error]', err.message);
    // 返回 1x1 透明 PNG 作为降级，避免前端 img.onerror 不触发
    const PNG1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache',
      'X-Image-Error': 'true',
    });
    res.end(PNG1x1);
  }
}

// ===== Server =====
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', model: MODEL, cacheSize: imgCache.size }));
  }

  if (req.method === 'GET' && req.url.startsWith('/api/image')) {
    return proxyImage(req, res);
  }

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
  console.log(`🎬 华夏锋彩1.8 已启动 PORT=${PORT} MODEL=${MODEL}`);
});
