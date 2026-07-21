// Memento AI · Vercel Node 云函数共享库
// 作用：藏 Key（TAVILY_API_KEY / GEMINI_API_KEY 仅存服务端环境变量）、CORS、调用封装
const TAVILY_KEY = process.env.TAVILY_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';  // 免费层；要更快可换 llama-3.1-8b-instant

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

// 通用：Groq 免费 LLM（Llama 3.3 70B），强制 JSON 输出
async function callLLM(system, prompt) {
  if (!GROQ_KEY) throw new Error('NO_GROQ_KEY');
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('GROQ_ERR ' + r.status);
  const j = await r.json();
  const txt = j.choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

module.exports = { CORS, send, readBody, callTavily, callLLM };
