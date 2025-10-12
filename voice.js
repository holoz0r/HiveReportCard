// js/voice.js

/**
 * Common filler words that weaken writing
 */
const FILLER_WORDS = new Set([
  'really', 'very', 'quite', 'rather', 'somewhat', 'somehow', 'actually',
  'basically', 'seriously', 'literally', 'simply', 'just', 'maybe', 
  'perhaps', 'probably', 'possibly', 'seemingly', 'apparently', 'relatively',
  'fairly', 'pretty', 'kind', 'sort', 'type', 'thing', 'stuff'
]);

/**
 * Common adverbs (typically end in -ly)
 */
const COMMON_ADVERBS = new Set([
  'quickly', 'slowly', 'carefully', 'easily', 'hardly', 'suddenly', 'finally',
  'recently', 'completely', 'absolutely', 'certainly', 'definitely', 'obviously',
  'clearly', 'extremely', 'highly', 'totally', 'entirely', 'perfectly', 'directly',
  'immediately', 'constantly', 'frequently', 'usually', 'generally', 'normally',
  'particularly', 'especially', 'specifically', 'roughly', 'approximately'
]);

/**
 * Passive voice indicators (forms of "to be" + past participle patterns)
 */
const BE_VERBS = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am'
]);

/**
 * Common past participles that follow "to be" verbs in passive constructions
 */
const PAST_PARTICIPLE_INDICATORS = new Set([
  'given', 'made', 'seen', 'taken', 'found', 'called', 'used', 'shown',
  'told', 'asked', 'done', 'known', 'written', 'said', 'brought', 'thought',
  'held', 'put', 'kept', 'paid', 'heard', 'led', 'read', 'left', 'felt',
  'met', 'run', 'moved', 'lived', 'believed', 'considered', 'needed', 'wanted',
  'created', 'developed', 'designed', 'built', 'established', 'formed', 'produced',
  'published', 'released', 'announced', 'reported', 'noted', 'observed', 'discovered',
  'invented', 'introduced', 'launched', 'presented', 'proposed', 'suggested',
  'recommended', 'approved', 'accepted', 'rejected', 'denied', 'granted', 'awarded',
  'recognized', 'acknowledged', 'praised', 'criticized', 'blamed', 'accused',
  'charged', 'convicted', 'sentenced', 'punished', 'rewarded', 'honored',
  'elected', 'appointed', 'hired', 'fired', 'promoted', 'demoted', 'transferred'
]);

/**
 * Extract sentences from text
 */
function extractSentences(text) {
  if (!text) return [];
  
  // Remove URLs, markdown, HTML
  let cleaned = text;
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, ' ');
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ');
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  
  // Split on sentence boundaries
  return cleaned
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Minimum sentence length
}

/**
 * Detect passive voice in a sentence
 * Looks for patterns like "is given", "was made", "were told"
 */
function isPassiveVoice(sentence) {
  const words = sentence.toLowerCase().split(/\s+/);
  
  // Look for "be verb + past participle" pattern
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i].replace(/[^a-z]/g, '');
    const nextWord = words[i + 1].replace(/[^a-z]/g, '');
    
    // Check for "to be" verb followed by past participle
    if (BE_VERBS.has(word)) {
      // Check if next word is a past participle
      if (PAST_PARTICIPLE_INDICATORS.has(nextWord)) {
        return true;
      }
      // Also check for -ed endings (common past participles)
      if (nextWord.endsWith('ed') && nextWord.length > 4) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Count filler words in text
 */
function countFillerWords(text) {
  if (!text) return { count: 0, words: {} };
  
  const words = text.toLowerCase().split(/\s+/);
  const fillerCount = {};
  let totalFillers = 0;
  
  words.forEach(word => {
    const cleaned = word.replace(/[^a-z]/g, '');
    if (FILLER_WORDS.has(cleaned)) {
      fillerCount[cleaned] = (fillerCount[cleaned] || 0) + 1;
      totalFillers++;
    }
  });
  
  return {
    count: totalFillers,
    words: fillerCount
  };
}

/**
 * Count adverbs in text
 */
function countAdverbs(text) {
  if (!text) return { count: 0, words: {} };
  
  const words = text.toLowerCase().split(/\s+/);
  const adverbCount = {};
  let totalAdverbs = 0;
  
  words.forEach(word => {
    const cleaned = word.replace(/[^a-z]/g, '');
    
    // Check known adverbs or -ly endings (with exceptions)
    if (COMMON_ADVERBS.has(cleaned) || 
        (cleaned.endsWith('ly') && 
         cleaned.length > 4 && 
         !cleaned.endsWith('ally') && // Skip words like "finally"
         !['fly', 'apply', 'supply', 'reply', 'only', 'ugly', 'silly', 'holy', 'jolly'].includes(cleaned))) {
      adverbCount[cleaned] = (adverbCount[cleaned] || 0) + 1;
      totalAdverbs++;
    }
  });
  
  return {
    count: totalAdverbs,
    words: adverbCount
  };
}

/**
 * Analyze voice for a single post
 */
export function analyzePostVoice(post) {
  const text = (post.title || '') + ' ' + (post.body || '');
  const sentences = extractSentences(text);
  
  if (sentences.length === 0) {
    return {
      totalSentences: 0,
      passiveSentences: 0,
      activeSentences: 0,
      passivePercentage: 0,
      activePercentage: 0,
      fillerWords: { count: 0, words: {} },
      adverbs: { count: 0, words: {} },
      wordCount: 0
    };
  }
  
  let passiveCount = 0;
  sentences.forEach(sentence => {
    if (isPassiveVoice(sentence)) {
      passiveCount++;
    }
  });
  
  const activeCount = sentences.length - passiveCount;
  const fillers = countFillerWords(text);
  const adverbs = countAdverbs(text);
  const wordCount = text.split(/\s+/).length;
  
  return {
    totalSentences: sentences.length,
    passiveSentences: passiveCount,
    activeSentences: activeCount,
    passivePercentage: (passiveCount / sentences.length) * 100,
    activePercentage: (activeCount / sentences.length) * 100,
    fillerWords: fillers,
    adverbs: adverbs,
    wordCount: wordCount,
    fillerDensity: (fillers.count / wordCount) * 1000, // Per 1000 words
    adverbDensity: (adverbs.count / wordCount) * 1000 // Per 1000 words
  };
}

/**
 * Analyze voice across all posts
 */
export function analyzeVoiceAcrossPosts(posts) {
  let totalSentences = 0;
  let totalPassive = 0;
  let totalActive = 0;
  let totalFillers = 0;
  let totalAdverbs = 0;
  let totalWords = 0;
  
  const postsWithVoice = posts.map(post => {
    const analysis = analyzePostVoice(post);
    
    totalSentences += analysis.totalSentences;
    totalPassive += analysis.passiveSentences;
    totalActive += analysis.activeSentences;
    totalFillers += analysis.fillerWords.count;
    totalAdverbs += analysis.adverbs.count;
    totalWords += analysis.wordCount;
    
    return {
      ...post,
      voiceAnalysis: analysis
    };
  });
  
  return {
    posts: postsWithVoice,
    overall: {
      totalSentences,
      passiveSentences: totalPassive,
      activeSentences: totalActive,
      passivePercentage: totalSentences > 0 ? (totalPassive / totalSentences) * 100 : 0,
      activePercentage: totalSentences > 0 ? (totalActive / totalSentences) * 100 : 0,
      totalFillers,
      totalAdverbs,
      totalWords,
      fillerDensity: totalWords > 0 ? (totalFillers / totalWords) * 1000 : 0,
      adverbDensity: totalWords > 0 ? (totalAdverbs / totalWords) * 1000 : 0
    }
  };
}

/**
 * Calculate engagement by voice type
 */
export function calculateEngagementByVoice(posts) {
  const analyzed = analyzeVoiceAcrossPosts(posts);
  
  // Categorize posts by dominant voice
  const activeVoicePosts = analyzed.posts.filter(p => 
    p.voiceAnalysis.activePercentage >= 70
  );
  
  const passiveVoicePosts = analyzed.posts.filter(p => 
    p.voiceAnalysis.passivePercentage >= 30
  );
  
  const balancedPosts = analyzed.posts.filter(p =>
    p.voiceAnalysis.activePercentage < 70 && p.voiceAnalysis.passivePercentage < 30
  );
  
  const calcAvgReplies = (posts) => {
    if (posts.length === 0) return 0;
    const total = posts.reduce((sum, p) => sum + (p.replies || 0), 0);
    return total / posts.length;
  };
  
  return {
    activeVoice: {
      count: activeVoicePosts.length,
      avgReplies: calcAvgReplies(activeVoicePosts)
    },
    passiveVoice: {
      count: passiveVoicePosts.length,
      avgReplies: calcAvgReplies(passiveVoicePosts)
    },
    balanced: {
      count: balancedPosts.length,
      avgReplies: calcAvgReplies(balancedPosts)
    }
  };
}

/**
 * Calculate engagement by filler word density
 */
export function calculateEngagementByFillerDensity(posts) {
  const analyzed = analyzeVoiceAcrossPosts(posts);
  
  // Categorize by filler density (per 1000 words)
  const lowFiller = analyzed.posts.filter(p => p.voiceAnalysis.fillerDensity < 5);
  const mediumFiller = analyzed.posts.filter(p => 
    p.voiceAnalysis.fillerDensity >= 5 && p.voiceAnalysis.fillerDensity < 10
  );
  const highFiller = analyzed.posts.filter(p => p.voiceAnalysis.fillerDensity >= 10);
  
  const calcAvgReplies = (posts) => {
    if (posts.length === 0) return 0;
    const total = posts.reduce((sum, p) => sum + (p.replies || 0), 0);
    return total / posts.length;
  };
  
  return {
    low: {
      count: lowFiller.length,
      avgReplies: calcAvgReplies(lowFiller),
      label: 'Low (<5 per 1K)'
    },
    medium: {
      count: mediumFiller.length,
      avgReplies: calcAvgReplies(mediumFiller),
      label: 'Medium (5-10 per 1K)'
    },
    high: {
      count: highFiller.length,
      avgReplies: calcAvgReplies(highFiller),
      label: 'High (>10 per 1K)'
    }
  };
}

/**
 * Calculate engagement by adverb density
 */
export function calculateEngagementByAdverbDensity(posts) {
  const analyzed = analyzeVoiceAcrossPosts(posts);
  
  // Categorize by adverb density (per 1000 words)
  const lowAdverb = analyzed.posts.filter(p => p.voiceAnalysis.adverbDensity < 10);
  const mediumAdverb = analyzed.posts.filter(p => 
    p.voiceAnalysis.adverbDensity >= 10 && p.voiceAnalysis.adverbDensity < 20
  );
  const highAdverb = analyzed.posts.filter(p => p.voiceAnalysis.adverbDensity >= 20);
  
  const calcAvgReplies = (posts) => {
    if (posts.length === 0) return 0;
    const total = posts.reduce((sum, p) => sum + (p.replies || 0), 0);
    return total / posts.length;
  };
  
  return {
    low: {
      count: lowAdverb.length,
      avgReplies: calcAvgReplies(lowAdverb),
      label: 'Low (<10 per 1K)'
    },
    medium: {
      count: mediumAdverb.length,
      avgReplies: calcAvgReplies(mediumAdverb),
      label: 'Medium (10-20 per 1K)'
    },
    high: {
      count: highAdverb.length,
      avgReplies: calcAvgReplies(highAdverb),
      label: 'High (>20 per 1K)'
    }
  };
}