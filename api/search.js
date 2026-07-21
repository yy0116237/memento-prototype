// 触点1：演出搜索填充  GET /search?q=关键词
// 流程：Tavily 联网搜索 → Gemini 抽取结构化字段（show/date/venue/city）
const { send, callTavily, callLLM } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    const url = new URL(req.url, 'http://x');
    const q = url.searchParams.get('q') || '';
    if (!q) return send(res, 400, { error: 'EMPTY' });

    const snippets = await callTavily(q);
    const sys = `你是演出信息提取助手。根据提供的网络搜索片段，提取演唱会/演出的准确信息。
只返回 JSON：{"show": 演出全称, "date": "YYYY.MM.DD 或 YYYY.MM", "venue": 场馆名, "city": 城市}。
若某项信息不足，尽力推断或留空字符串。不要输出 JSON 之外的任何内容。`;
    const data = await callLLM(sys, '搜索片段：\n' + snippets + '\n\n用户查询：' + q);

    send(res, 200, {
      show: data.show || '',
      date: data.date || '',
      venue: data.venue || '',
      city: data.city || '',
    });
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
};
