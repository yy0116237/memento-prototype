# Memento「定格」· 演出记录

> 一款 AI 访谈式演唱会回忆录工具：把转瞬即逝的演出现场，定格成一张可收藏、可分享的手写纪念海报。  
> Slogan：定格，将转瞬即逝的演出现场可视化。

[EN] [中] [한국어]

---

## ① 我们在解决什么问题？

K-pop 粉丝看完演唱会后，大量珍贵的现场记忆（现场惊喜、邻座互动、散场单曲）随时间消散。

具体痛点（分两类，诚实标注来源）：

| #  | 痛点                    
| -- | --------------------- 
| P1 | 看完不知道从何写起，最后只憋出"好开心" 
| P2 | 现有工具要手动填演出名/日期/场馆，太麻烦  
| P3 | 写完还要排版 / P 图才能分享     
| P4 | 缺乏统一留存的记录工具          
| P5 | 多场记录散落各处、无法检索         
......
---

## ② 为什么这个问题值得做？

- **用户价值高**：K-pop 粉丝情感投入与消费力极强，现场体验不可复现、高度个人化，值得被"定格"。
- **场景真实**：散场路上掏出手机——情绪高涨但身体疲惫，想记录却不想写长篇。
- **差异化清晰**：三个核心摩擦，各有对应解法，而非换个皮的工具。

| 竞品痛点        | Memento 的解法                  |
| ----------- | ---------------------------- |
| 需手动填写演出信息   | LLM 搜索自动填充 + 静默降级手动表单        |
| 不知从何写起      | Snap（对话引导）+ Murmur（自由碎碎念）双模式 |
| 写完要排版 / P 图 | AI 自动整理标签润色 + 一键导出高清海报       |

- **可低成本验证**：纯前端 + 免费 AI 额度，5–10 名真实用户即可跑通验证闭环。

---

## ③ 项目的边界与限制？

**技术边界：**

- 纯前端（HTML + CSS + Vanilla JS），零后端，数据存 `localStorage`
- 演出信息用「LLM 搜索兜底 + 手动表单降级」，不接外部搜索 API（SerpAPI / Wikipedia）
- AI 调用走 **Vercel 云函数中继**，API Key 藏服务端环境变量，前端零暴露、不触发 CORS
- 三语 i18n 骨架（中 / 英 / 韩），但 **AI 输出英文优先**，韩文版 UI 也输出英文

**验证边界：**

- 5–10 名真实用户（3 名 K-pop + 3 名其他类型），移动端场景

---

## ④产品如何工作

```
输入组合名 + 城市 + 年份 → 搜索
        ↓
LLM 返回演出信息 → 用户确认（失败 → 静默降级手动表单）
        ↓
选择模式：
  ├─ Snap：Q1→Q2→Q3→Q4（可"换一个"）→ 生成
  └─ Murmur：自由输入 → 生成
        ↓
LLM 一次调用：标签提取 + 情绪判断 + 润色
        ↓
预览 + 点按编辑 → 保存图片 → 存入本地历史列表
```

**核心功能**

- **演出信息初始化**：LLM 搜索自动填充，失败静默降级手动表单
- **双模式输入**：Snap（对话式引导）/ Murmur（自由碎碎念）
- **海报生成**：四层结构（身份层 → 事实层 → 标签层 → 细节层），手写笔记质感
- **点按编辑 + 一键导出**：`contenteditable` 编辑 + `html2canvas` 高清 PNG
- **历史记录**：底部简化列表，按日期倒序，可回顾可删除
- **三语切换**：EN / 中文 / 한국어

---

## ⑤技术栈 & AI 接入

| 模块    | 方案                                                                  |
| ----- | ------------------------------------------------------------------- |
| 前端    | 纯 HTML + CSS + Vanilla JS（无构建工具）                                    |
| AI 接口 | 统一抽象层 `MementoAI`，三个方法：`searchShow` / `polishMurmur` / `posterText` |
| 搜索    | Tavily 联网搜索 + LLM 结构化解析                                             |
| 润色/情绪 | Gemini 2.5 Flash（免费层）                                               |
| 海报导出  | html2canvas（scale: 2）                                               |
| 数据存储  | localStorage（纯前端，零后端）                                               |
| 部署    | Vercel（云函数藏 Key，自动 HTTPS）                                           |

**三个 AI 触点**

1. **搜索填表**：`GET /search` → Tavily 搜索 + Gemini 抽取 `{show, date, venue, city}`
2. **Murmur 润色**：`POST /polish` → Gemini 润色 + 情绪识别 `{polished, emotion}`
3. **海报生成**：`POST /poster` → Gemini 提炼金句 + 标签 `{line, tags}`

**费用**：实验期 ≈ $0/月（Tavily 免费额度 + Gemini 2.5 Flash 免费层）。

---

## 快速开始

直接用浏览器打开 `memento_visual_prototype.html`（需联网加载 CDN 字体 / html2canvas）。

接入真实 AI：

1. 部署 Vercel 云函数（`api/` 目录），配置 `TAVILY_API_KEY`、`GEMINI_API_KEY`
2. 原型中把 `USE_MOCK` 改为 `false`，`AI_ENDPOINT` 指向云函数公网地址

## 目录结构

```
memento-prototype/
├── README.md                      # 本文档
├── Memento PRD2.0.docx            # 产品需求文档（完整版）
├── memento_visual_prototype.html  # 可视化原型（单文件）
├── CHANGELOG.md                    # 变更记录
├── api/                           # Vercel 云函数（AI 中继）
│   ├── _lib.js                    # CORS / readBody / callTavily / callGemini
│   ├── search.js                  # 演出搜索
│   ├── polish.js                  # 润色 + 情绪
│   └── poster.js                  # 金句 + 标签
└── package.json
```

##  页面预览图
<img width="552" height="756" alt="1" src="https://github.com/user-attachments/assets/8db9b1ae-aae0-4241-9d3b-a99b505ad733" />
snap:
<img width="573" height="662" alt="2" src="https://github.com/user-attachments/assets/e0ac2142-4513-4a22-a4dd-19b64910ca6b" />
murmur:
<img width="564" height="813" alt="3" src="https://github.com/user-attachments/assets/1f7d1a1e-0c76-45d9-b17f-e126956dda22" />

导出海报预览<img width="741" height="723" alt="导出海报demo" src="https://github.com/user-attachments/assets/7890cba1-8be8-43a9-bd82-5ce1961277a7" />


