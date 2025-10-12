// js/main.js

import { fetchAuthoredPosts } from './api.js';
import { enrichPosts, groupReadability } from './calculations.js';
import {
  aggregatePostsByWeek,
  aggregatePostsByMonth,
  aggregatePostsByYear,
  renderPerPostChartAggregated,
  renderCumulativeChartAggregated,
  renderReadabilityChartAggregated,
  renderReadabilityPie,
  renderWordDistPie,
  renderEngagementByReadability,
  renderEngagementByWordCount,
  renderEngagementByContentType,
  renderContentTypePie
} from './charts.js';
import {
  setStatus,
  fadeStatus,
  computeAggregates,
  renderCards,
  renderDowHeatmap,
  renderMonthHeatmap,
  renderYearHeatmap,
  renderHourHeatmap,
  renderReadabilityTable,
  renderWordDistTable,
  renderPostsList,
  escapeCsv,
  exportChartPNG,
  exportCSV,
  exportJSON,
  exportChartByCanvasId,
  renderBreaksStreaksTable,
   renderPeriodAnalysisTable,
  resetZoom
} from './ui.js';
import {
  renderTopicPie,
  renderTopicStatsTable,
  renderTopicTimeline,
  renderTopicEngagement,
  renderTopicFilters
} from './topic-charts.js';
import { filterPostsByTopic, calculateOptimalTopics } from './clustering.js';
import {
  renderVocabularyCards,
  renderVocabularyGrowthChart,
  renderWordFrequencyChart,
  renderWordLengthChart,
  renderVocabularyByYearChart
} from './vocabulary-charts.js';
import {
  renderVoiceCards,
  renderVoicePie,
  renderEngagementByVoiceChart,
  renderEngagementByFillerChart,
  renderEngagementByAdverbChart
} from './voice-charts.js';

// State
let rawPosts = [];
let enriched = [];
let filtered = [];
let displayedPosts = [];
let currentRange = 'all';
let currentLevelFilter = 'all';
let currentAggregation = 'day';
let currentCumulativeAggregation = 'day';
let currentReadabilityAggregation = 'day';

let chartPerPost = null;
let chartCumulative = null;
let chartReadability = null;
let pieReadability = null;
let pieWordDist = null;
let chartEngagementReadability = null;
let chartEngagementWordCount = null;
let chartEngagementContentType = null;
let chartContentTypePie = null;
let currentTopicFilter = 'all';
let chartTopicTimeline = null;
let chartTopicEngagement = null;
let pieTopics = null;
let topicDistribution = null;
let chartVocabGrowth = null;
let chartWordFreq = null;
let chartWordLength = null;
let chartVocabByYear = null;
let pieVoice = null;
let chartEngagementVoice = null;
let chartEngagementFiller = null;
let chartEngagementAdverb = null;

// Main fetch function
async function startFetch(mode) {
  const username = document.getElementById('username').value.trim().toLowerCase();
  if (!username) {
    alert('Please enter a Hive username');
    return;
  }

  document.getElementById('username').disabled = true;
  document.getElementById('btnAll').disabled = true;
  document.getElementById('btn100').disabled = true;

  document.getElementById('resultsArea').classList.add('hidden');
  document.getElementById('filters').style.display = 'none';
  document.getElementById('exportBtns').classList.add('hidden');
  document.getElementById('searchMessage').classList.remove('hidden');

  setStatus('Starting fetch...');
  try {
    rawPosts = await fetchAuthoredPosts(username, mode, setStatus);
  } catch (e) {
    console.error(e);
    alert('Failed to fetch posts: ' + (e && e.message ? e.message : e));
    return;
  }
  enriched = enrichPosts(rawPosts);

// Start processing timer
const processingStart = Date.now();
const statusBar = document.getElementById('statusBar');
statusBar.innerHTML = '✓ Finished fetching ' + rawPosts.length + ' posts<br>⏳ Processing posts data...';

// Create a processing timer display
const timerInterval = setInterval(() => {
  const elapsed = Date.now() - processingStart;
  statusBar.innerHTML = '✓ Finished fetching ' + rawPosts.length + ' posts<br>⏳ Processing posts data... ' + elapsed + 'ms';
}, 10);

// Use setTimeout to allow UI to update
setTimeout(() => {
  enriched = enrichPosts(rawPosts);
  
  clearInterval(timerInterval);
  statusBar.innerHTML = '✓ Finished fetching ' + enriched.length + ' posts<br>⏳ Analyzing topics and vocabulary...';
  
  const analysisStart = Date.now();
  const analysisInterval = setInterval(() => {
    const elapsed = Date.now() - analysisStart;
    statusBar.innerHTML = '✓ Finished fetching ' + enriched.length + ' posts<br>✓ Processing completed<br>⏳ Analyzing topics and vocabulary... ' + elapsed + 'ms';
  }, 10);
  
  setTimeout(() => {
    clearInterval(analysisInterval);
    const totalTime = Date.now() - processingStart;
    
    document.getElementById('resultsArea').classList.remove('hidden');
    document.getElementById('filters').style.display = 'flex';
    document.getElementById('exportBtns').classList.remove('hidden');
    statusBar.innerHTML = '✓ All processing completed in ' + totalTime + 'ms';

    document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.filters button[data-range="all"]');
    if (allBtn) allBtn.classList.add('active');
    applyDateFilter('all', allBtn);
  }, 10);
}, 10);

}

// Date filter
function applyDateFilter(range, btn) {
  currentRange = range;
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const now = new Date();
  filtered = enriched.filter(p => {
    const d = new Date(p.created);
    if (range === '7d') return d >= new Date(now.getTime() - 7 * 86400000);
    if (range === '30d') return d >= new Date(now.getTime() - 30 * 86400000);
    if (range === 'ytd') return d.getFullYear() === now.getFullYear();
    return true;
  });

  renderAll();
}

// Render everything
function renderAll() {
  // Destroy existing charts
  if (chartPerPost) { chartPerPost.destroy(); chartPerPost = null; }
  if (chartCumulative) { chartCumulative.destroy(); chartCumulative = null; }
  if (chartReadability) { chartReadability.destroy(); chartReadability = null; }
  if (pieReadability) { pieReadability.destroy(); pieReadability = null; }
  if (pieWordDist) { pieWordDist.destroy(); pieWordDist = null; }
  if (chartEngagementReadability) { chartEngagementReadability.destroy(); chartEngagementReadability = null; }
  if (chartEngagementWordCount) { chartEngagementWordCount.destroy(); chartEngagementWordCount = null; }
  if (chartEngagementContentType) { chartEngagementContentType.destroy(); chartEngagementContentType = null; }
  if (chartTopicTimeline) { chartTopicTimeline.destroy(); chartTopicTimeline = null; }
if (chartTopicEngagement) { chartTopicEngagement.destroy(); chartTopicEngagement = null; }
if (pieTopics) { pieTopics.destroy(); pieTopics = null; }
if (chartVocabGrowth) { chartVocabGrowth.destroy(); chartVocabGrowth = null; }
if (chartWordFreq) { chartWordFreq.destroy(); chartWordFreq = null; }
if (chartWordLength) { chartWordLength.destroy(); chartWordLength = null; }
if (chartVocabByYear) { chartVocabByYear.destroy(); chartVocabByYear = null; }
if (pieVoice) { pieVoice.destroy(); pieVoice = null; }
if (chartEngagementVoice) { chartEngagementVoice.destroy(); chartEngagementVoice = null; }
if (chartEngagementFiller) { chartEngagementFiller.destroy(); chartEngagementFiller = null; }
if (chartEngagementAdverb) { chartEngagementAdverb.destroy(); chartEngagementAdverb = null; }

  if (!filtered || filtered.length === 0) {
    document.getElementById('cardGrid').innerHTML = '';
    document.getElementById('postsList').innerHTML = '<p>No posts for this filter.</p>';
    document.getElementById('readabilityTable').innerHTML = '';
    document.getElementById('wordDistTable').innerHTML = '';
    document.getElementById('heatmap').innerHTML = '';
    document.getElementById('monthmap').innerHTML = '';
    document.getElementById('yearmap').innerHTML = '';
    document.getElementById('hourmap').innerHTML = '';
    return;
  }

  const agg = computeAggregates(filtered);
  renderCards(agg, filtered);
  renderBreaksStreaksTable(filtered);
  renderPeriodAnalysisTable(filtered);

  chartPerPost = renderPerPostChartAggregated(
    filtered, 
    agg, 
    currentAggregation,
    aggregatePostsByWeek,
    aggregatePostsByMonth,
    aggregatePostsByYear
  );
  
  chartCumulative = renderCumulativeChartAggregated(
    filtered,
    currentCumulativeAggregation,
    aggregatePostsByWeek,
    aggregatePostsByMonth,
    aggregatePostsByYear
  );
  
  chartReadability = renderReadabilityChartAggregated(
    filtered,
    currentReadabilityAggregation,
    aggregatePostsByWeek,
    aggregatePostsByMonth,
    aggregatePostsByYear
  );

  renderDowHeatmap(filtered);
  renderMonthHeatmap(filtered);
  renderYearHeatmap(filtered);
  renderHourHeatmap(filtered);
  
  renderReadabilityTable(filtered, groupReadability);
  pieReadability = renderReadabilityPie(filtered, groupReadability);
  
  renderWordDistTable(filtered);
  pieWordDist = renderWordDistPie(filtered);
  
  chartEngagementReadability = renderEngagementByReadability(filtered);
  chartEngagementWordCount = renderEngagementByWordCount(filtered);
  chartEngagementContentType = renderEngagementByContentType(filtered);
  chartContentTypePie = renderContentTypePie(filtered);

  // Render topic visualizations with dynamic topic count
const topicResult = renderTopicPie(filtered);
if (topicResult) {
  pieTopics = topicResult.chart;
  topicDistribution = topicResult.distribution;
}
renderTopicStatsTable(filtered);
chartTopicTimeline = renderTopicTimeline(filtered);
chartTopicEngagement = renderTopicEngagement(filtered);
topicDistribution = renderTopicFilters(filtered, null, currentTopicFilter);

// Render vocabulary analysis
renderVocabularyCards(filtered);
chartVocabGrowth = renderVocabularyGrowthChart(filtered);
chartWordFreq = renderWordFrequencyChart(filtered);
chartWordLength = renderWordLengthChart(filtered);
chartVocabByYear = renderVocabularyByYearChart(filtered);

// Render voice analysis
renderVoiceCards(filtered);
pieVoice = renderVoicePie(filtered);
chartEngagementVoice = renderEngagementByVoiceChart(filtered);
chartEngagementFiller = renderEngagementByFillerChart(filtered);
chartEngagementAdverb = renderEngagementByAdverbChart(filtered);

  // Reset level filter and show all posts
  currentLevelFilter = 'all';
  document.querySelectorAll('.filter-level').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.filter-level[data-level="all"]');
  if (allBtn) allBtn.classList.add('active');
  displayedPosts = filtered.slice();
  renderPostsList(displayedPosts);

  document.getElementById('exportBtns').classList.remove('hidden');
}

// Filter posts by topic
function filterPostsByTopicIndex(topicIndex, btn) {
  currentTopicFilter = topicIndex;
  document.querySelectorAll('.filter-topic').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (topicIndex === 'all') {
    displayedPosts = filtered.slice();
  } else {
    // Pass null to use dynamic topic count
    displayedPosts = filterPostsByTopic(filtered, topicIndex, null);
  }
  renderPostsList(displayedPosts);
}

// Aggregation change handlers
function changeAggregation(unit, btn) {
  currentAggregation = unit;
  document.querySelectorAll('.aggregation-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const agg = computeAggregates(filtered);
  if (chartPerPost) chartPerPost.destroy();
  chartPerPost = renderPerPostChartAggregated(
    filtered,
    agg,
    unit,
    aggregatePostsByWeek,
    aggregatePostsByMonth,
    aggregatePostsByYear
  );
}

function changeCumulativeAggregation(unit, btn) {
  currentCumulativeAggregation = unit;
  document.querySelectorAll('[onclick*="changeCumulativeAggregation"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (chartCumulative) chartCumulative.destroy();
  chartCumulative = renderCumulativeChartAggregated(
    filtered,
    unit,
    aggregatePostsByWeek,
    aggregatePostsByMonth,
    aggregatePostsByYear
  );
}

function changeReadabilityAggregation(unit, btn) {
  currentReadabilityAggregation = unit;
  document.querySelectorAll('[onclick*="changeReadabilityAggregation"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (chartReadability) chartReadability.destroy();
  chartReadability = renderReadabilityChartAggregated(
    filtered,
    unit,
    aggregatePostsByWeek,
    aggregatePostsByMonth,
    aggregatePostsByYear
  );
}

// Filter posts by level
function filterPostsByLevel(level, btn) {
  currentLevelFilter = level;
  document.querySelectorAll('.filter-level').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (level === 'all') {
    displayedPosts = filtered.slice();
  } else {
    displayedPosts = filtered.filter(p => {
      const explainer = p.readability && p.readability.explainer ? p.readability.explainer : '';
      return explainer === level;
    });
  }
  renderPostsList(displayedPosts);
}

// Make functions available globally for onclick handlers
window.startFetch = startFetch;
window.applyDateFilter = applyDateFilter;
window.changeAggregation = changeAggregation;
window.changeCumulativeAggregation = changeCumulativeAggregation;
window.changeReadabilityAggregation = changeReadabilityAggregation;
window.filterPostsByLevel = filterPostsByLevel;
window.exportChartPNG = exportChartPNG;
window.exportCSV = () => exportCSV(displayedPosts, escapeCsv);
window.exportJSON = () => exportJSON(displayedPosts);

// Also expose chart instances for export
window.chartEngagementReadability = chartEngagementReadability;
window.chartEngagementWordCount = chartEngagementWordCount;
window.chartEngagementContentType = chartEngagementContentType;
window.filterPostsByTopicIndex = filterPostsByTopicIndex;

window.resetZoom = resetZoom;
window.exportChartByCanvasId = exportChartByCanvasId;

// Debug functions for vocabulary analysis
window.downloadHapaxWords = function() {
  if (!window._vocabDebugData) {
    alert('No vocabulary data available.');
    return;
  }
  
  const words = window._vocabDebugData.singleUseWords;
  const text = `Hapax Legomena (Words Used Only Once)\nTotal: ${words.length}\n\n${words.join('\n')}`;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hapax_legomena.txt';
  a.click();
  a.remove();
};

window.downloadRareWords = function() {
  if (!window._vocabDebugData) {
    alert('No vocabulary data available.');
    return;
  }
  
  const words = window._vocabDebugData.rareWords;
  const text = `Rare Words (Used ≤2 Times)\nTotal: ${words.length}\n\n${words.join('\n')}`;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rare_words.txt';
  a.click();
  a.remove();
};

// Initialize on load
(function init() {
  document.getElementById('resultsArea').classList.add('hidden');
  document.getElementById('filters').style.display = 'none';
  document.getElementById('exportBtns').classList.add('hidden');
  document.getElementById('searchMessage').classList.add('hidden');
  setStatus('');
})();