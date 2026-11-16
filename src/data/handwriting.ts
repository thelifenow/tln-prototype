/** A drawn "photo" of a handwritten page, so the photo scenario works without a camera. */
export const HANDWRITING_LINES = [
  'Monday',
  '- Call Mom back',
  '- Box up the garage shelves',
  '- Email the printer about the proof',
  '- Outline TMKS week 6 notes',
  '- Pay the water bill',
  '- Idea: TLN podcast??',
];

export function handwritingImage(): string {
  const lines = HANDWRITING_LINES.map((l, i) => {
    const y = 92 + i * 52;
    const rot = ((i % 3) - 1) * 0.6;
    const size = i === 0 ? 34 : 27;
    return `<text x="${i === 0 ? 64 : 58}" y="${y}" transform="rotate(${rot} 60 ${y})" font-size="${size}" fill="#24304a" font-family="'Segoe Print','Bradley Hand','Comic Sans MS','Chalkboard SE',cursive">${l.replace(/&/g, '&amp;')}</text>`;
  }).join('');
  const rules = Array.from({ length: 9 }, (_, i) => `<line x1="0" x2="600" y1="${100 + i * 52}" y2="${100 + i * 52}" stroke="#b9cbe0" stroke-width="1.5"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="520" viewBox="0 0 600 520"><rect width="600" height="520" fill="#fdfbf2"/>${rules}<line x1="44" x2="44" y1="0" y2="520" stroke="#e7a3a3" stroke-width="2"/><g transform="rotate(-1.2 300 260)">${lines}<path d="M420 400 q30 -20 60 0" stroke="#24304a" stroke-width="2" fill="none"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
