#!/usr/bin/env bun
// Markdown to static HTML for handover docs. Bun built-ins only, no packages, no network.
// Usage: bun build.ts <docs-dir> [out-dir] [--allow-missing]
//        bun build.ts --selftest
// Tested with Bun 1.3.14, self-test passes on 1.4.2. Bun.markdown is marked unstable upstream: run --selftest after a Bun update.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Meta = Record<string, string>;
type Page = { name: string; meta: Meta; html: string; flow: boolean };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) => s.replace(/`([^`]+)`/g, (_, c) => `<code>${esc(c)}</code>`);
const toHtmlLink = (s: string) => s.replace(/\.md(#|$)/, ".html$1");

export function frontMatter(text: string): { meta: Meta; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const meta: Meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: text.slice(m[0].length) };
}

// ```cards: one card per line, "Title | target.md | text | label". Target "-" makes a card without link.
function cardsHtml(src: string): string {
  const cards = src.split("\n").filter((l) => l.trim()).map((line) => {
    const [title, target, text = "", label = ""] = line.split("|").map((s) => s.trim());
    const inner = `${label ? `<span class="num">${esc(label)}</span>` : ""}<span class="title">${esc(title)}</span><span class="outcome">${inline(text)}</span>`;
    return target === "-" ? `<div class="card soon">${inner}</div>` : `<a class="card" href="${toHtmlLink(target)}">${inner}</a>`;
  });
  return `<div class="cards">${cards.join("")}</div>`;
}

// ```flow: JSON for assets/flow.js (nodes, scenarios). Invalid JSON stops the build.
function flowHtml(src: string): string {
  const json = JSON.stringify(JSON.parse(src)).replace(/</g, "\\u003c");
  return `<div class="flow"><div class="flow-buttons"></div><div class="flow-svg"></div><ol class="flow-steps"></ol><script type="application/json">${json}</script></div>`;
}

// {verified} or {verified: custom label} becomes a status chip. Code spans and blocks are left alone.
const CHIPS = "verified|inferred|unverified|partial|owner|high|medium|low|done";
const CHIP_LABELS: Record<string, string> = { verified: "Verified", inferred: "Inferred", unverified: "Unverified", partial: "Partial", owner: "Per owner", high: "High", medium: "Medium", low: "Low", done: "Done" };
function chips(html: string): string {
  const re = new RegExp(`\\{(${CHIPS})(?::\\s*([^}]+))?\\}`, "g");
  return html
    .split(/(<pre[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>)/)
    .map((seg, i) => (i % 2 ? seg : seg.replace(re, (_, k: string, label?: string) => `<span class="chip ${k}">${label ?? CHIP_LABELS[k]}</span>`)))
    .join("");
}

export function renderBody(body: string): { html: string; flow: boolean } {
  const blocks: string[] = [];
  let flow = false;
  const text = body.replace(/^```(flow|cards)\n([\s\S]*?)\n```$/gm, (_, kind: string, src: string) => {
    if (kind === "flow") flow = true;
    blocks.push(kind === "flow" ? flowHtml(src) : cardsHtml(src));
    return `@@BLOCK${blocks.length - 1}@@`;
  });
  let html: string = (Bun as any).markdown.html(text, { headings: { ids: true } });
  html = html.replace(/<p>@@BLOCK(\d+)@@<\/p>/g, (_, n) => blocks[Number(n)]);
  // > [!note] / [!warning] / [!status] callouts; [!source] becomes a single small source line
  html = html.replace(/<blockquote>\s*<p>\[!(note|warning|source|status)\]\s*([\s\S]*?)<\/blockquote>/g, (_, kind: string, rest: string) => {
    rest = rest.trim();
    if (kind === "source") return `<p class="src">${rest.slice(0, rest.indexOf("</p>"))}</p>`;
    const lead = rest.startsWith("</p>") ? rest.slice(4).trim() : `<p>${rest}`;
    const cls = kind === "status" ? "statusbox" : kind === "warning" ? "note warning" : "note";
    return `<div class="${cls}">${lead}</div>`;
  });
  html = chips(html);
  html = html.replace(/href="((?!https?:|mailto:|#)[^"]*?)\.md(#[^"]*)?"/g, 'href="$1.html$2"');
  html = html.replace(/<table>/g, '<div class="tablewrap"><table>').replace(/<\/table>/g, "</table></div>");
  return { html, flow };
}

export function renderPage(name: string, text: string): Page {
  const { meta, body } = frontMatter(text);
  const { html, flow } = renderBody(body);
  return { name, meta, html, flow };
}

export function assemble(page: Page, pages: Page[], status: string): string {
  const nav = [...pages]
    .sort((a, b) => Number(a.meta.order ?? 99) - Number(b.meta.order ?? 99) || a.name.localeCompare(b.name))
    .map((p) => `<a href="${p.name}.html"${p.name === page.name ? ' aria-current="page"' : ""}>${esc(p.meta.nav ?? p.meta.title ?? p.name)}</a>`)
    .join("");
  const summary = page.meta.summary ? `<div class="meta">${inline(page.meta.summary)}</div>` : "";
  const draft = page.name === "index" ? "" : `<p class="draft">Status: ${esc(status)}. Open points are on the <a href="index.html">start page</a>.</p>`;
  const heads = [...page.html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)];
  const toc = page.meta.toc === "true" && heads.length ? `<ol class="toc">${heads.map((h) => `<li><a href="#${h[1]}">${h[2]}</a></li>`).join("")}</ol>` : "";
  const body = page.html.replace("</h1>", `</h1>\n${summary}\n${draft}\n${toc}`);
  const main = page.meta.layout === "wide" ? '<main class="wide">' : "<main>";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.meta.title ?? page.name)}</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
${main}
<nav class="pkg" aria-label="Handover pages">${nav}</nav>
${body}
</main>
${page.flow ? '<script src="assets/flow.js"></script>\n' : ""}</body>
</html>
`;
}

// Every internal href must point to an existing page; every #anchor must exist in its target.
export function check(out: string, allowMissing: boolean): string[] {
  const files = readdirSync(out).filter((f) => f.endsWith(".html"));
  const ids = new Map(files.map((f) => [f, new Set([...readFileSync(join(out, f), "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
  const problems: string[] = [];
  for (const f of files) {
    for (const [, href] of readFileSync(join(out, f), "utf8").matchAll(/href="([^"]+)"/g)) {
      if (/^(https?:|mailto:)/.test(href)) continue;
      const [path, frag] = href.split("#");
      if (path && !path.endsWith(".html")) {
        if (!existsSync(join(out, path))) problems.push(`${f}: missing file ${href}`);
        continue;
      }
      const target = path || f;
      if (!ids.has(target)) {
        if (!allowMissing) problems.push(`${f}: missing page ${href}`);
        continue;
      }
      if (frag && !ids.get(target)!.has(frag)) problems.push(`${f}: missing anchor ${href}`);
    }
  }
  return problems;
}

function build(src: string, out: string, allowMissing: boolean): number {
  const here = import.meta.dir;
  const pages = readdirSync(src).filter((f) => f.endsWith(".md")).map((f) => renderPage(f.replace(/\.md$/, ""), readFileSync(join(src, f), "utf8")));
  if (!pages.some((p) => p.name === "index")) throw new Error(`${src}/index.md is missing`);
  const status = pages.find((p) => p.name === "index")!.meta.status ?? "Draft";
  mkdirSync(join(out, "assets"), { recursive: true });
  for (const f of ["style.css", "flow.js"]) copyFileSync(join(here, "..", "assets", f), join(out, "assets", f));
  for (const p of pages) writeFileSync(join(out, `${p.name}.html`), assemble(p, pages, status));
  const problems = check(out, allowMissing);
  problems.forEach((p) => console.error("BROKEN", p));
  console.log(`${pages.length} pages -> ${out}${problems.length ? `, ${problems.length} broken links` : ", links ok"}`);
  return problems.length ? 1 : 0;
}

function selftest(): number {
  const sample = [
    "# Title", "", 'A <span class="chip verified">Verified</span> chip and [link](other.md#part).', "",
    "| Host | Status |", "|---|---|", '| `vv-lb-01` | <span class="chip verified">Verified</span> |', "",
    "> [!note]", "> A callout.", "", "> [!source]", "> Source: x.", "",
    "```bash", "echo hi | tee log", "```", "",
    "```cards", "Runbooks | runbooks.md | Do things", "```", "",
    "```flow", '{"viewBox":"0 0 10 10","nodes":[],"scenarios":[]}', "```", "",
    "1. one", "   - nested", "2. two", "", "Status {verified} and {partial: Custom label}, but `{verified}` in code stays.", "", "## Second part",
  ].join("\n");
  const { html, flow } = renderBody(sample);
  const expect: [string, boolean][] = [
    ["table wrapped", html.includes('<div class="tablewrap"><table>')],
    ["chip kept in table", html.includes('<td><span class="chip verified">Verified</span></td>')],
    ["callout", html.includes('<div class="note"><p>A callout.</p></div>')],
    ["source line", html.includes('<p class="src">Source: x.</p>')],
    ["code language", html.includes('class="language-bash"')],
    ["cards", html.includes('<a class="card" href="runbooks.html">')],
    ["flow block", flow && html.includes('<div class="flow">')],
    ["link rewritten", html.includes('href="other.html#part"')],
    ["heading id", html.includes('<h2 id="second-part">')],
    ["nested list", html.includes("<li>nested</li>")],
    ["chip shortcode", html.includes('<span class="chip verified">Verified</span> and <span class="chip partial">Custom label</span>')],
    ["chip in code untouched", html.includes("<code>{verified}</code>")],
    ["toc", assemble({ name: "t", meta: { toc: "true" }, html, flow }, [], "Draft").includes('<ol class="toc"><li><a href="#second-part">Second part</a></li></ol>')],
  ];
  const failed = expect.filter(([, ok]) => !ok);
  failed.forEach(([name]) => console.error("SELFTEST FAIL", name));
  console.log(failed.length ? `selftest: ${failed.length} failed` : `selftest ok (Bun ${Bun.version})`);
  return failed.length ? 1 : 0;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith("--"));
  const pos = args.filter((a) => !a.startsWith("--"));
  if (flags.includes("--selftest")) process.exit(selftest());
  // No folder given: use ./docs when it holds an index.md, else the current folder.
  const src = pos[0] ?? (existsSync("docs/handover/index.md") ? "docs/handover" : existsSync("index.md") ? "." : "");
  if (!src) {
    console.error("error: no index.md found. Pass the docs folder, or run from the repository root or from inside docs/handover/.\nusage: bun build.ts [docs-dir] [out-dir] [--allow-missing] | --selftest");
    process.exit(2);
  }
  try {
    process.exit(build(src, pos[1] ?? join(src, "_site"), flags.includes("--allow-missing")));
  } catch (e) {
    console.error(`error: ${(e as Error).message}`);
    process.exit(2);
  }
}
