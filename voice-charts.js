// js/voice-charts.js

import {
  analyzeVoiceAcrossPosts,
  calculateEngagementByVoice,
  calculateEngagementByFillerDensity,
  calculateEngagementByAdverbDensity
} from './voice.js';

/**
 * Render voice analysis cards
 */
export function renderVoiceCards(posts) {
  const container = document.getElementById('voiceCards');
  if (!container) return;
  
  const analysis = analyzeVoiceAcrossPosts(posts);
  const overall = analysis.overall;
  
  container.innerHTML = `
    <div class="card">
      <h4>Active Voice 💪</h4>
      <p>${overall.activePercentage.toFixed(1)}%</p>
      <small style="font-size:11px;color:#94a3b8">Strong, direct writing</small>
    </div>
    <div class="card">
      <h4>Passive Voice 😴</h4>
      <p>${overall.passivePercentage.toFixed(1)}%</p>
      <small style="font-size:11px;color:#94a3b8">Can weaken impact</small>
    </div>
    <div class="card">
      <h4>Total Sentences 📝</h4>
      <p>${overall.totalSentences.toLocaleString()}</p>
    </div>
    <div class="card">
      <h4>Filler Words 🚫</h4>
      <p>${overall.totalFillers.toLocaleString()}</p>
      <small style="font-size:11px;color:#94a3b8">${overall.fillerDensity.toFixed(1)} per 1,000 words</small>
    </div>
    <div class="card">
      <h4>Filler Density 📊</h4>
      <p>${overall.fillerDensity.toFixed(2)}</p>
      <small style="font-size:11px;color:#94a3b8">Per 1,000 words<br>Lower is better</small>
    </div>
    <div class="card">
      <h4>Adverbs Used 📉</h4>
      <p>${overall.totalAdverbs.toLocaleString()}</p>
      <small style="font-size:11px;color:#94a3b8">${overall.adverbDensity.toFixed(1)} per 1,000 words</small>
    </div>
    <div class="card">
      <h4>Adverb Density 📊</h4>
      <p>${overall.adverbDensity.toFixed(2)}</p>
      <small style="font-size:11px;color:#94a3b8">Per 1,000 words<br>Lower is stronger</small>
    </div>
  `;
}

/**
 * Render voice distribution pie chart
 */
export function renderVoicePie(posts) {
  const canvas = document.getElementById('pieVoice');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const analysis = analyzeVoiceAcrossPosts(posts);
  const overall = analysis.overall;
  
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Active Voice', 'Passive Voice'],
      datasets: [{
        data: [overall.activeSentences, overall.passiveSentences],
        backgroundColor: ['rgba(52, 211, 153, 0.8)', 'rgba(251, 146, 60, 0.8)'],
        borderColor: '#0f172a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f0f4f8', font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(ctx) {
              const label = ctx.label || '';
              const value = ctx.parsed || 0;
              const total = overall.totalSentences;
              const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
              return `${label}: ${value} sentences (${pct}%)`;
            }
          }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render engagement by voice chart
 */
export function renderEngagementByVoiceChart(posts) {
  const canvas = document.getElementById('chartEngagementVoice');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const engagement = calculateEngagementByVoice(posts);
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Active Voice (≥70%)', 'Balanced', 'Passive Voice (≥30%)'],
      datasets: [{
        label: 'Avg Replies',
        data: [
          engagement.activeVoice.avgReplies,
          engagement.balanced.avgReplies,
          engagement.passiveVoice.avgReplies
        ],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',
          'rgba(96, 165, 250, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(96, 165, 250, 1)',
          'rgba(251, 146, 60, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            afterLabel: function(ctx) {
              const counts = [
                engagement.activeVoice.count,
                engagement.balanced.count,
                engagement.passiveVoice.count
              ];
              return `Posts: ${counts[ctx.dataIndex]}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Average Replies', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          ticks: { color: '#cbd5e1', font: { size: 11 } },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render engagement by filler density chart
 */
export function renderEngagementByFillerChart(posts) {
  const canvas = document.getElementById('chartEngagementFiller');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const engagement = calculateEngagementByFillerDensity(posts);
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [engagement.low.label, engagement.medium.label, engagement.high.label],
      datasets: [{
        label: 'Avg Replies',
        data: [
          engagement.low.avgReplies,
          engagement.medium.avgReplies,
          engagement.high.avgReplies
        ],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            afterLabel: function(ctx) {
              const counts = [
                engagement.low.count,
                engagement.medium.count,
                engagement.high.count
              ];
              return `Posts: ${counts[ctx.dataIndex]}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Average Replies', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          title: { display: true, text: 'Filler Word Density', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1', font: { size: 10 } },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render engagement by adverb density chart
 */
export function renderEngagementByAdverbChart(posts) {
  const canvas = document.getElementById('chartEngagementAdverb');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const engagement = calculateEngagementByAdverbDensity(posts);
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [engagement.low.label, engagement.medium.label, engagement.high.label],
      datasets: [{
        label: 'Avg Replies',
        data: [
          engagement.low.avgReplies,
          engagement.medium.avgReplies,
          engagement.high.avgReplies
        ],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            afterLabel: function(ctx) {
              const counts = [
                engagement.low.count,
                engagement.medium.count,
                engagement.high.count
              ];
              return `Posts: ${counts[ctx.dataIndex]}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Average Replies', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          title: { display: true, text: 'Adverb Density', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1', font: { size: 10 } },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}