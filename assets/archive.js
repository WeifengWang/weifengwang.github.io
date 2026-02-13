import { BLOG_CONFIG } from "./config.js";

const state = {
  posts: [],
  filter: "all",
};

const archiveEl = document.getElementById("archive");
const filterButtons = Array.from(document.querySelectorAll(".filter"));

document.getElementById("site-title").textContent = BLOG_CONFIG.siteTitle;
document.getElementById("site-description").textContent = BLOG_CONFIG.siteDescription;
document.title = BLOG_CONFIG.siteTitle;

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

function formatArchiveKey(dateValue) {
  const date = normalizeDate(dateValue);
  if (!date) {
    return "未分类";
  }
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月`;
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

function renderArchive(posts) {
  if (!posts.length) {
    archiveEl.innerHTML = `
      <div class="empty-state">
        当前没有符合条件的文章。
      </div>
    `;
    return;
  }

  const groups = new Map();
  for (const post of posts) {
    const key = formatArchiveKey(post.date);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(post);
  }

  archiveEl.innerHTML = Array.from(groups.entries())
    .map(([month, items]) => {
      const list = items
        .map((post) => {
          const safeTitle = escapeHtml(post.title);
          const safeSummary = escapeHtml(post.summary || "");
          const safeDate = escapeHtml(formatDate(post.date));
          const safeType = escapeHtml(normalizeTypeLabel(post.type));
          const href = `post.html?path=${encodeURIComponent(post.path)}`;

          return `
            <li class="post-card">
              <a class="post-link" href="${href}">
                <div class="post-head">
                  <h3>${safeTitle}</h3>
                  <span class="post-type">${safeType}</span>
                </div>
                <p class="post-summary">${safeSummary}</p>
                <time>${safeDate}</time>
              </a>
            </li>
          `;
        })
        .join("");

      return `
        <section class="archive-group">
          <h2>${escapeHtml(month)}</h2>
          <ul>${list}</ul>
        </section>
      `;
    })
    .join("");
}

function render() {
  const posts =
    state.filter === "all"
      ? state.posts
      : state.posts.filter((post) => post.type === state.filter);

  renderArchive(posts);
}

function setActiveFilterButton(current) {
  for (const button of filterButtons) {
    button.classList.toggle("is-active", button.dataset.filter === current);
  }
}

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    const nextFilter = button.dataset.filter || "all";
    state.filter = nextFilter;
    setActiveFilterButton(nextFilter);
    render();
  });
}

async function loadPosts() {
  try {
    const response = await fetch("posts/index.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`文章索引加载失败: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("文章索引格式错误");
    }

    state.posts = data
      .map((post) => ({
        ...post,
        title: post.title || "未命名文章",
        summary: post.summary || "",
        type: post.type || "other",
      }))
      .sort((a, b) => {
        const aDate = normalizeDate(a.date);
        const bDate = normalizeDate(b.date);
        if (!aDate && !bDate) {
          return a.title.localeCompare(b.title, "zh-Hans-CN");
        }
        if (!aDate) {
          return 1;
        }
        if (!bDate) {
          return -1;
        }
        return bDate.getTime() - aDate.getTime();
      });

    render();
  } catch (error) {
    archiveEl.innerHTML = `<div class="empty-state">${escapeHtml(String(error.message || error))}</div>`;
  }
}

loadPosts();
