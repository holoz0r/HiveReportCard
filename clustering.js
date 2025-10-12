// js/clustering.js

/**
 * Comprehensive stop words list (based on NLTK English stop words)
 * Filters out common words that don't add meaning to topic clustering
 */
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", 
  "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
  'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself', 'they', 'them',
  'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', "that'll",
  'these', 'those',
  // Verbs (common/auxiliary)
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'ought', "should've", 'will',
  'shall', 'can', 'may', 'might', 'must', "won't", "wouldn't", "shouldn't", "couldn't",
  "mustn't", "needn't", "haven't", "hasn't", "hadn't", "doesn't", "don't", "didn't",
  "isn't", "aren't", "wasn't", "weren't",
  // Prepositions
  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  // Conjunctions
  'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'although', 'though',
  'since', 'unless', 'than', 'when', 'where', 'why', 'how',
  // Common adverbs
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'too', 'very', 'just', 'now', 'also', 'well', 'even', 'still', 'already', 'always',
  'never', 'sometimes', 'often', 'usually', 'ever', 'yet',
  // Common verbs
  'get', 'got', 'getting', 'make', 'made', 'making', 'take', 'took', 'taken', 'taking',
  'go', 'went', 'gone', 'going', 'come', 'came', 'coming', 'see', 'saw', 'seen', 'seeing',
  'know', 'knew', 'known', 'knowing', 'give', 'gave', 'given', 'giving', 'say', 'said',
  'saying', 'tell', 'told', 'telling', 'think', 'thought', 'thinking', 'find', 'found',
  'finding', 'look', 'looked', 'looking', 'use', 'used', 'using', 'want', 'wanted',
  'wanting', 'work', 'worked', 'working', 'call', 'called', 'calling', 'try', 'tried',
  'trying', 'ask', 'asked', 'asking', 'need', 'needed', 'needing', 'feel', 'felt',
  'feeling', 'become', 'became', 'becoming', 'leave', 'left', 'leaving', 'put', 'putting',
  // Common nouns (too generic)
  'time', 'year', 'people', 'way', 'day', 'man', 'thing', 'woman', 'life', 'child',
  'world', 'school', 'state', 'family', 'student', 'group', 'country', 'problem',
  'hand', 'part', 'place', 'case', 'week', 'company', 'program', 'question',
  'work', 'number', 'night', 'point', 'home', 'water', 'room', 
  'area', 'month', 'lot', 'right', 'study', 'book', 'eye',
  'job', 'word', 'issue', 'side', 'kind', 'head', 'house', 'service',
  'friend', 'father', 'hour', 'game', 'line', 'end', 'member', 'car',
  'city', 'name', 'team', 'minute', 'idea', 'body', 
  'nothing', 'something', 'everything', 'anything', 'someone', 'everyone', 'anyone',
  'nobody', 'everybody', 'anybody',
  // Common adjectives (too generic)
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'old', 'right',
  'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
  'few', 'public', 'bad', 'same', 'able', 'sure', 'certain', 'clear', 'free', 'real',
  'true', 'whole', 'full', 'many', 'much', 'several', 'various',
  // Contractions and informal
  "i'm", "i've", "i'll", "i'd", "we're", "we've", "we'll", "we'd", "they're", "they've",
  "they'll", "they'd", "he's", "he'll", "he'd", "let's", "that's", "there's", "here's",
  "who's", "what's", "where's", "when's", "why's", "how's",
  // Blog/social media common words
  'post', 'blog', 'article', 'write', 'writing', 'read', 'reading', 'share', 'comment',
  'like', 'follow', 'thanks', 'please', 'hello', 'today', 'yesterday', 'tomorrow',
  'hope', 'love', 'really', 'thing', 'things', 'stuff', 'pretty', 'quite', 'maybe',
  'probably', 'actually', 'basically', 'literally', 'definitely', 'certainly',
  // specific
  'http', 'steemitimages','href','https','peakd','file','files', 'Nbsp', 'nbsp', 'br', 'hr', 'div'
]);

/**
 * Extracts meaningful words from text
 * @param {string} text - The text to extract words from
 * @param {string} authorUsername - Optional author username to filter out
 */
function extractWords(text, authorUsername = null) {
  if (!text) return [];
  
  // Clean the text first
  let cleaned = text.toLowerCase();
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, ' ');
  cleaned = cleaned.replace(/www\.[^\s]+/g, ' ');
  
  // Remove markdown image syntax ![alt](url)
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ');
  
  // Remove markdown link syntax [text](url) but keep the text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  
  // Remove markdown formatting (bold, italic, code)
  cleaned = cleaned.replace(/[*_`~#]/g, ' ');
  
  // Remove special characters but keep spaces
  cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' ');
  
  const words = cleaned
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  
  // Filter out author username if provided
  if (authorUsername) {
    const usernameLower = authorUsername.toLowerCase();
    return words.filter(word => word !== usernameLower);
  }
  
  return words;
}

/**
 * Extracts bigrams (two-word phrases) from text
 */
function extractBigrams(words) {
  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

/**
 * Calculate term frequency across all posts
 * @param {Array} posts - Array of post objects
 * @param {string} authorUsername - Optional author username to filter out
 */
function calculateTermFrequency(posts, authorUsername = null) {
  const termFreq = {};
  
  posts.forEach(post => {
    const titleWords = extractWords(post.title || '', authorUsername);
    const bodyWords = extractWords(post.body || '', authorUsername).slice(0, 200); // First 200 words for performance
    
    // Weight title words more heavily
    titleWords.forEach(word => {
      termFreq[word] = (termFreq[word] || 0) + 3;
    });
    
    bodyWords.forEach(word => {
      termFreq[word] = (termFreq[word] || 0) + 1;
    });
    
    // Add bigrams from titles
    const bigrams = extractBigrams(titleWords);
    bigrams.forEach(bigram => {
      termFreq[bigram] = (termFreq[bigram] || 0) + 2;
    });
  });
  
  return termFreq;
}

/**
 * Get top N keywords based on frequency
 */
function getTopKeywords(termFreq, n = 50) {
  return Object.entries(termFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term]) => term);
}

/**
 * Calculate similarity score between a post and a set of keywords
 */
function calculatePostKeywordScore(post, keywords, authorUsername = null) {
  const titleWords = extractWords(post.title || '', authorUsername);
  const bodyWords = extractWords(post.body || '', authorUsername).slice(0, 200);
  const allWords = [...titleWords, ...bodyWords];
  
  let score = 0;
  keywords.forEach(keyword => {
    // Check for exact matches
    const titleMatches = titleWords.filter(w => w === keyword || keyword.includes(w)).length;
    const bodyMatches = bodyWords.filter(w => w === keyword || keyword.includes(w)).length;
    
    score += titleMatches * 5; // Title matches worth more
    score += bodyMatches;
  });
  
  return score;
}

/**
 * Assign posts to topics based on keyword clustering
 * @param {Array} posts - Array of post objects
 * @param {number} numTopics - Number of topics to create
 */
function assignPostsToTopics(posts, numTopics = 5) {
  if (posts.length === 0) return [];
  
  // Get author username from first post to filter out
  const authorUsername = posts[0]?.author || null;
  
  const termFreq = calculateTermFrequency(posts, authorUsername);
  const topKeywords = getTopKeywords(termFreq, Math.min(100, posts.length * 2));
  
  // Use k-means-like approach: select seed keywords
  const seedKeywords = [];
  const keywordsPerTopic = Math.ceil(topKeywords.length / numTopics);
  
  for (let i = 0; i < numTopics && i * keywordsPerTopic < topKeywords.length; i++) {
    const start = i * keywordsPerTopic;
    const end = Math.min(start + keywordsPerTopic, topKeywords.length);
    seedKeywords.push(topKeywords.slice(start, end));
  }
  
  // Assign each post to the topic with highest keyword overlap
  const postsWithTopics = posts.map(post => {
    const scores = seedKeywords.map(keywords => 
      calculatePostKeywordScore(post, keywords, authorUsername)
    );
    
    const topicIndex = scores.indexOf(Math.max(...scores));
    
    return {
      ...post,
      topicIndex,
      topicScore: scores[topicIndex]
    };
  });
  
  // Generate topic labels and keywords
  const topics = seedKeywords.map((keywords, index) => {
    const postsInTopic = postsWithTopics.filter(p => p.topicIndex === index);
    
    // Get most common words in this topic's posts
    const topicTermFreq = {};
    postsInTopic.forEach(post => {
      const words = extractWords(post.title + ' ' + post.body, authorUsername);
      words.forEach(word => {
        topicTermFreq[word] = (topicTermFreq[word] || 0) + 1;
      });
    });
    
    const topWords = Object.entries(topicTermFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([word]) => word);
    
    // Generate label from top words (use 4 words for more distinct labels)
    const label = topWords.slice(0, 4).map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' / ');
    
    return {
      index,
      label: label || `Topic ${index + 1}`,
      keywords: topWords,
      postCount: postsInTopic.length,
      posts: postsInTopic
    };
  });
  
  return {
    topics,
    postsWithTopics
  };
}

/**
 * Generate topic distribution data for pie chart
 */
export function getTopicDistribution(posts, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const result = assignPostsToTopics(posts, numTopics);
  
  return {
    labels: result.topics.map(t => t.label),
    counts: result.topics.map(t => t.postCount),
    topics: result.topics,
    postsWithTopics: result.postsWithTopics,
    numTopics
  };
}

/**
 * Get topic timeline data (topics over time)
 */
export function getTopicTimeline(posts, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const result = assignPostsToTopics(posts, numTopics);
  
  // Group by month
  const monthlyData = {};
  
  result.postsWithTopics.forEach(post => {
    const date = new Date(post.created);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {};
      result.topics.forEach(t => {
        monthlyData[monthKey][t.index] = 0;
      });
    }
    
    monthlyData[monthKey][post.topicIndex]++;
  });
  
  // Convert to array format sorted by date
  const timeline = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, counts]) => ({
      month,
      ...counts
    }));
  
  return {
    timeline,
    topics: result.topics
  };
}

/**
 * Get word cloud data for a specific topic
 */
export function getTopicWordCloud(posts, topicIndex, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const authorUsername = posts[0]?.author || null;
  const result = assignPostsToTopics(posts, numTopics);
  const topic = result.topics.find(t => t.index === topicIndex);
  
  if (!topic) return [];
  
  const termFreq = {};
  topic.posts.forEach(post => {
    const words = extractWords(post.title + ' ' + post.body, authorUsername);
    words.forEach(word => {
      termFreq[word] = (termFreq[word] || 0) + 1;
    });
  });
  
  return Object.entries(termFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Filter posts by topic
 */
export function filterPostsByTopic(posts, topicIndex, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const result = assignPostsToTopics(posts, numTopics);
  return result.postsWithTopics.filter(p => p.topicIndex === topicIndex);
}

/**
 * Calculate optimal number of topics based on post count
 */
export function calculateOptimalTopics(postCount) {
  if (postCount < 10) return 2;
  if (postCount < 25) return 3;
  if (postCount < 50) return 4;
  if (postCount < 100) return 5;
  // For 100+ posts, use 10 topics (upper bound)
  return 10;
}

/**
 * Get topic summary statistics
 */
export function getTopicStats(posts, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const result = assignPostsToTopics(posts, numTopics);
  
  return result.topics.map(topic => {
    const avgWords = topic.posts.length > 0
      ? topic.posts.reduce((sum, p) => sum + p.wordCount, 0) / topic.posts.length
      : 0;
    
    const avgReadability = topic.posts.length > 0
      ? topic.posts.reduce((sum, p) => sum + p.readability.score, 0) / topic.posts.length
      : 0;
    
    const avgReplies = topic.posts.length > 0
      ? topic.posts.reduce((sum, p) => sum + p.replies, 0) / topic.posts.length
      : 0;
    
    return {
      ...topic,
      avgWords: avgWords.toFixed(0),
      avgReadability: avgReadability.toFixed(1),
      avgReplies: avgReplies.toFixed(1)
    };
  });
}