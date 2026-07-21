// Memento AI · Vercel Node 云函数共享库
// 作用：藏 Key（TAVILY_API_KEY / GEMINI_API_KEY 仅存服务端环境变量）、CORS、调用封装
const TAVILY_KEY = process.env.TAVILY_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(JSON.stringify(data));
}

// 读取请求体（Vercel Node 运行时里 req.body 为字符串或流，统一处理）
function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'string') return resolve(req.body);
    if (req.body) return resolve(JSON.stringify(req.body));
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

// 触点1 用：Tavily 联网搜索，返回拼接的片段文本
async function callTavily(query) {
  if (!TAVILY_KEY) throw new Error('NO_TAVILY_KEY');
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: TAVILY_KEY, query, max_results: 6, search_depth: 'basic' }),
  });
  if (!r.ok) throw new Error('TAVILY_ERR ' + r.status);
  const j = await r.json();
  return (j.results || []).map((x) => (x.title || '') + '\n' + (x.content || '')).join('\n\n');
}

// 通用：Gemini 2.5 Flash，要求 JSON 输出
async function callGemini(system, prompt) {
  if (!GEMINI_KEY) throw new Error('NO_GEMINI_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('GEMINI_ERR ' + r.status);
  const j = await r.json();
  const txt = j.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

module.exports = { CORS, send, readBody, callTavily, callGemini };
