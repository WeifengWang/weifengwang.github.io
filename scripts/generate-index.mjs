import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, "posts");
const OUTPUT_FILE = path.join(POSTS_DIR, "index.json");

const POST_PATH_PATTERN = /^posts\/\d{4}\/\d{2}\/.+\.md$/;
const FRONT_MATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/;

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function parseFrontMatter(raw) {
  const match = raw.match(FRONT_MATTER_PATTERN);
  if (!match) {
    return { data: {}, body: raw };
  }

  const data = {};
  const block = match[1];
  for (const line of block.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator < 0) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  const body = raw.slice(match[0].length);
  return { data, body };
}

function extractTitleFromBody(markdownBody) {
  const match = markdownBody.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "未命名文章";
}

function extractSummaryFromBody(markdownBody) {
  const lines = markdownBody
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("```"));
  if (!lines.length) {
    return "";
  }
  return lines[0].slice(0, 120);
}

function normalizeDate(rawDate) {
  if (typeof rawDate !== "string") {
    return null;
  }
  const value = rawDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  return value;
}

async function walkMarkdownFiles(currentDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(fullPath)));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function comparePosts(a, b) {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  return a.title.localeCompare(b.title, "zh-Hans-CN");
}

async function main() {
  const markdownFiles = await walkMarkdownFiles(POSTS_DIR);
  const posts = [];

  for (const file of markdownFiles) {
    const relativePath = toPosixPath(path.relative(ROOT_DIR, file));
    if (!POST_PATH_PATTERN.test(relativePath)) {
      continue;
    }

    const raw = await fs.readFile(file, "utf8");
    const { data, body } = parseFrontMatter(raw);
    const title = data.title || extractTitleFromBody(body);
    const date = normalizeDate(data.date);
    const type = data.type || "other";
    const summary = data.summary || extractSummaryFromBody(body);

    if (!date) {
      throw new Error(`文章缺少合法 date (YYYY-MM-DD): ${relativePath}`);
    }

    posts.push({
      title,
      date,
      type,
      summary,
      path: relativePath,
    });
  }

  posts.sort(comparePosts);
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  console.log(`Generated ${posts.length} posts -> ${toPosixPath(path.relative(ROOT_DIR, OUTPUT_FILE))}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
