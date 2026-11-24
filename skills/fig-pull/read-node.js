// Read-only use_figma script for fig-pull. Replace NODE_ID (e.g. '80:88894').
// Returns one line per layer with every property the build needs.
const root = await figma.getNodeByIdAsync('NODE_ID');
if (!root) return 'missing';
let page = root;
while (page && page.type !== 'PAGE') page = page.parent;
await figma.setCurrentPageAsync(page);

const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
const paints = arr => Array.isArray(arr)
  ? arr.filter(f => f.visible !== false).map(f => f.type === 'SOLID' ? hex(f.color) + (f.opacity !== undefined && f.opacity !== 1 ? '@' + Math.round(f.opacity * 100) / 100 : '') : f.type)
  : 'mixed';

const rows = ['page=' + page.name + ' id=' + page.id];
const walk = (n, d) => {
  const r = ['  '.repeat(d) + n.type + ' "' + n.name + '" id=' + n.id, 'xywh=' + [n.x, n.y, n.width, n.height].map(v => Math.round(v * 100) / 100).join(',')];
  if (n.visible === false) r.push('HIDDEN');
  if ('layoutMode' in n) r.push('layout=' + n.layoutMode);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    r.push('pad=' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join('/'), 'gap=' + n.itemSpacing, 'main=' + n.primaryAxisAlignItems, 'cross=' + n.counterAxisAlignItems, 'wrap=' + n.layoutWrap);
    if (n.layoutWrap === 'WRAP') r.push('rowGap=' + n.counterAxisSpacing);
  }
  if ('layoutSizingHorizontal' in n) r.push('W=' + n.layoutSizingHorizontal, 'H=' + n.layoutSizingVertical);
  if ('layoutPositioning' in n && n.layoutPositioning === 'ABSOLUTE') r.push('ABSOLUTE');
  if ('minWidth' in n && (n.minWidth || n.maxWidth || n.minHeight || n.maxHeight)) r.push('min/max=' + [n.minWidth, n.maxWidth, n.minHeight, n.maxHeight].join('/'));
  if ('clipsContent' in n) r.push('clip=' + n.clipsContent);
  if ('fills' in n && n.type !== 'TEXT') { const f = paints(n.fills); if (f.length) r.push('fill=' + f); }
  if ('strokes' in n && n.strokes.length) r.push('stroke=' + paints(n.strokes) + ' w=' + (n.strokeWeight === figma.mixed ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight].join('/') : n.strokeWeight) + ' align=' + n.strokeAlign);
  if ('cornerRadius' in n && n.cornerRadius) r.push('radius=' + (n.cornerRadius === figma.mixed ? [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius].join('/') : n.cornerRadius));
  if ('effects' in n && n.effects.length) r.push('effects=' + JSON.stringify(n.effects));
  if ('opacity' in n && n.opacity !== 1) r.push('opacity=' + n.opacity);
  if (n.type === 'TEXT') {
    r.push('text=' + JSON.stringify(n.characters), 'font=' + JSON.stringify(n.fontName), 'size=' + n.fontSize, 'lh=' + JSON.stringify(n.lineHeight), 'ls=' + JSON.stringify(n.letterSpacing), 'color=' + paints(n.fills), 'alignH=' + n.textAlignHorizontal, 'alignV=' + n.textAlignVertical, 'case=' + n.textCase, 'decoration=' + n.textDecoration, 'autoResize=' + n.textAutoResize, 'truncate=' + n.textTruncation);
  }
  rows.push(r.join(' '));
  if ('children' in n) n.children.forEach(c => walk(c, d + 1));
};
walk(root, 0);
return rows.join('\n');
