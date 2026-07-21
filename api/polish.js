// 触点2：Murmur 润色 + 情绪识别  POST /polish  body: {text, lang}
const { send, readBody, callGemini } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'METHOD' });
  let body;
  try { body = JSON.parse(await readBody(req) || '{}'); } catch { return send(res, 400, { error: 'BAD_JSON' }); }

  const text = (body.text || '').trim();
  const lang = body.lang || 'zh';
  if (!text) return send(res, 400, { error: 'EMPTY' });

  const sys = `你是温柔细腻的演出随想润色助手。把用户写下的现场感受润色得更优美、有画面感，
保持原意与真诚，不要过度修饰或虚构。同时判断其情绪，从 touched/funny/excited/calm/default 中选一。
只返回 JSON：{"polished": 润色后文字, "emotion": 情绪key}。不要输出 JSON 之外内容。`;
  try {
    const data = await callGemini(sys, '语言偏好：' + lang + '\n原文：\n' + text);
    send(res, 200, { polished: data.polished || text, emotion: data.emotion || 'default' });
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
};
