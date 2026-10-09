document.querySelectorAll('.flow').forEach(el => {
  const cfg = JSON.parse(el.querySelector('script[type="application/json"]').textContent);
  const ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => {
    const n = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };
  const nodes = Object.fromEntries(cfg.nodes.map(n => [n.id, n]));
  const anchor = (a, b) => {
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    const dx = b.x + b.w / 2 - cx, dy = b.y + b.h / 2 - cy;
    const s = Math.min(dx ? a.w / 2 / Math.abs(dx) : Infinity, dy ? a.h / 2 / Math.abs(dy) : Infinity);
    return [cx + dx * s, cy + dy * s];
  };

  const svg = mk('svg', { viewBox: cfg.viewBox, role: 'img', 'aria-label': cfg.label });
  const defs = mk('defs', {}, svg);
  ['', 'on', 'bad'].forEach(state => {
    const marker = mk('marker', { id: `arrow-${state || 'idle'}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, defs);
    mk('path', { d: 'M0 0L10 5L0 10z', class: `arrow ${state}` }, marker);
  });
  const setEdge = (e, state) => {
    e.setAttribute('class', `edge ${state}`);
    e.setAttribute('marker-end', `url(#arrow-${state || 'idle'})`);
  };

  const edgeKey = (a, b) => `${a}>${b}`;
  const edges = {};
  const addEdge = (a, b) => {
    const k = edgeKey(a, b);
    if (edges[k]) return;
    const [x1, y1] = anchor(nodes[a], nodes[b]);
    const [x2, y2] = anchor(nodes[b], nodes[a]);
    edges[k] = mk('line', { x1, y1, x2, y2 }, svg);
    setEdge(edges[k], '');
  };
  cfg.scenarios.forEach(s => s.path.slice(1).forEach((id, i) => addEdge(s.path[i], id)));

  const nodeEls = {};
  cfg.nodes.forEach(n => {
    const g = mk('g', { class: `node ${n.kind || ''}` }, svg);
    mk('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 4 }, g);
    const t = mk('text', { x: n.x + n.w / 2, y: n.y + (n.sub ? n.h / 2 - 3 : n.h / 2 + 4), 'text-anchor': 'middle' }, g);
    t.textContent = n.label;
    if (n.sub) {
      const u = mk('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 + 12, 'text-anchor': 'middle', class: 'sub' }, g);
      u.textContent = n.sub;
    }
    nodeEls[n.id] = g;
  });

  const buttons = el.querySelector('.flow-buttons');
  const steps = el.querySelector('.flow-steps');
  el.querySelector('.flow-svg').appendChild(svg);
  let timers = [];

  const reset = () => {
    timers.forEach(clearTimeout);
    timers = [];
    Object.values(edges).forEach(e => setEdge(e, ''));
    Object.values(nodeEls).forEach(g => g.classList.remove('on', 'bad'));
  };

  const play = (s, btn) => {
    reset();
    buttons.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b === btn));
    steps.innerHTML = '';
    s.steps.forEach(txt => {
      const li = document.createElement('li');
      li.textContent = txt;
      li.className = 'pending';
      steps.appendChild(li);
    });
    const cls = s.bad ? 'bad' : 'on';
    s.path.forEach((id, i) => timers.push(setTimeout(() => {
      if (i > 0) setEdge(edges[edgeKey(s.path[i - 1], id)], cls);
      nodeEls[id].classList.add(i === s.path.length - 1 ? cls : 'on');
      steps.children[i].className = 'done';
    }, i * 500)));
  };

  cfg.scenarios.forEach((s, i) => {
    const b = document.createElement('button');
    b.textContent = s.title;
    b.addEventListener('click', () => play(s, b));
    buttons.appendChild(b);
    if (i === 0) play(s, b);
  });
});
