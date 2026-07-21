# Memento（定格）变更记录

> 本文件记录 Memento 项目从初始化至今的每一次迭代与修改点，便于追溯产品演进。
> 仓库：https://github.com/yy0116237/memento-prototype（私有）
> 产物：`Memento PRD2.0.docx`（产品需求文档）、`memento_visual_prototype.html`（可视化原型）

---

## 2026-07-17 · 项目初始化与存档
- 创建 `Memento PRD2.0.docx`：产品需求文档（PRD 2.0）。
- 创建 `memento_visual_prototype.html`：可视化原型，含中 / 英 / 韩三语切换、灰蜡笔手绘质感 UI、情绪—色彩图例、历史时间线、记录详情弹窗（便利贴 + 背景模糊）、海报生成与保存等。
- 将 PRD 与原型上传至 GitHub 私有仓库 `yy0116237/memento-prototype`（README + PRD + 原型，共 3 个文件）。

## 2026-07-21 · 迭代一：空态 → 逐步填充逻辑
> 明确"新用户进入时页面为空，随用户记录行为逐渐被填满"的核心逻辑。

- **数据层重构**
  - 移除写死的 4 条示例数据，`RECORDS` 改为从 `localStorage['memento-records']` 读取（新用户默认空数组 → 空态；有记录则自动回填）。
  - 新增 `saveRecords()` 统一持久化，修复此前"保存成功但刷新后从不读回"的断链。
  - 示例数据提取为 `SAMPLE_DATA`，仅用于「加载示例数据」按钮，默认不出现。
- **示例数据更新**
  - 改为 TWICE 2026 首尔安可演唱会（2026.07.12），正文含 slogan：「这十一年来，谢谢九兔的陪伴，只要你们幸福就好，永远是九兔的 once， live once to love twice.」（中 / 英 / 韩）。
- **空态文案与样式**
  - 新增 i18n 文案（中 / 英 / 韩）：`emptyFeatured`、`emptyFeaturedSub`、`loadSample`、`emptyTimeline`、`legendHint`。
  - 新增空态 CSS：占位标题 / 副文案 / 加载示例按钮 / 提示 / 图例置灰。
  - 精选卡片新增 `cardEmpty` 占位元素。
- **区块渲染重写**
  - `renderFeatured`：空态显示引导占位 + 「加载示例数据」按钮；有记录时按日期倒序展示最新一条。
  - `renderTimeline`：空态提示「你去的每一场，都会出现在这里」；有记录时倒序（最新在上）。
  - `renderLegend`：点亮已使用情绪并计次（×n），未使用情绪保持灰色置灰 + 提示「记录后，这里会浮现你的情绪地图」。
  - 新增 `renderAll()` 统一重渲染数据区块，供加载示例调用。

## 2026-07-21 · 迭代二：本轮修改
- **记录表单默认内容 BTS → TWICE**
  - `DEMO_INFO`（记录表单预填默认值，被 `prefillForm` 与 `generatePoster` 兜底共用）由 BTS 2026 首尔演唱会，改为 **TWICE 2026 首尔安可演唱会 / 2026.07.12 / 场馆：首尔 KSPO DOME / 城市：首尔**，中 / 英 / 韩三语同步。
- **移除页面底部「原型说明」文字**
  - 删除 `.tip` 元素、`applyLang` 中的赋值行、`.tip` CSS 及三语 `tip` i18n 文案。
  - 该说明文字不再向用户展示，仅保留用于 PRD 文档的额外说明（待同步进 `Memento PRD2.0.docx`）。
- **新增变更记录文档**
  - 创建本文件 `CHANGELOG.md`，沉淀每次迭代，便于追溯改动了哪些方面。

## 2026-07-21 · 迭代三：AI 接入架构（Mock 跑通三触点）
> 明确 3 个 AI 触点与"先 Mock 零成本验证交互、后接免费 API"的落地路线；将来接真 AI 用云函数（Vercel / Cloudflare）中转，不暴露 Key、不触发 CORS。

- **统一 AI 适配层 `MementoAI`**
  - 新增 `USE_MOCK` 开关（当前 `true`=假数据，零成本零 Key）+ `AI_ENDPOINT` 占位（将来填云函数公网地址）。
  - 三触点统一入口：`searchShow(query,lang)`、`polishMurmur(text,lang)`、`posterText(record,lang)`；真 AI 分支已写好 `fetch` 占位，改开关即可切换。
- **触点1：搜索填表（演出名称/日期/场馆/城市）**
  - 新增搜索行（输入框 + "AI 填充"按钮），支持回车触发。
  - 输入关键词 → `MementoAI.searchShow` → 自动回填 `fShow/fDate/fVenue/fCity`。
  - Mock 命中库：`lesserafim` / `twice` / `bts`（各含中 / 英 / 韩三语）；未命中兜底填入 `DEMO_INFO` 示例并 Toast 提示。
  - 实验期搜索计划用 **Tavily 免费额度（1000 credits/月）**。
- **触点2：Murmur 随想模式 AI 润色 + 情绪识别**
  - Murmur 面板新增"✨ AI 帮改一下"按钮 → `MementoAI.polishMurmur` → 回填润色文本并自动点亮对应情绪色（按关键词简易判定 touched/funny/excited/calm/default）。
  - 实验期计划用 **Gemini 2.5 Flash 免费 API**。
- **触点3：生成海报 AI 金句 + 标签（文字版式，不出图）**
  - `generatePoster` 改为异步，生成时调用 `MementoAI.posterText` → 用 AI 金句覆盖正文层、用 AI 标签替换标签（失败则兜底本地朴素提取，不阻断生成）。
  - 用户确认选择 **(A) 文字版式**（AI 仅提炼金句与标签，不调用图像生成模型，成本可忽略）。
- **交互与体验**
  - 三处均加 loading/busy 禁用态 + 轻量 Toast 提示；新增对应 i18n（中 / 英 / 韩）文案与样式。

## 2026-07-21 · 迭代四：Murmur 模式双按钮（Keep This / Make a Note）
- **Murmur 写完后的两个选择按钮（文案固定英文，三语模式通用）**
  - 移除迭代三加在 Murmur 面板的「✨ AI 帮改一下」单按钮，以及海报内 note-bubble 的「原样保存 / 润色一下」。
  - Murmur 输入框下新增两个固定英文按钮：**Keep This** / **Make a Note**（不随语言切换，始终英文）。
  - **Keep This**：直接把用户写的原话存档为一条记录（`archiveMurmur`，使用表单的演出名/日期与所选情绪）。
  - **Make a Note**：调用 `MementoAI.polishMurmur`（触点2）对原话润色修改、识别并点亮情绪，再把润色后文字存档；AI 失败时兜底存原话。
  - 两按钮均带 loading/busy 禁用态，存档后 Toast 提示（三语）。
- **移除海报内 note-bubble**：其 Keep This / Make a Note 职责已并入 Murmur 面板；海报仅保留「保存为图片 / 保存记录 / 关闭」。

## 2026-07-21 · 迭代五：真 AI 云函数代码（Vercel，待部署切换）
> 选 **Vercel（Node 运行时）** 承载云函数，Key 仅存服务端环境变量，前端零暴露、不触发 CORS。三个路由已写好，部署并填 `AI_ENDPOINT` + 关 `USE_MOCK` 后即接真 AI。

- **云函数文件（仓库根 `api/`）**
  - `api/_lib.js`：共享库——CORS 头、`readBody`、封装 `callTavily`（触点1 联网搜索）、`callGemini`（Gemini 2.5 Flash，强制 JSON 输出）。
  - `api/search.js`：`GET /search?q=关键词` → Tavily 搜索结果 → Gemini 抽取 `{show, date, venue, city}`。
  - `api/polish.js`：`POST /polish` `{text, lang}` → Gemini 润色 + 情绪识别 `{polished, emotion}`。
  - `api/poster.js`：`POST /poster` `{show,date,venue,city,emo,details,lang}` → Gemini 金句 + 标签 `{line, tags}`。
  - `package.json`：声明 `node 20.x`，无第三方依赖（用 Node 内置 `fetch`）。
- **部署前置（待用户执行）**
  - 在 Vercel 新建项目关联本仓库，部署后得公网地址（如 `https://memento-ai.vercel.app`）。
  - 平台「Environment Variables」配置 `TAVILY_API_KEY`（tavily.com，每月 1000 credits 免费）、`GEMINI_API_KEY`（aistudio.google.com/apikey，2.5 Flash 免费层）。
- **切真 AI 步骤（待部署完成后）**
  - 原型 `MementoAI` 段：`AI_ENDPOINT` 指向公网地址；`USE_MOCK` 改 `false`。
  - 三触点即走真 Tavily/Gemini，UI 代码无需改动。

## 2026-07-21 · 迭代六：LLM 提供方由 Gemini 切换为 Groq（免费）
- **背景**：Gemini API 免费层取消，改用以 **Groq 免费 LLM（Llama 3.3 70B，免信用卡）** 承担三触点的「理解/生成」部分；`api/_lib.js` 中 `callGemini` 改为 `callLLM`（Groq `chat/completions`，`response_format: json_object` 强制 JSON）。
- **`api/search.js` / `polish.js` / `poster.js`**：调用由 `callGemini` 改为 `callLLM`（URL 编码/路由/入参不变）。
- **环境变量调整**：Vercel 侧把原计划的 `GEMINI_API_KEY` 换成 **`GROQ_API_KEY`**（Tavily 仍用 `TAVILY_API_KEY`）。Groq Key 在 https://console.groq.com/keys 免费领取。
- 触点1 联网搜索仍走 Tavily → 结果交给 Groq 抽取结构化字段；触点2 润色+情绪、触点3 金句+标签均由 Groq 完成。

---

### 待办 / 待确认
- [x] PRD 同步：`Memento PRD2.0.docx` 已追加附录 A（原型说明）与附录 B（AI 接入设计 + 迭代五补充 B.2 云函数部署）。
- [x] GitHub 推送：8/8 文件已用 fine-grained Token 经 Contents API 推至 `yy0116237/memento-prototype` 私有仓库（含原型/PRD/CHANGELOG/`api/`/`package.json`）。
- [ ] **接真 AI**：Vercel 已部署 → 在 Settings 配置 `TAVILY_API_KEY`（已设）+ `GROQ_API_KEY`（待设）→ Redeploy → 把公网地址发我，我改 `AI_ENDPOINT` 并关 `USE_MOCK`。
