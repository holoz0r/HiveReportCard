// js/topic-charts.js

import { getTopicDistribution, getTopicTimeline, getTopicStats, calculateOptimalTopics } from './clustering.js';

/**
 * Color palette for topics
 */
const TOPIC_COLORS = [
  '#60a5fa', // blue
  '#34d399', // green
  '#fbbf24', // yellow
  '#f87171', // red
  '#a78bfa', // purple
  '#fb923c', // orange
  '#06b6d4', // cyan
  '#ec4899'  // pink
];

/**
 * Render topic distribution pie chart
 */
export function renderTopicPie(posts, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const canvas = document.getElementById('pieTopics');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const distribution = getTopicDistribution(posts, numTopics);
  
  if (!distribution.topics || distribution.topics.length === 0) {
    return null;
  }
  
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: distribution.labels,
      datasets: [{
        data: distribution.counts,
        backgroundColor: TOPIC_COLORS.slice(0, distribution.numTopics),
        borderColor: '#0f172a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { 
            color: '#f0f4f8', 
            font: { size: 12 },
            padding: 10
          },
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const label = ctx.label || '';
              const value = ctx.parsed || 0;
              const total = distribution.counts.reduce((a, b) => a + b, 0);
              const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
              return `${label}: ${value} posts (${pct}%)`;
            }
          },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10
        }
      }
    }
  });
  
  return { chart, distribution };
}

/**
 * Render topic statistics table
 */
export function renderTopicStatsTable(posts, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const container = document.getElementById('topicStatsTable');
  if (!container) return;
  
  const stats = getTopicStats(posts, numTopics);
  
  if (!stats || stats.length === 0) {
    container.innerHTML = '<p style="color:#cbd5e1;text-align:center">No topics to display</p>';
    return;
  }
  
  // Add header showing number of topics detected
  let html = `
    <table style="width:100%;border-collapse:collapse;color:#d4dde8;font-size:13px">
      <thead>
        <tr style="background:rgba(30,41,59,0.8)">
          <th colspan="5" style="text-align:center;padding:12px;color:#94a3b8;font-size:13px;font-weight:normal">
            Detected ${stats.length} topics from ${posts.length} posts
          </th>
        </tr>
        <tr style="background:rgba(30,41,59,0.8)">
          <th style="text-align:left;padding:10px">Topic</th>
          <th style="text-align:center;padding:10px">Posts</th>
          <th style="text-align:center;padding:10px">Avg Words</th>
          <th style="text-align:center;padding:10px">Avg Readability</th>
          <th style="text-align:center;padding:10px">Avg Replies</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  stats.forEach((topic, idx) => {
    const color = TOPIC_COLORS[idx % TOPIC_COLORS.length];
    html += `
      <tr style="border-top:1px solid rgba(148,163,184,0.1)">
        <td style="padding:10px">
          <span style="display:inline-block;width:12px;height:12px;background:${color};border-radius:2px;margin-right:8px"></span>
          <strong>${topic.label}</strong>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">
            Keywords: ${topic.keywords.slice(0, 7).join(', ')}
          </div>
        </td>
        <td style="text-align:center;padding:10px">${topic.postCount}</td>
        <td style="text-align:center;padding:10px">${topic.avgWords}</td>
        <td style="text-align:center;padding:10px">${topic.avgReadability}</td>
        <td style="text-align:center;padding:10px">${topic.avgReplies}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

/**
 * Render topic timeline chart (topics over time)
 */
export function renderTopicTimeline(posts, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const canvas = document.getElementById('chartTopicTimeline');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const timelineData = getTopicTimeline(posts, numTopics);
  
  if (!timelineData.timeline || timelineData.timeline.length === 0) {
    return null;
  }
  
  // Create datasets for each topic
  const datasets = timelineData.topics.map((topic, idx) => ({
    label: topic.label,
    data: timelineData.timeline.map(t => ({
      x: t.month + '-01',
      y: t[topic.index] || 0
    })),
    borderColor: TOPIC_COLORS[idx % TOPIC_COLORS.length],
    backgroundColor: TOPIC_COLORS[idx % TOPIC_COLORS.length] + '40',
    fill: true,
    tension: 0.4,
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5
  }));
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { 
            color: '#f0f4f8', 
            font: { size: 11 },
            padding: 8,
            usePointStyle: true
          },
          position: 'bottom'
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: function(contexts) {
              if (contexts[0]) {
                const date = new Date(contexts[0].parsed.x);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          stacked: false,
          beginAtZero: true,
          title: { 
            display: true, 
            text: 'Posts per Topic', 
            color: '#d4dde8', 
            font: { size: 13 } 
          },
          ticks: { 
            color: '#cbd5e1',
            precision: 0
          },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          type: 'time',
          time: {
            unit: 'month',
            displayFormats: { month: 'MMM YYYY' },
            tooltipFormat: 'MMM YYYY'
          },
          ticks: { 
            color: '#cbd5e1',
            autoSkip: true,
            maxTicksLimit: 12
          },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render topic engagement chart (avg replies per topic)
 */
export function renderTopicEngagement(posts, numTopics = null) {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const canvas = document.getElementById('chartTopicEngagement');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const stats = getTopicStats(posts, numTopics);
  
  if (!stats || stats.length === 0) {
    return null;
  }
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stats.map(t => t.label),
      datasets: [{
        label: 'Avg Replies',
        data: stats.map(t => parseFloat(t.avgReplies)),
        backgroundColor: TOPIC_COLORS.slice(0, stats.length).map(c => c + 'cc'),
        borderColor: TOPIC_COLORS.slice(0, stats.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: false 
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            afterLabel: function(ctx) {
              const topic = stats[ctx.dataIndex];
              return [
                `Posts: ${topic.postCount}`,
                `Avg Words: ${topic.avgWords}`,
                `Avg Readability: ${topic.avgReadability}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { 
            display: true, 
            text: 'Average Replies', 
            color: '#d4dde8', 
            font: { size: 13 } 
          },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          ticks: { 
            color: '#cbd5e1',
            maxRotation: 45,
            minRotation: 0,
            font: { size: 11 }
          },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render topic filter buttons
 */
export function renderTopicFilters(posts, numTopics = null, currentTopic = 'all') {
  if (numTopics === null) {
    numTopics = calculateOptimalTopics(posts.length);
  }
  
  const container = document.getElementById('topicFilters');
  if (!container) return;
  
  const distribution = getTopicDistribution(posts, numTopics);
  
  if (!distribution.topics || distribution.topics.length === 0) {
    container.innerHTML = '';
    return distribution;
  }
  
  let html = `
    <label style="font-weight: 600; color: #cbd5e1; margin-right: 8px;">Filter by Topic:</label>
    <button class="filter-topic ${currentTopic === 'all' ? 'active' : ''}" 
            data-topic="all" 
            onclick="filterPostsByTopicIndex('all', this)">
      All Topics
    </button>
  `;
  
  distribution.topics.forEach((topic, idx) => {
    const color = TOPIC_COLORS[idx % TOPIC_COLORS.length];
    const isActive = currentTopic === idx ? 'active' : '';
    html += `
      <button class="filter-topic ${isActive}" 
              data-topic="${idx}" 
              onclick="filterPostsByTopicIndex(${idx}, this)"
              style="border-left: 3px solid ${color}">
        ${topic.label} (${topic.postCount})
      </button>
    `;
  });
  
  container.innerHTML = html;
  
  return distribution;
}