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
  renderEngagementByContentType
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
  resetZoom
} from './ui.js';


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

  document.getElementById('resultsArea').classList.remove('hidden');
  document.getElementById('filters').style.display = 'flex';
  document.getElementById('exportBtns').classList.remove('hidden');
  setStatus('✓ Finished fetching ' + enriched.length + ' posts');
  fadeStatus();

  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.filters button[data-range="all"]');
  if (allBtn) allBtn.classList.add('active');
  applyDateFilter('all', allBtn);
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

  // Reset level filter and show all posts
  currentLevelFilter = 'all';
  document.querySelectorAll('.filter-level').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.filter-level[data-level="all"]');
  if (allBtn) allBtn.classList.add('active');
  displayedPosts = filtered.slice();
  renderPostsList(displayedPosts);

  document.getElementById('exportBtns').classList.remove('hidden');
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

window.resetZoom = resetZoom;
window.exportChartByCanvasId = exportChartByCanvasId;

// Initialize on load
(function init() {
  document.getElementById('resultsArea').classList.add('hidden');
  document.getElementById('filters').style.display = 'none';
  document.getElementById('exportBtns').classList.add('hidden');
  document.getElementById('searchMessage').classList.add('hidden');
  setStatus('');
})();