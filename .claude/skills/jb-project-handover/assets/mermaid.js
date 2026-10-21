// Renders ```mermaid blocks in the browser and enlarges a diagram in a <dialog> on click.
// Mermaid is loaded from a CDN (classic script + dynamic import, so it also works from file://).
(async () => {
  const cfg = JSON.parse(document.getElementById("mermaid-config").textContent);
  const blocks = [...document.querySelectorAll("pre > code.language-mermaid")];
  let mermaid;
  try {
    ({ default: mermaid } = await import(`https://cdn.jsdelivr.net/npm/mermaid@${cfg.version}/dist/mermaid.esm.min.mjs`));
  } catch {
    return; // offline: the diagram source stays visible as a code block
  }
  if (cfg.background) document.documentElement.style.setProperty("--mermaid-bg", cfg.background);
  for (const code of blocks) {
    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.title = "Click to enlarge";
    pre.textContent = code.textContent;
    code.parentElement.replaceWith(pre);
  }
  mermaid.initialize({ ...cfg.mermaid, startOnLoad: false });
  await mermaid.run().catch(console.error); // one broken diagram must not disable the zoom on the others
  const dlg = document.createElement("dialog");
  dlg.className = "mermaid-zoom";
  dlg.addEventListener("click", () => dlg.close());
  document.body.append(dlg);
  document.querySelectorAll("pre.mermaid").forEach((pre) =>
    pre.addEventListener("click", () => {
      const svg = pre.querySelector("svg")?.cloneNode(true);
      if (!svg) return;
      svg.removeAttribute("style");
      dlg.replaceChildren(svg);
      dlg.showModal();
    }),
  );
})();
