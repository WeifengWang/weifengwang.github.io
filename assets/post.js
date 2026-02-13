import { BLOG_CONFIG } from "./config.js";

const titleEl = document.getElementById("post-title");
const metaEl = document.getElementById("post-meta");
const contentEl = document.getElementById("post-content");
const commentsEl = document.getElementById("comments");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatDate(dateValue) {
  const date = normalizeDate(dateValue);
  if (!date) {
    return dateValue;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function normalizeTypeLabel(type) {
  if (type === "daily") {
    return "日常";
  }
  if (type === "thinking") {
    return "思考";
  }
  return "其他";
}

function getPathFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get("path");
  if (!path) {
    return null;
  }
  return path.replace(/^\/+/, "");
}

function stripFrontMatter(markdown) {
  const frontMatterPattern = /^---\n[\s\S]*?\n---\n?/;
  return markdown.replace(frontMatterPattern, "");
}

function ensureMarked() {
  if (!window.marked || typeof window.marked.parse !== "function") {
    throw new Error("Markdown 渲染器未加载，请刷新后重试。");
  }

  window.marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
  });

  return window.marked;
}

function readMainTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function hasUsableGiscusConfig(config) {
  const required = ["repo", "repoId", "category", "categoryId"];
  return required.every((key) => {
    const value = config[key];
    if (typeof value !== "string" || !value.trim()) {
      return false;
    }
    return !value.includes("YOUR_") && !value.includes("your-");
  });
}

function renderComments(path) {
  const giscus = BLOG_CONFIG.giscus;
  if (!giscus || !hasUsableGiscusConfig(giscus)) {
    commentsEl.innerHTML = `
      <p class="comment-hint">
        评论未启用。请在 <code>assets/config.js</code> 完成 Giscus 配置。
      </p>
    `;
    return;
  }

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", giscus.repo);
  script.setAttribute("data-repo-id", giscus.repoId);
  script.setAttribute("data-category", giscus.category);
  script.setAttribute("data-category-id", giscus.categoryId);
  script.setAttribute("data-mapping", giscus.mapping || "pathname");
  script.setAttribute("data-term", path);
  script.setAttribute("data-strict", giscus.strict || "0");
  script.setAttribute("data-reactions-enabled", giscus.reactionsEnabled || "1");
  script.setAttribute("data-emit-metadata", giscus.emitMetadata || "0");
  script.setAttribute("data-input-position", giscus.inputPosition || "top");
  script.setAttribute("data-theme", giscus.theme || "light");
  script.setAttribute("data-lang", giscus.lang || "zh-CN");
  script.setAttribute("data-loading", giscus.loading || "lazy");
  commentsEl.appendChild(script);
}

async function fetchPostMeta(path) {
  const response = await fetch("posts/index.json", { cache: "no-cache" });
  if (!response.ok) {
    return null;
  }
  const posts = await response.json();
  if (!Array.isArray(posts)) {
    return null;
  }
  return posts.find((post) => post.path === path) || null;
}

async function renderPost() {
  try {
    const path = getPathFromQuery();
    if (!path) {
      throw new Error("缺少文章路径参数。");
    }

    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`文章读取失败: ${response.status}`);
    }

    const rawMarkdown = await response.text();
    const markdown = stripFrontMatter(rawMarkdown);
    const meta = await fetchPostMeta(path);
    const marked = ensureMarked();

    const inferredTitle = readMainTitle(markdown);
    const title = meta?.title || inferredTitle || "未命名文章";
    const date = meta?.date ? formatDate(meta.date) : "未知日期";
    const type = normalizeTypeLabel(meta?.type || "other");

    titleEl.textContent = title;
    metaEl.textContent = `${date} · ${type}`;
    document.title = `${title} | ${BLOG_CONFIG.siteTitle}`;
    contentEl.innerHTML = marked.parse(markdown);

    renderComments(path);
  } catch (error) {
    titleEl.textContent = "文章加载失败";
    metaEl.textContent = "";
    contentEl.innerHTML = `<p>${escapeHtml(String(error.message || error))}</p>`;
    commentsEl.innerHTML = "";
  }
}

renderPost();
