
/**
 * Stop words for vocabulary analysis 
 */
const VOCAB_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'no', 'just', 'him', 'know',
  'into', 'your', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'only', 'come', 'its', 'over', 'also', 'back', 'after', 'use',
  'how', 'our', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'most', 'us', 'is', 'was', 'are', 'been', 'has',
  'had', 'were', 'said', 'did', 'having', 'may', 'am', 'being',
  // Common contractions and auxiliaries
  "i'm", "you're", "we're", "they're", "it's", "that's", "don't", "doesn't",
  "didn't", "isn't", "aren't", "wasn't", "weren't", "won't", "wouldn't",
  "can't", "couldn't", "shouldn't", "i've", "we've", "they've", "you've",
  "i'll", "you'll", "he'll", "she'll", "we'll", "they'll", "let's", 'nbsp'
]);

/**
 * Extract words from text for vocabulary analysis (robust cleaning)
 * Excludes HTML, Markdown elements, URLs, and code snippets.
 * @param {string} text - Text to analyze
 */
function extractVocabularyWords(text) {
  if (!text) return [];

  let cleaned = text;

  cleaned = cleaned.replace(/<[^>]*>/g, ' ');


  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, ' ');
  cleaned = cleaned.replace(/www\.[^\s]+/g, ' ');


  cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]+\)/g, ' '); // Markdown images
  cleaned = cleaned.replace(/\[.*?\]\(.*?\)/g, ' ');      // Markdown links (leaving only the link text might be better, but removing all is safer for vocab)
  cleaned = cleaned.replace(/([#*~_`]{1,3})/g, ' ');       // Common Markdown symbols (#, *, ~, _, `)

 
  return cleaned
    .toLowerCase()
    .trim()

    .split(/[^a-z’'-]+/)

    .map(word => word.replace(/^[^a-z']+|[^a-z']+$/g, ''))

    .filter(word => word.length >= 3 && !VOCAB_STOP_WORDS.has(word));
}

/**
 * Calculate unique vocabulary from all posts
 * @param {Array<Object>} posts - Array of post objects with 'title' and 'body'
 */
export function calculateVocabulary(posts) {
  const allWords = [];
  const uniqueWords = new Set();
  const wordFrequency = {};
  let totalWordsIncludingStopWords = 0;

  posts.forEach(post => {
    const text = ((post.title || '') + ' ' + (post.body || '')).trim();
    if (!text) return;

    let cleanedForTotalCount = text;
    cleanedForTotalCount = cleanedForTotalCount.replace(/<[^>]*>/g, ' ');
    cleanedForTotalCount = cleanedForTotalCount.replace(/\[.*?\]\(.*?\)/g, ' ');

    const allWordsInPost = cleanedForTotalCount.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
    totalWordsIncludingStopWords += allWordsInPost.length;


    const words = extractVocabularyWords(text);
    words.forEach(word => {
      allWords.push(word);
      uniqueWords.add(word);
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  return {
    totalWords: totalWordsIncludingStopWords,
    uniqueWords: uniqueWords.size,
    wordFrequency,
    // Vocabulary Richness (Type-Token Ratio)
    vocabularyRichness: uniqueWords.size / Math.max(totalWordsIncludingStopWords, 1)
  };
}

/**
 * Calculate vocabulary over time (by month)
 */
export function calculateVocabularyOverTime(posts) {
  const sortedPosts = [...posts].sort((a, b) => new Date(a.created) - new Date(b.created));

  const postWordsCache = new Map();
  sortedPosts.forEach((post, idx) => {
    const words = extractVocabularyWords((post.title || '') + ' ' + (post.body || ''));
    postWordsCache.set(idx, words);
  });

  const monthGroups = new Map();
  sortedPosts.forEach((post, idx) => {
    if (!post.created) return;
    const date = new Date(post.created);
    if (isNaN(date)) return;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthGroups.has(monthKey)) monthGroups.set(monthKey, []);
    monthGroups.get(monthKey).push(idx);
  });

  const monthlyData = [];
  const seenWords = new Set();
  const cumulativeVocab = new Set();
  const sortedMonths = Array.from(monthGroups.keys()).sort();

  sortedMonths.forEach(month => {
    const postIndices = monthGroups.get(month);
    const monthWords = new Set();
    const monthWordFreq = {};
    let monthTotalWords = 0;

    postIndices.forEach(idx => {
      const words = postWordsCache.get(idx);
      words.forEach(word => {
        monthWords.add(word);
        cumulativeVocab.add(word);
        monthWordFreq[word] = (monthWordFreq[word] || 0) + 1;
        monthTotalWords++;
      });
    });

    const newWords = [];
    monthWords.forEach(word => {
      if (!seenWords.has(word)) {
        newWords.push(word);
        seenWords.add(word);
      }
    });

    monthlyData.push({
      month,
      postsCount: postIndices.length,
      uniqueWordsThisMonth: monthWords.size,
      cumulativeVocabulary: cumulativeVocab.size,
      newWordsIntroduced: newWords.length,
      totalWordsThisMonth: monthTotalWords,
      vocabularyRichness: monthWords.size / Math.max(monthTotalWords, 1),
      topWords: Object.entries(monthWordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word)
    });
  });

  return monthlyData;
}

/**
 * Calculate vocabulary statistics by year
 */
export function calculateVocabularyByYear(posts) {
  const yearGroups = {};

  posts.forEach(post => {
    if (!post.created) return;
    const date = new Date(post.created);
    if (isNaN(date)) return;
    const year = date.getFullYear();
    if (!yearGroups[year]) yearGroups[year] = [];
    yearGroups[year].push(post);
  });

  return Object.entries(yearGroups)
    .map(([year, postsInYear]) => {
      const vocab = calculateVocabulary(postsInYear);
      return {
        year: parseInt(year),
        postsCount: postsInYear.length,
        totalWords: vocab.totalWords,
        uniqueWords: vocab.uniqueWords,
        vocabularyRichness: vocab.vocabularyRichness,
        avgWordsPerPost: vocab.totalWords / postsInYear.length
      };
    })
    .sort((a, b) => a.year - b.year);
}

/**
 * Find most and least used words, and capture single-use words.
 */
export function getWordFrequencyAnalysis(posts) {
  const vocab = calculateVocabulary(posts);
  const sortedWords = Object.entries(vocab.wordFrequency).sort((a, b) => b[1] - a[1]);

  // Words that appear exactly once (Hapax Legomena)
  const singleUseWords = sortedWords
    .filter(([, count]) => count === 1)
    .map(([word]) => word); // Get just the word

  // Words that appear 2 or more times (for the 'least used' bucket)
  const filteredLeastUsed = sortedWords.filter(([, count]) => count > 1);

  return {
    mostUsed: sortedWords.slice(0, 50).map(([word, count]) => ({ word, count })),
    // Only includes words with count > 1 to provide a useful 'least used' list
    leastUsed: filteredLeastUsed.slice(-50).reverse().map(([word, count]) => ({ word, count })),
    hapaxLegomena: singleUseWords.length,
    // *** NEW: Add the list of all single-use words for inspection ***
    singleUseWords: singleUseWords,
    vocabulary: vocab
  };
}
/**
 * Calculate vocabulary diversity metrics
 */
export function calculateVocabularyDiversity(posts) {
  const vocab = calculateVocabulary(posts);

  const ttr = vocab.uniqueWords / Math.max(vocab.totalWords, 1);

  const wordLengths = Object.keys(vocab.wordFrequency).map(word => word.length);
  const avgWordLength = wordLengths.reduce((sum, len) => sum + len, 0) / Math.max(wordLengths.length, 1).toFixed(3);

  const rareWords = Object.values(vocab.wordFrequency).filter(count => count <= 2).length;
  const rareWordRatio = rareWords / Math.max(vocab.uniqueWords, 1);

  return {
    typeTokenRatio: ttr,
    totalWords: vocab.totalWords,
    uniqueWords: vocab.uniqueWords,
    avgWordLength,
    rareWords,
    rareWordRatio,
    vocabularyRichness: vocab.vocabularyRichness
  };
}

/**
 * Calculate vocabulary growth rate
 */
export function calculateVocabularyGrowth(posts) {
  const timeline = calculateVocabularyOverTime(posts);
  if (timeline.length < 2) {
    return { avgMonthlyGrowth: 0, totalGrowth: 0, startVocabulary: 0, currentVocabulary: 0, timeline };
  }

  const growthRates = [];
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const curr = timeline[i];
    const growth = curr.cumulativeVocabulary - prev.cumulativeVocabulary;
    growthRates.push(growth);
  }

  const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

  return {
    avgMonthlyGrowth: Math.round(avgGrowth),
    totalGrowth: timeline[timeline.length - 1].cumulativeVocabulary - timeline[0].cumulativeVocabulary,
    startVocabulary: timeline[0].cumulativeVocabulary,
    currentVocabulary: timeline[timeline.length - 1].cumulativeVocabulary,
    timeline
  };
}

/**
 * Detect vocabulary sophistication (longer, less common words)
 */
export function calculateVocabularySophistication(posts) {
  const vocab = calculateVocabulary(posts);

  const wordsByLength = {};
  Object.keys(vocab.wordFrequency).forEach(word => {
    const len = word.length;
    if (!wordsByLength[len]) wordsByLength[len] = [];
    wordsByLength[len].push(word);
  });

  const allLongWords = Object.entries(vocab.wordFrequency)
    .filter(([word]) => word.length >= 8)
    .sort((a, b) => b[1] - a[1]);

  const longWordRatio = allLongWords.length / Math.max(vocab.uniqueWords, 1);

  const longWords = allLongWords.slice(0, 30);

  return {
    longWords: longWords.map(([word, count]) => ({ word, count, length: word.length })),
    longWordRatio,
    wordsByLength: Object.entries(wordsByLength)
      .map(([length, words]) => ({ length: parseInt(length), count: words.length }))
      .sort((a, b) => a.length - b.length)
  };
}
