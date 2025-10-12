// js/vocabulary-charts.js

import {
  calculateVocabulary,
  calculateVocabularyOverTime,
  calculateVocabularyByYear,
  getWordFrequencyAnalysis,
  calculateVocabularyDiversity,
  calculateVocabularyGrowth,
  calculateVocabularySophistication
} from './vocabulary.js';

/**
 * Render vocabulary overview cards
 */
export function renderVocabularyCards(posts) {
  const container = document.getElementById('vocabularyCards');
  if (!container) return;
  
  const vocab = calculateVocabulary(posts);
  const diversity = calculateVocabularyDiversity(posts);
  const growth = calculateVocabularyGrowth(posts);
  const analysis = getWordFrequencyAnalysis(posts);
  
  // Get rare words for debugging
  const rareWordsList = Object.entries(vocab.wordFrequency)
    .filter(([word, count]) => count <= 2)
    .sort((a, b) => a[1] - b[1]) // Sort by count (1s first, then 2s)
    .map(([word, count]) => `${word} (${count})`);
  
  // Log debugging info to console
  console.log('=== VOCABULARY DEBUG INFO ===');
  console.log('Total unique words:', vocab.uniqueWords);
  console.log('Hapax legomena (used once):', analysis.hapaxLegomena);
  console.log('Rare words (≤2 uses):', diversity.rareWords);
  console.log('\nFirst 100 single-use words:', analysis.singleUseWords.slice(0, 100));
  console.log('\nFirst 100 rare words (≤2):', rareWordsList.slice(0, 100));
  console.log('\nSample of most common words:', analysis.mostUsed.slice(0, 20));
  console.log('=============================');
  
  container.innerHTML = `
    <div class="card">
      <h4>Total Words Written 📝</h4>
      <p>${vocab.totalWords.toLocaleString()}</p>
    </div>
    <div class="card">
      <h4>Unique Vocabulary 🎯</h4>
      <p>${vocab.uniqueWords.toLocaleString()}</p>
      <small style="font-size:11px;color:#94a3b8">Excludes common stop words</small>
    </div>
    <div class="card">
      <h4>Vocabulary Richness 💎</h4>
      <p>${(vocab.vocabularyRichness * 100).toFixed(2)}%</p>
      <small style="font-size:11px;color:#94a3b8">Unique words ÷ total words<br>Higher = more diverse vocabulary</small>
    </div>
    <div class="card">
      <h4>Avg Monthly Growth 📈</h4>
      <p>${growth.avgMonthlyGrowth} words</p>
    </div>
    <div class="card">
      <h4>Avg Word Length ✏️</h4>
      <p>${parseFloat(diversity.avgWordLength).toFixed(2)} chars</p>
    </div>
    <div class="card">
      <h4>Rare Words (≤2 uses) 🦄</h4>
      <p>${diversity.rareWords} (${(diversity.rareWordRatio * 100).toFixed(1)}%)</p>
      <small style="font-size:11px;color:#94a3b8">Words used 2 times or less<br><button onclick="downloadRareWords()" style="margin-top:4px;padding:4px 8px;font-size:10px">Download List</button></small>
    </div>
    <div class="card">
      <h4>Hapax Legomena 🌟</h4>
      <p>${analysis.hapaxLegomena}</p>
      <small style="font-size:11px;color:#94a3b8">Words used only once<br><button onclick="downloadHapaxWords()" style="margin-top:4px;padding:4px 8px;font-size:10px">Download List</button></small>
    </div>
  `;
  
  // Store data globally for download functions
  window._vocabDebugData = {
    singleUseWords: analysis.singleUseWords,
    rareWords: rareWordsList,
    wordFrequency: vocab.wordFrequency,
    mostUsed: analysis.mostUsed
  };
}

/**
 * Render vocabulary growth over time chart
 */
export function renderVocabularyGrowthChart(posts) {
  const canvas = document.getElementById('chartVocabGrowth');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const timeline = calculateVocabularyOverTime(posts);
  
  if (timeline.length === 0) return null;
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Cumulative Vocabulary',
          data: timeline.map(t => ({ x: t.month + '-01', y: t.cumulativeVocabulary })),
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'yLeft'
        },
        {
          label: 'New Words per Month',
          data: timeline.map(t => ({ x: t.month + '-01', y: t.newWordsIntroduced })),
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'yRight'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
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
        yLeft: {
          position: 'left',
          title: { display: true, text: 'Cumulative Vocabulary', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        yRight: {
          position: 'right',
          title: { display: true, text: 'New Words', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { drawOnChartArea: false }
        },
        x: {
          type: 'time',
          time: { unit: 'month', displayFormats: { month: 'MMM YYYY' } },
          ticks: { color: '#cbd5e1', autoSkip: true, maxTicksLimit: 12 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render word frequency distribution chart
 */
export function renderWordFrequencyChart(posts) {
  const canvas = document.getElementById('chartWordFreq');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const analysis = getWordFrequencyAnalysis(posts);
  const topWords = analysis.mostUsed.slice(0, 20);
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topWords.map(w => w.word),
      datasets: [{
        label: 'Usage Count',
        data: topWords.map(w => w.count),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'Times Used', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        y: {
          ticks: { color: '#cbd5e1', font: { size: 11 } },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render word length distribution chart
 */
export function renderWordLengthChart(posts) {
  const canvas = document.getElementById('chartWordLength');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const sophistication = calculateVocabularySophistication(posts);
  const lengthData = sophistication.wordsByLength.filter(d => d.length <= 15);
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: lengthData.map(d => d.length + ' chars'),
      datasets: [{
        label: 'Number of Words',
        data: lengthData.map(d => d.count),
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
        borderColor: 'rgba(251, 146, 60, 1)',
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
          padding: 10
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Word Count', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          title: { display: true, text: 'Word Length', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}

/**
 * Render vocabulary by year comparison
 */
export function renderVocabularyByYearChart(posts) {
  const canvas = document.getElementById('chartVocabByYear');
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  
  try {
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
  } catch (e) { /* ignore */ }
  
  const yearlyStats = calculateVocabularyByYear(posts);
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: yearlyStats.map(y => y.year),
      datasets: [
        {
          label: 'Unique Words',
          data: yearlyStats.map(y => y.uniqueWords),
          backgroundColor: 'rgba(96, 165, 250, 0.8)',
          borderColor: 'rgba(96, 165, 250, 1)',
          borderWidth: 1
        },
        {
          label: 'Posts Written',
          data: yearlyStats.map(y => y.postsCount),
          backgroundColor: 'rgba(52, 211, 153, 0.8)',
          borderColor: 'rgba(52, 211, 153, 1)',
          borderWidth: 1,
          yAxisID: 'yRight'
        }
      ]
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
          padding: 10
        }
      },
      scales: {
        y: {
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: 'Unique Words', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        yRight: {
          position: 'right',
          beginAtZero: true,
          title: { display: true, text: 'Posts', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { drawOnChartArea: false }
        },
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
  
  return chart;
}