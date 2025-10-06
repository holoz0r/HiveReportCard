// js/charts.js

export function aggregatePostsByWeek(posts) {
  const weekMap = new Map();
  posts.forEach(p => {
    const date = new Date(p.dateISO);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString();

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { words: 0, images: 0, count: 0, posts: [] });
    }
    const week = weekMap.get(weekKey);
    week.words += p.wordCount;
    week.images += p.imageCount;
    week.count += 1;
    week.posts.push(p);
  });

  return Array.from(weekMap.entries()).map(([date, data]) => ({
    date,
    words: data.words,
    images: data.images,
    avgWords: data.words / data.count,
    avgImages: data.images / data.count,
    count: data.count,
    posts: data.posts
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function aggregatePostsByMonth(posts) {
  const monthMap = new Map();
  posts.forEach(p => {
    const date = new Date(p.dateISO);
    const monthKey = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { words: 0, images: 0, count: 0, posts: [] });
    }
    const month = monthMap.get(monthKey);
    month.words += p.wordCount;
    month.images += p.imageCount;
    month.count += 1;
    month.posts.push(p);
  });

  return Array.from(monthMap.entries()).map(([date, data]) => ({
    date,
    words: data.words,
    images: data.images,
    avgWords: data.words / data.count,
    avgImages: data.images / data.count,
    count: data.count,
    posts: data.posts
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function aggregatePostsByYear(posts) {
  const yearMap = new Map();
  posts.forEach(p => {
    const date = new Date(p.dateISO);
    const yearKey = new Date(date.getFullYear(), 0, 1).toISOString();

    if (!yearMap.has(yearKey)) {
      yearMap.set(yearKey, { words: 0, images: 0, count: 0, posts: [] });
    }
    const year = yearMap.get(yearKey);
    year.words += p.wordCount;
    year.images += p.imageCount;
    year.count += 1;
    year.posts.push(p);
  });

  return Array.from(yearMap.entries()).map(([date, data]) => ({
    date,
    words: data.words,
    images: data.images,
    avgWords: data.words / data.count,
    avgImages: data.images / data.count,
    count: data.count,
    posts: data.posts
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function renderPerPostChart(posts, agg) {
  const ctx = document.getElementById('chartPerPost').getContext('2d');
  const sorted = posts.slice().sort((a, b) => a.dateObj - b.dateObj);

  const dailyData = new Map();
  sorted.forEach(p => {
    const dayKey = p.dateISO.split('T')[0];
    if (!dailyData.has(dayKey)) {
      dailyData.set(dayKey, []);
    }
    dailyData.get(dayKey).push(p);
  });

  const wordDataPoints = [];
  const imageDataPoints = [];

  Array.from(dailyData.keys()).sort().forEach(dayKey => {
    const postsOnDay = dailyData.get(dayKey);
    postsOnDay.forEach((p) => {
      const baseTime = new Date(p.dateISO).getTime();
      const offset = 1000 * 60 * 30;
      wordDataPoints.push({
        x: new Date(baseTime - offset).toISOString(),
        y: p.wordCount
      });
      imageDataPoints.push({
        x: new Date(baseTime + offset).toISOString(),
        y: p.imageCount
      });
    });
  });

  const avgWords = Number(agg.avgWords);
  const avgImages = Number(agg.avgImages);
  const avgWordLine = sorted.map(p => ({ x: p.dateISO, y: avgWords }));
  const avgImageLine = sorted.map(p => ({ x: p.dateISO, y: avgImages }));

  const minDate = sorted[0] ? new Date(sorted[0].dateISO).getTime() : Date.now();
  const maxDate = sorted[sorted.length - 1] ? new Date(sorted[sorted.length - 1].dateISO).getTime() : Date.now();

  return new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [
        {
          type: 'bar', label: 'Words / Post', data: wordDataPoints, backgroundColor: 'rgba(96, 165, 250, 0.8)', yAxisID: 'yWords',
          barThickness: 8, maxBarThickness: 12
        },
        {
          type: 'bar', label: 'Images / Post', data: imageDataPoints, backgroundColor: 'rgba(52, 211, 153, 0.8)', yAxisID: 'yImages',
          barThickness: 8, maxBarThickness: 12
        },
        {
          type: 'line', label: `Avg Words (${avgWords.toFixed(0)})`, data: avgWordLine, borderColor: '#f87171', borderWidth: 2, fill: false, tension: 0, pointRadius: 0, yAxisID: 'yWords', skipGaps: true
        },
        {
          type: 'line', label: `Avg Images (${avgImages.toFixed(1)})`, data: avgImageLine, borderColor: 'rgba(6, 182, 212, 1)', borderWidth: 2, fill: false, tension: 0, pointRadius: 0, yAxisID: 'yImages', skipGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } },
        zoom: {
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' },
          pan: { enabled: true, mode: 'x' },
          limits: { x: { min: minDate, max: maxDate, minRange: 1000 * 60 * 60 * 24 * 7 } }
        }
      },
      scales: {
        yWords: {
          position: 'left',
          title: { display: true, text: 'Words', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        yImages: {
          position: 'right',
          title: { display: true, text: 'Images', color: '#d4dde8', font: { size: 13 } },
          grid: { drawOnChartArea: false },
          ticks: { color: '#cbd5e1' }
        },
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'MMM D, YYYY HH:mm', displayFormats: { day: 'MMM D', month: 'MMM YYYY', hour: 'MMM D HH:mm' } },
          min: minDate, max: maxDate,
          ticks: { color: '#cbd5e1', autoSkip: true, maxTicksLimit: 20 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
}

export function renderPerPostChartAggregated(posts, agg, timeUnit, aggregateWeek, aggregateMonth, aggregateYear) {
  const ctx = document.getElementById('chartPerPost').getContext('2d');

  let aggregated, unitDisplay, tooltipFormat;

  switch (timeUnit) {
    case 'week':
      aggregated = aggregateWeek(posts);
      unitDisplay = 'week';
      tooltipFormat = '[Week of] MMM D, YYYY';
      break;
    case 'month':
      aggregated = aggregateMonth(posts);
      unitDisplay = 'month';
      tooltipFormat = 'MMM YYYY';
      break;
    case 'year':
      aggregated = aggregateYear(posts);
      unitDisplay = 'year';
      tooltipFormat = 'YYYY';
      break;
    default:
      return renderPerPostChart(posts, agg);
  }

  if (aggregated.length === 0) return null;

  const minDate = new Date(aggregated[0].date).getTime();
  const maxDate = new Date(aggregated[aggregated.length - 1].date).getTime();

  const wordDataPoints = aggregated.map(a => ({ x: a.date, y: a.words }));
  const imageDataPoints = aggregated.map(a => ({ x: a.date, y: a.images }));

  const avgWords = Number(agg.avgWords);
  const avgImages = Number(agg.avgImages);

  const avgWordLine = aggregated.map(a => ({ x: a.date, y: avgWords }));
  const avgImageLine = aggregated.map(a => ({ x: a.date, y: avgImages }));

  return new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [
        {
          type: 'bar',
          label: `Words / ${timeUnit === 'day' ? 'Post' : timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)}`,
          data: wordDataPoints,
          backgroundColor: 'rgba(96, 165, 250, 0.8)',
          yAxisID: 'yWords',
          barThickness: timeUnit === 'year' ? 40 : timeUnit === 'month' ? 20 : 12
        },
        {
          type: 'bar',
          label: `Images / ${timeUnit === 'day' ? 'Post' : timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)}`,
          data: imageDataPoints,
          backgroundColor: 'rgba(52, 211, 153, 0.8)',
          yAxisID: 'yImages',
          barThickness: timeUnit === 'year' ? 40 : timeUnit === 'month' ? 20 : 12
        },
        {
          type: 'line',
          label: `Avg Words (${avgWords.toFixed(0)})`,
          data: avgWordLine,
          borderColor: '#f87171',
          borderWidth: 2,
          fill: false,
          tension: 0,
          pointRadius: 0,
          yAxisID: 'yWords'
        },
        {
          type: 'line',
          label: `Avg Images (${avgImages.toFixed(1)})`,
          data: avgImageLine,
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0,
          pointRadius: 0,
          yAxisID: 'yImages'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            title: function (context) {
              const dataIndex = context[0].dataIndex;
              const data = aggregated[dataIndex];
              return `${data.count} post${data.count > 1 ? 's' : ''}`;
            }
          }
        },
        zoom: {
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' },
          pan: { enabled: true, mode: 'x' },
          limits: {
            x: {
              min: minDate, max: maxDate,
              minRange: timeUnit === 'year' ? 1000 * 60 * 60 * 24 * 365 :
                timeUnit === 'month' ? 1000 * 60 * 60 * 24 * 30 :
                  1000 * 60 * 60 * 24 * 7
            }
          }
        }
      },
      scales: {
        yWords: {
          position: 'left',
          title: { display: true, text: 'Words', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        yImages: {
          position: 'right',
          title: { display: true, text: 'Images', color: '#d4dde8', font: { size: 13 } },
          grid: { drawOnChartArea: false },
          ticks: { color: '#cbd5e1' }
        },
        x: {
          type: 'time',
          time: {
            unit: unitDisplay,
            tooltipFormat: tooltipFormat,
            displayFormats: { week: 'MMM D', month: 'MMM YYYY', year: 'YYYY' }
          },
          min: minDate, max: maxDate,
          ticks: { color: '#cbd5e1', autoSkip: true, maxTicksLimit: 20 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      }
    }
  });
}

export function renderCumulativeChart(posts) {
  const ctx = document.getElementById('chartCumulative').getContext('2d');
  const sortedPosts = posts.slice().sort((a, b) => a.dateObj - b.dateObj);

  if (sortedPosts.length === 0) return null;

  const minDate = new Date(sortedPosts[0].dateISO).getTime();
  const maxDate = new Date(sortedPosts[sortedPosts.length - 1].dateISO).getTime();

  const dataPoints = [];
  let cumulativeWords = 0;
  for (let i = 0; i < sortedPosts.length; i++) {
    cumulativeWords += sortedPosts[i].wordCount;
    dataPoints.push({ x: sortedPosts[i].dateISO, y: cumulativeWords });
  }

  return new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Cumulative Words',
        data: dataPoints,
        fill: true,
        backgroundColor: 'rgba(96, 165, 250, 0.2)',
        borderColor: 'rgba(96, 165, 250, 0.9)',
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'MMM D, YYYY', displayFormats: { day: 'MMM D', month: 'MMM YYYY' } },
          min: minDate, max: maxDate,
          ticks: { color: '#cbd5e1', autoSkip: true, maxTicksLimit: 20 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      },
      plugins: {
        zoom: {
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' },
          pan: { enabled: true, mode: 'x' },
          limits: { x: { min: minDate, max: maxDate, minRange: 1000 * 60 * 60 * 24 * 7 } }
        },
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } }
      }
    }
  });
}

export function renderCumulativeChartAggregated(posts, timeUnit, aggregateWeek, aggregateMonth, aggregateYear) {
  const ctx = document.getElementById('chartCumulative').getContext('2d');

  if (timeUnit === 'day') {
    return renderCumulativeChart(posts);
  }

  let aggregated, unitDisplay, tooltipFormat;

  switch (timeUnit) {
    case 'week':
      aggregated = aggregateWeek(posts);
      unitDisplay = 'week';
      tooltipFormat = '[Week of] MMM D, YYYY';
      break;
    case 'month':
      aggregated = aggregateMonth(posts);
      unitDisplay = 'month';
      tooltipFormat = 'MMM YYYY';
      break;
    case 'year':
      aggregated = aggregateYear(posts);
      unitDisplay = 'year';
      tooltipFormat = 'YYYY';
      break;
  }

  if (aggregated.length === 0) return null;

  const minDate = new Date(aggregated[0].date).getTime();
  const maxDate = new Date(aggregated[aggregated.length - 1].date).getTime();

  const dataPoints = [];
  let cumulativeWords = 0;
  aggregated.forEach(a => {
    cumulativeWords += a.words;
    dataPoints.push({ x: a.date, y: cumulativeWords });
  });

  return new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Cumulative Words',
        data: dataPoints,
        fill: true,
        backgroundColor: 'rgba(96, 165, 250, 0.2)',
        borderColor: 'rgba(96, 165, 250, 0.9)',
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        x: {
          type: 'time',
          time: { unit: unitDisplay, tooltipFormat: tooltipFormat, displayFormats: { week: 'MMM D', month: 'MMM YYYY', year: 'YYYY' } },
          min: minDate, max: maxDate,
          ticks: { color: '#cbd5e1', autoSkip: true, maxTicksLimit: 20 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      },
      plugins: {
        zoom: {
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' },
          pan: { enabled: true, mode: 'x' },
          limits: {
            x: {
              min: minDate, max: maxDate,
              minRange: timeUnit === 'year' ? 1000 * 60 * 60 * 24 * 365 :
                timeUnit === 'month' ? 1000 * 60 * 60 * 24 * 30 :
                  1000 * 60 * 60 * 24 * 7
            }
          }
        },
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } }
      }
    }
  });
}

export function renderReadabilityChart(posts) {
  const ctx = document.getElementById('chartReadability').getContext('2d');
  const sortedPosts = posts.slice().sort((a, b) => a.dateObj - b.dateObj);

  const pointMeta = sortedPosts.map(p => ({
    x: p.dateISO,
    y: p.readability.score,
    title: p.title,
    score: p.readability.score,
    grade: p.readability.grade,
    explainer: p.readability.explainer,
    author: p.author,
    permlink: p.permlink
  }));

  const dataPoints = pointMeta.map(m => ({ x: m.x, y: m.y }));

  const minScore = Math.min(...dataPoints.map(p => p.y));
  const maxScore = Math.max(...dataPoints.map(p => p.y));
  const yMin = Math.floor(Math.min(minScore - 5, 0));
  const yMax = Math.ceil(Math.max(maxScore + 5, 100));

  const minDate = new Date(sortedPosts[0].dateISO).getTime();
  const maxDate = new Date(sortedPosts[sortedPosts.length - 1].dateISO).getTime();

  return new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Flesch Reading Ease Score',
        data: dataPoints,
        pointBackgroundColor: 'rgba(168, 85, 247, 0.9)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Flesch Score', color: '#d4dde8', font: { size: 13 } },
          min: yMin, max: yMax,
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'MMM D, YYYY HH:mm', displayFormats: { day: 'MMM D', month: 'MMM YYYY', hour: 'MMM D HH:mm' } },
          min: minDate, max: maxDate,
          ticks: { color: '#cbd5e1', autoSkip: true, maxTicksLimit: 20 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      },
      plugins: {
        zoom: {
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' },
          pan: { enabled: true, mode: 'x' },
          limits: { x: { min: minDate, max: maxDate, minRange: 1000 * 60 * 60 * 24 * 7 } }
        },
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const m = pointMeta[ctx.dataIndex];
              return [
                `${m.title || '(no title)'}`,
                `Score: ${m.score} (Grade ${m.grade})`,
                `Level: ${m.explainer}`
              ];
            }
          },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 12
        }
      },
      onClick: function (evt, elements) {
        if (!elements || !elements.length) return;
        const el = elements[0];
        const idx = el.index;
        const m = pointMeta[idx];
        if (!m) return;
        const url = `https://peakd.com/@${m.author}/${m.permlink}`;
        if (confirm(`Open post:\n"${m.title || '(no title)'}"\n\nOpen in a new tab?`)) {
          window.open(url, '_blank');
        }
      }
    }
  });
}

export function renderReadabilityChartAggregated(posts, timeUnit, aggregateWeek, aggregateMonth, aggregateYear) {
  const ctx = document.getElementById('chartReadability').getContext('2d');

  if (timeUnit === 'day') {
    return renderReadabilityChart(posts);
  }

  let aggregated, unitDisplay, tooltipFormat;

  switch (timeUnit) {
    case 'week':
      aggregated = aggregateWeek(posts);
      unitDisplay = 'week';
      tooltipFormat = '[Week of] MMM D, YYYY';
      break;
    case 'month':
      aggregated = aggregateMonth(posts);
      unitDisplay = 'month';
      tooltipFormat = 'MMM YYYY';
      break;
    case 'year':
      aggregated = aggregateYear(posts);
      unitDisplay = 'year';
      tooltipFormat = 'YYYY';
      break;
  }

  if (aggregated.length === 0) return null;

  const minDate = new Date(aggregated[0].date).getTime();
  const maxDate = new Date(aggregated[aggregated.length - 1].date).getTime();

  const dataPoints = aggregated.map(a => {
    const postsInPeriod = a.posts || [];
    if (postsInPeriod.length === 0) {
      return { x: a.date, y: 0 };
    }
    const avgScore = postsInPeriod.reduce((sum, p) => sum + p.readability.score, 0) / postsInPeriod.length;
    return { x: a.date, y: avgScore };
  });

  const allScores = dataPoints.map(p => p.y);
  const minScore = Math.min(...allScores);
  const maxScore = Math.max(...allScores);
  const yMin = Math.floor(Math.min(minScore - 5, 0));
  const yMax = Math.ceil(Math.max(maxScore + 5, 100));

  return new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Average Flesch Reading Ease Score',
        data: dataPoints,
        pointBackgroundColor: 'rgba(168, 85, 247, 0.9)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Avg Flesch Score', color: '#d4dde8', font: { size: 13 } },
          min: yMin, max: yMax,
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          type: 'time',
          time: { unit: unitDisplay, tooltipFormat: tooltipFormat, displayFormats: { week: 'MMM D', month: 'MMM YYYY', year: 'YYYY' } },
          min: minDate, max: maxDate,
          ticks: { color: '#cbd5e1', autoSkip: true, maxTicksLimit: 20 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      },
      plugins: {
        zoom: {
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x' },
          pan: { enabled: true, mode: 'x' },
          limits: {
            x: {
              min: minDate, max: maxDate,
              minRange: timeUnit === 'year' ? 1000 * 60 * 60 * 24 * 365 :
                timeUnit === 'month' ? 1000 * 60 * 60 * 24 * 30 :
                  1000 * 60 * 60 * 24 * 7
            }
          }
        },
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const idx = ctx.dataIndex;
              const period = aggregated[idx];
              return [
                `Avg Score: ${ctx.parsed.y.toFixed(2)}`,
                `Posts: ${period.count}`
              ];
            }
          },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 12
        }
      }
    }
  });
}
// ... continuing from previous charts.js content

export function renderReadabilityPie(posts, groupReadabilityFn) {
  const counts = {};
  posts.forEach(p => {
    const g = groupReadabilityFn(p.readability.score);
    counts[g] = (counts[g] || 0) + 1;
  });

  const ctx = document.getElementById('pieReadability').getContext('2d');
  const orderedLevels = ['Elementary', 'Middle School', 'High School', 'College', 'University', 'Post-Graduate', 'Professional'];
  const pieLabels = orderedLevels.filter(k => counts[k]);
  const pieData = pieLabels.map(k => counts[k]);

  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieData,
        backgroundColor: [
          '#60a5fa',
          '#34d399',
          '#fbbf24',
          '#fb923c',
          '#f87171',
          '#a78bfa',
          '#94a3b8'
        ],
        borderColor: '#1e293b',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f0f4f8', font: { size: 12 } }
        }
      }
    }
  });
}

export function renderWordDistPie(posts) {
  const buckets = { '<50': 0, '<250': 0, '<500': 0, '<1000': 0, '<2000': 0, '>2000': 0 };
  posts.forEach(p => {
    const w = p.wordCount;
    if (w < 50) buckets['<50']++;
    else if (w < 250) buckets['<250']++;
    else if (w < 500) buckets['<500']++;
    else if (w < 1000) buckets['<1000']++;
    else if (w < 2000) buckets['<2000']++;
    else buckets['>2000']++;
  });

  const ctx = document.getElementById('pieWordDist').getContext('2d');
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(buckets),
      datasets: [{
        data: Object.values(buckets),
        backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#f87171', '#a78bfa'],
        borderColor: '#1e293b',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f0f4f8', font: { size: 12 } }
        }
      }
    }
  });
}

export function computeEngagementByReadability(posts) {
  const levels = ['Elementary', 'Middle School', 'High School', 'College', 'University', 'Post-Graduate', 'Professional'];
  const data = {};

  levels.forEach(level => {
    const postsInLevel = posts.filter(p => p.readability.explainer === level);
    if (postsInLevel.length > 0) {
      const totalReplies = postsInLevel.reduce((sum, p) => sum + p.replies, 0);
      data[level] = {
        count: postsInLevel.length,
        avgReplies: (totalReplies / postsInLevel.length).toFixed(2)
      };
    }
  });

  return data;
}

export function computeEngagementByWordCount(posts) {
  const ranges = [
    { label: '<250', min: 0, max: 249 },
    { label: '250-500', min: 250, max: 500 },
    { label: '501-1000', min: 501, max: 1000 },
    { label: '1001-2000', min: 1001, max: 2000 },
    { label: '>2000', min: 2001, max: Infinity }
  ];

  const data = {};

  ranges.forEach(range => {
    const postsInRange = posts.filter(p => p.wordCount >= range.min && p.wordCount <= range.max);
    if (postsInRange.length > 0) {
      const totalReplies = postsInRange.reduce((sum, p) => sum + p.replies, 0);
      data[range.label] = {
        count: postsInRange.length,
        avgReplies: (totalReplies / postsInRange.length).toFixed(2)
      };
    }
  });

  return data;
}

export function computeEngagementByContentType(posts) {
  const types = ['Image-heavy', 'Balanced', 'Text-heavy', 'Text-only', 'Image-only'];
  const data = {};

  types.forEach(type => {
    const postsOfType = posts.filter(p => p.contentType === type);
    if (postsOfType.length > 0) {
      const totalReplies = postsOfType.reduce((sum, p) => sum + p.replies, 0);
      data[type] = {
        count: postsOfType.length,
        avgReplies: (totalReplies / postsOfType.length).toFixed(2)
      };
    }
  });

  return data;
}

export function renderEngagementByReadability(posts) {
  const ctx = document.getElementById('chartEngagementReadability').getContext('2d');
  const data = computeEngagementByReadability(posts);

  const labels = Object.keys(data);
  const avgReplies = labels.map(label => parseFloat(data[label].avgReplies));

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Replies',
        data: avgReplies,
        backgroundColor: 'rgba(96, 165, 250, 0.8)',
        borderColor: 'rgba(96, 165, 250, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Average Replies', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          ticks: { color: '#cbd5e1', maxRotation: 45, minRotation: 45 },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            afterLabel: function (context) {
              const label = context.label;
              return `Posts: ${data[label].count}`;
            }
          },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1
        }
      }
    }
  });
}

export function renderEngagementByWordCount(posts) {
  const ctx = document.getElementById('chartEngagementWordCount').getContext('2d');
  const data = computeEngagementByWordCount(posts);

  const labels = Object.keys(data);
  const avgReplies = labels.map(label => parseFloat(data[label].avgReplies));

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Replies',
        data: avgReplies,
        backgroundColor: 'rgba(52, 211, 153, 0.8)',
        borderColor: 'rgba(52, 211, 153, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Average Replies', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            afterLabel: function (context) {
              const label = context.label;
              return `Posts: ${data[label].count}`;
            }
          },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1
        }
      }
    }
  });
}

export function renderEngagementByContentType(posts) {
  const ctx = document.getElementById('chartEngagementContentType').getContext('2d');
  const data = computeEngagementByContentType(posts);

  const labels = Object.keys(data);
  const avgReplies = labels.map(label => parseFloat(data[label].avgReplies));

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Replies',
        data: avgReplies,
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
        borderColor: 'rgba(251, 146, 60, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Average Replies', color: '#d4dde8', font: { size: 13 } },
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f0f4f8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            afterLabel: function (context) {
              const label = context.label;
              return `Posts: ${data[label].count}`;
            }
          },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#d4dde8',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1
        }
      }
    }
  });
}