/**
 * AI影游生成器 - Vercel Serverless 适配
 */

const API_BASE = process.env.API_BASE || 'https://api.deepseek.com/v1';
const API_KEY = process.env.API_KEY || '';
const MODEL = process.env.MODEL || 'deepseek-chat';

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
    throw new Error(`API 返回 ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    try {
      const { messages } = req.body;
      const content = await callLLM(messages);
      return res.status(200).json({ content });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
