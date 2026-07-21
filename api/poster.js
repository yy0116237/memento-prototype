// 触点3：海报金句 + 标签  POST /poster  body: {show, date, venue, city, emo, details, lang}
const { send, readBody, callLLM } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'METHOD' });
  let body;
  try { body = JSON.parse(await readBody(req) || '{}'); } catch { return send(res, 400, { error: 'BAD_JSON' }); }

  const { show, date, venue, city, emo, details, lang } = body || {};
  const sys = `你是演出海报文案助手。根据演出信息，写一句适合做海报主视觉的简短金句（≤30字，有情绪），
并给出 2-4 个标签（每个以 # 开头）。只返回 JSON：{"line": 金句, "tags": [标签...]}。
不要输出 JSON 之外内容。`;
  try {
    const data = await callLLM(sys, JSON.stringify({ show, date, venue, city, emo, details, lang }));
    const tags = Array.isArray(data.tags) ? data.tags : [];
    send(res, 200, { line: data.line || '', tags });
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
};
