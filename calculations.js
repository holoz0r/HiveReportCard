export function cleanTextForReadability(text) {
  if (!text) return '';

  let cleaned = text;
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ');
  cleaned = cleaned.replace(/\bhttps?:\/\/\S+/g, ' ');
  cleaned = cleaned.replace(/\bwww\.\S+/g, ' ');
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/`[^`]+`/g, ' ');
  cleaned = cleaned.replace(/^[\-*_]{3,}\s*$/gm, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function getWordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  
  const words = text.trim().split(/\s+/);
  return words.length;
}


export function getImageCount(text) {
  if (!text) return 0;
  const count = (text.match(/\.(jpg|jpeg|png|gif|webp|webm|tiff|bmp|svg)/gi) || []).length/2;
  return Math.ceil(count);
}


function countSyllablesInWord(w) {
  w = (w || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/e$/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

export function countSyllables(text) {
  if (!text) return 1;
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  let s = 0;
  for (const w of words) s += countSyllablesInWord(w);
  return Math.max(1, s);
}

export function countSentences(text) {
  if (!text) return 1;
  const parts = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  return Math.max(1, parts.length);
}

export function groupReadability(score) {
  if (score >= 90) return 'Elementary';
  if (score >= 80) return 'Middle School';
  if (score >= 70) return 'High School';
  if (score >= 60) return 'College';
  if (score >= 50) return 'University';
  if (score >= 30) return 'Post-Graduate';
  return 'Professional';
}

export function getReadability(text) {
  if (!text) return { score: 0, grade: 0, explainer: 'Professional' };
  const words = Math.max(1, getWordCount(text));
  const syllables = Math.max(1, countSyllables(text));
  const sentences = Math.max(1, countSentences(text));
  const flesch = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  const grade = Math.round((0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59);
  const explainer = groupReadability(flesch);

  return { score: Number(flesch.toFixed(2)), grade, explainer };
}

export function getImageWordRatio(imageCount, wordCount) {
  if (wordCount === 0) return imageCount > 0 ? 'Image-only' : 'Empty';
  if (imageCount === 0) return 'Text-only';

  const ratio = wordCount / imageCount;
  if (ratio < 50) return 'Image-heavy';
  if (ratio < 200) return 'Balanced';
  return 'Text-heavy';
}

export function enrichPosts(posts) {
  const out = posts.map(item => {
    const c = item.comment || {};
    const body = c.body || '';
    const cleanedBody = cleanTextForReadability(body);
    const wc = getWordCount(body);
    const ic = getImageCount(body);
    const r = getReadability(cleanedBody);
    const replies = c.children || 0;
    const created = c.created || item.created || new Date().toISOString();
    const contentType = getImageWordRatio(ic, wc);

    return {
      author: c.author,
      permlink: c.permlink,
      title: c.title || '',
      created,
      dateObj: new Date(created),
      dateISO: new Date(created).toISOString(),
      body,
      wordCount: wc,
      imageCount: ic,
      readability: r,
      replies: replies,
      contentType: contentType
    };
  });
  out.sort((a, b) => new Date(b.created) - new Date(a.created));
  return out;
}
