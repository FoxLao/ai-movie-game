/**
 * AI影游生成器 - 后端服务（Railway 兼容版）
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
};

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // 去掉查询参数
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
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

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

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 健康检查（Railway 需要）
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', model: MODEL }));
  }

  // API
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
  console.log(`🎬 AI影游已启动 PORT=${PORT} MODEL=${MODEL}`);
});
