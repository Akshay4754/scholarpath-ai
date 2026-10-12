export function chunkText(text, chunkSize = 1200, overlap = 180) {
  if (!Number.isInteger(chunkSize) || chunkSize < 100) throw new Error('chunkSize must be an integer >= 100');
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) throw new Error('overlap must be an integer >= 0 and less than chunkSize');
  const clean = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];
  const chunks = []; let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf('\n', end); const space = clean.lastIndexOf(' ', end); const cut = Math.max(boundary, space);
      if (cut > start + chunkSize * 0.55) end = cut;
    }
    const part = clean.slice(start, end).trim(); if (part) chunks.push({ text: part, start, end });
    if (end >= clean.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}
