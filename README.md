# Max 的日常与思考

这是一个基于 GitHub Pages 的轻量博客仓库，目标是长期记录：

- `daily`：日常记录、项目进展、生活片段
- `thinking`：方法论、复盘、长期思考

## 已实现能力

- `README.md`：自我和博客定位介绍
- 文章使用 `Markdown` 撰写，并按 `年/月` 目录归档
- 首页按 `年/月` 自动分组展示文章（支持按类型筛选）
- 每篇文章页支持接入 GitHub Discussions 评论（Giscus）

## 目录结构

```text
.
├── assets
│   ├── archive.js
│   ├── config.js
│   ├── post.js
│   └── styles.css
├── posts
│   ├── 2026
│   │   └── 02
│   │       ├── 2026-02-13-daily-blog-setup.md
│   │       └── 2026-02-13-thinking-writing-system.md
│   ├── index.json
│   └── templates
│       ├── daily-template.md
│       └── thinking-template.md
├── scripts
│   └── generate-index.mjs
├── index.html
└── post.html
```

## 写作流程

1. 在 `posts/YYYY/MM/` 下新建一篇 `.md` 文章（可先复制模板）。
2. 文章头部填写 Front Matter：

```md
---
title: 文章标题
date: 2026-02-13
type: daily
summary: 一句话摘要
---
```

3. 运行索引生成脚本，刷新归档：

```bash
node scripts/generate-index.mjs
```

4. 提交并推送到 GitHub。

## 开启 GitHub Discussions 评论

1. 在 GitHub 仓库启用 Discussions。
2. 在 [Giscus](https://giscus.app/zh-CN) 页面选择当前仓库并生成配置。
3. 把生成的配置填写到 `assets/config.js` 的 `giscus` 字段：
   - `repo`
   - `repoId`
   - `category`
   - `categoryId`

配置完成后，每篇文章页面都会自动加载评论区。
