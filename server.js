/**
 * AI影游生成器 - 后端服务
 * 
 * 用法: node server.js
 * 
 * 环境变量:
 *   API_KEY    - 大模型 API Key（必填）
 *   API_BASE   - API 地址（默认 https://api.openai.com/v1）
 *   MODEL      - 模型名（默认 gpt-4o-mini）
 *   PORT       - 端口（默认 3000）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ===== 配置 =====
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || 'http://localhost:11434/v1';
const API_KEY = process.env.API_KEY || 'ollama';
const MODEL = process.env.MODEL || 'qwen2.5:7b';

// ===== 静态文件服务 =====
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
  filePath = path.join(__dirname, 'public', filePath);
  
  // 安全检查
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  
  // 如果 public 目录不存在，fallback 到根目录
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
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

// ===== 调用大模型 API =====
async function callLLM(messages) {
  if (!API_KEY) {
    throw new Error('未配置 API_KEY。请设置环境变量 API_KEY 后重启服务。');
  }

  const url = `${API_BASE}/chat/completions`;
  
  const body = {
    model: MODEL,
    messages: messages,
    temperature: 0.85,
    max_tokens: 800,
    top_p: 0.9,
  };

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
    throw new Error(`API 返回 ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ===== HTTP 服务器 =====
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API 路由
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

// ===== 启动 =====
server.listen(PORT, () => {
  console.log('');
  console.log('🎬 AI 影游生成器 已启动');
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   API:  ${API_BASE}`);
  console.log(`   模型: ${MODEL}`);
  console.log(`   Key:  ${API_KEY ? '已配置 ✅' : '❌ 未配置（请设置 API_KEY 环境变量）'}`);
  console.log('');
  
  if (!API_KEY) {
    console.log('⚠️  用法示例:');
    console.log(`   API_KEY=sk-xxx node server.js`);
    console.log(`   API_KEY=sk-xxx API_BASE=https://your-api.com/v1 MODEL=gpt-4o node server.js`);
    console.log('');
  }
});
