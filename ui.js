// js/ui.js

export function setStatus(message) {
  const el = document.getElementById('statusBar');
  el.style.opacity = 1;
  el.innerText = message || '';
}

export function fadeStatus(ms = 4000) {
  setTimeout(() => {
    const el = document.getElementById('statusBar');
    el.style.opacity = 0;
  }, ms);
}

export function formatDate(d) {
  return d ? (new Date(d)).toLocaleDateString() : '-';
}

export function isoDay(d) {
  return (new Date(d)).toISOString().slice(0, 10);
}

export function computeAggregates(posts) {
  const count = posts.length;
  const totalWords = posts.reduce((s, p) => s + p.wordCount, 0);
  const totalImages = posts.reduce((s, p) => s + p.imageCount, 0);
  const avgWords = count ? (totalWords / count).toFixed(2) : 0;
  const avgImages = count ? (totalImages / count).toFixed(2) : 0;
  const totalReplies = posts.reduce((s, p) => s + p.replies, 0);
  const avgReplies = count ? (totalReplies / count).toFixed(2) : 0;

  const contentTypes = {
    'Image-heavy': posts.filter(p => p.contentType === 'Image-heavy').length,
    'Balanced': posts.filter(p => p.contentType === 'Balanced').length,
    'Text-heavy': posts.filter(p => p.contentType === 'Text-heavy').length,
    'Text-only': posts.filter(p => p.contentType === 'Text-only').length,
    'Image-only': posts.filter(p => p.contentType === 'Image-only').length
  };

  const oldest = posts[posts.length - 1].dateObj;
  const newest = posts[0].dateObj;
  const daysSpan = Math.max(1, Math.ceil((new Date() - oldest) / 86400000));
  const postsPerDay = (count / daysSpan).toFixed(3);

  const byAsc = [...posts].slice().sort((a, b) => new Date(a.created) - new Date(b.created));
  let longestGap = 0, gapFrom = null, gapTo = null;
  for (let i = 1; i < byAsc.length; i++) {
    const prev = new Date(byAsc[i - 1].created);
    const curr = new Date(byAsc[i].created);
    const gapDays = Math.floor((curr - prev) / 86400000);
    if (gapDays > longestGap) {
      longestGap = gapDays;
      gapFrom = prev;
      gapTo = curr;
    }
  }

  const daySet = Array.from(new Set(byAsc.map(p => isoDay(p.created)))).sort();
  let longestStreak = 0, curStreak = 1, streakStart = null, streakEnd = null, curStart = null;
  if (daySet.length) {
    curStart = new Date(daySet[0]);
    for (let i = 1; i < daySet.length; i++) {
      const prev = new Date(daySet[i - 1]);
      const curr = new Date(daySet[i]);
      const diff = Math.round((curr - prev) / 86400000);
      if (diff === 1) curStreak++;
      else {
        if (curStreak > longestStreak) {
          longestStreak = curStreak;
          streakStart = curStart;
          streakEnd = prev;
        }
        curStreak = 1;
        curStart = curr;
      }
    }
    const lastDay = new Date(daySet[daySet.length - 1]);
    if (curStreak > longestStreak) {
      longestStreak = curStreak;
      streakStart = curStart;
      streakEnd = lastDay;
    }
  }

  return {
    postCount: count,
    firstPost: oldest,
    recentPost: newest,
    totalWords, totalImages, avgWords, avgImages, postsPerDay,
    longestGapDays: longestGap, gapFrom, gapTo,
    longestStreak, streakStart, streakEnd,
    totalReplies, avgReplies,
    contentTypes
  };
}

export function renderCards(agg, filtered) {
  const grid = document.getElementById('cardGrid');

  const valid = filtered.filter(p => p.wordCount > 0 && p.imageCount > 0);
  let wordsPerPicture = 'N/A', picturesPerWord = 'N/A';
  if (valid.length) {
    const totalW = valid.reduce((s, p) => s + p.wordCount, 0);
    const totalI = valid.reduce((s, p) => s + p.imageCount, 0);
    if (totalI > 0) wordsPerPicture = (totalW / totalI).toFixed(2);
    if (totalW > 0) picturesPerWord = (totalI / totalW).toFixed(6);
  }

  const gapFrom = agg.gapFrom ? formatDate(agg.gapFrom) : '-';
  const gapTo = agg.gapTo ? formatDate(agg.gapTo) : '-';
  const streakFrom = agg.streakStart ? formatDate(agg.streakStart) : '-';
  const streakTo = agg.streakEnd ? formatDate(agg.streakEnd) : '-';

  grid.innerHTML = `
    <div class="card"><h4>First Post 🗓️ </h4><p>${formatDate(agg.firstPost)}</p></div>
    <div class="card"><h4>Most Recent Post 🗓️</h4><p>${formatDate(agg.recentPost)}</p></div>
    <div class="card"><h4>Total Posts ✏️ </h4><p>${agg.postCount}</p></div>
    <div class="card"><h4>Posts / Day 📅 </h4><p>${agg.postsPerDay}</p></div>

    <div class="card"><h4>Longest Streak ⏳</h4><p>${agg.longestStreak} days</p></div>
    <div class="card"><h4>Streak Period 🏃‍♂️➡️ </h4><p>${streakFrom} → ${streakTo}</p></div>
    <div class="card"><h4>Longest Break 🏖️</h4><p>${agg.longestGapDays} days</p></div>
    <div class="card"><h4>Break Period 🛣️</h4><p>${gapFrom} → ${gapTo}</p></div>

    <div class="card"><h4>Total Words 📚 </h4><p>${agg.totalWords}</p></div>
    <div class="card"><h4>Avg Words/Post 🗒️ </h4><p>${agg.avgWords}</p></div>
    <div class="card"><h4>Total Replies 💬 </h4><p>${agg.totalReplies}</p></div>
    <div class="card"><h4>Avg Replies/Post 🗣️ </h4><p>${agg.avgReplies}</p></div>

    <div class="card"><h4>Total Images 🖼️</h4><p>${agg.totalImages}</p></div>
    <div class="card"><h4>Avg Images/Post 👨‍🎨</h4><p>${agg.avgImages}</p></div>
    <div class="card"><h4>Words Per Picture 📃 </h4><p>${wordsPerPicture}</p></div>
    <div class="card"><h4>Pictures Per Word 🎨 </h4><p>${picturesPerWord}</p></div>

    <div class="card"><h4>Image-Heavy Posts 🖼️</h4><p>${agg.contentTypes['Image-heavy']}</p></div>
    <div class="card"><h4>Text-Heavy Posts📕</h4><p>${agg.contentTypes['Text-heavy']}</p></div>
    <div class="card"><h4>Balanced Posts📰</h4><p>${agg.contentTypes['Balanced']}</p></div>
  `;
}

export function renderBreaksStreaksTable(posts) {
  const container = document.getElementById('breaksStreaksTable');
  if (!container) return;
  if (!posts || posts.length === 0) {
    container.innerHTML = '';
    return;
  }

  // sort ascending by created
  const byAsc = [...posts].sort((a, b) => new Date(a.created) - new Date(b.created));

  // compute gaps (breaks) between consecutive posts
  const gaps = [];
  for (let i = 1; i < byAsc.length; i++) {
    const prev = new Date(byAsc[i - 1].created);
    const curr = new Date(byAsc[i].created);
    const days = Math.floor((curr - prev) / 86400000);
    if (days > 0) gaps.push({ from: prev, to: curr, days });
  }
  gaps.sort((a, b) => b.days - a.days);
  const topGaps = gaps.slice(0, 5);

  // compute streaks (consecutive posting days)
  const daySet = Array.from(new Set(byAsc.map(p => (new Date(p.created)).toISOString().slice(0, 10)))).sort();
  const streaks = [];
  if (daySet.length) {
    let curStart = new Date(daySet[0]);
    let curLen = 1;
    for (let i = 1; i < daySet.length; i++) {
      const prev = new Date(daySet[i - 1]);
      const curr = new Date(daySet[i]);
      const diff = Math.round((curr - prev) / 86400000);
      if (diff === 1) {
        curLen++;
      } else {
        streaks.push({ start: curStart, end: prev, len: curLen });
        curStart = curr;
        curLen = 1;
      }
    }
    const lastDay = new Date(daySet[daySet.length - 1]);
    streaks.push({ start: curStart, end: lastDay, len: curLen });
  }
  streaks.sort((a, b) => b.len - a.len);
  const topStreaks = streaks.slice(0, 5);

  // helper for date formatting
  const fmt = d => d ? formatDate(d) : '-';

  // build HTML (two small tables side-by-side on wide screens)
  let html = `<div style="display:flex;flex-wrap:wrap;gap:12px">`;

  // Top Breaks
  html += `<div style="min-width:260px;flex:1">
    <h4 style="text-align:center">Top 5 Longest Breaks</h4>
    <table>
      <thead><tr><th>From</th><th>To</th><th style="text-align:right">Days</th></tr></thead>
      <tbody>`;
  if (topGaps.length === 0) {
    html += `<tr><td colspan="3">No breaks found</td></tr>`;
  } else {
    topGaps.forEach(g => {
      html += `<tr><td>${fmt(g.from)}</td><td>${fmt(g.to)}</td><td style="text-align:right">${g.days}</td></tr>`;
    });
  }
  html += `</tbody></table></div>`;

  // Top Streaks
  html += `<div style="min-width:260px;flex:1">
    <h4 style="text-align:center">Top 5 Longest Streaks</h4>
    <table>
      <thead><tr><th>Start</th><th>End</th><th style="text-align:right">Days</th></tr></thead>
      <tbody>`;
  if (topStreaks.length === 0) {
    html += `<tr><td colspan="3">No streaks found</td></tr>`;
  } else {
    topStreaks.forEach(s => {
      html += `<tr><td>${fmt(s.start)}</td><td>${fmt(s.end)}</td><td style="text-align:right">${s.len}</td></tr>`;
    });
  }
  html += `</tbody></table></div>`;

  html += `</div>`; // end flex

  container.innerHTML = html;
}

// ...existing code...

export function renderDowHeatmap(posts) {
  const container = document.getElementById('heatmap');
  container.innerHTML = '';

  const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  posts.forEach(p => {
    const d = p.dateObj.getDay();
    counts[d] = (counts[d] || 0) + 1;
  });

  const order = [1, 2, 3, 4, 5, 6, 0];
  const max = Math.max(...Object.values(counts), 1);

  order.forEach((dow, idx) => {
    const col = document.createElement('div');
    col.className = 'heat-col';
    const label = document.createElement('div');
    label.className = 'heat-label';
    label.innerText = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx];
    const box = document.createElement('div');
    box.className = 'heat-cell';
    const value = counts[dow] || 0;
    const alpha = 0.2 + 0.8 * (value / max);
    box.style.background = `rgba(59, 130, 246, ${alpha})`;
    box.innerText = value;
    col.appendChild(label);
    col.appendChild(box);
    container.appendChild(col);
  });
}

export function renderMonthHeatmap(posts) {
  const container = document.getElementById('monthmap');
  container.innerHTML = '';

  const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 };
  posts.forEach(p => {
    const m = p.dateObj.getMonth();
    counts[m] = (counts[m] || 0) + 1;
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const max = Math.max(...Object.values(counts), 1);

  for (let m = 0; m < 12; m++) {
    const col = document.createElement('div');
    col.className = 'heat-col';
    const label = document.createElement('div');
    label.className = 'heat-label';
    label.innerText = monthNames[m];
    const box = document.createElement('div');
    box.className = 'heat-cell';
    const value = counts[m] || 0;
    const alpha = 0.2 + 0.8 * (value / max);
    box.style.background = `rgba(52, 211, 153, ${alpha})`;
    box.innerText = value;
    col.appendChild(label);
    col.appendChild(box);
    container.appendChild(col);
  }
}

export function renderYearHeatmap(posts) {
  const container = document.getElementById('yearmap');
  container.innerHTML = '';

  const counts = {};
  posts.forEach(p => {
    const y = p.dateObj.getFullYear();
    counts[y] = (counts[y] || 0) + 1;
  });

  const years = Object.keys(counts).sort();
  const max = Math.max(...Object.values(counts), 1);

  years.forEach(year => {
    const col = document.createElement('div');
    col.className = 'heat-col';
    const label = document.createElement('div');
    label.className = 'heat-label';
    label.innerText = year;
    const box = document.createElement('div');
    box.className = 'heat-cell';
    const value = counts[year];
    const alpha = 0.2 + 0.8 * (value / max);
    box.style.background = `rgba(251, 146, 60, ${alpha})`;
    box.innerText = value;
    col.appendChild(label);
    col.appendChild(box);
    container.appendChild(col);
  });
}

export function renderHourHeatmap(posts) {
  const container = document.getElementById('hourmap');
  container.innerHTML = '';

  const counts = {};
  for (let h = 0; h < 24; h++) counts[h] = 0;

  posts.forEach(p => {
    const h = p.dateObj.getHours();
    counts[h] = (counts[h] || 0) + 1;
  });

  const max = Math.max(...Object.values(counts), 1);

  for (let h = 0; h < 24; h++) {
    const col = document.createElement('div');
    col.className = 'heat-col';
    const label = document.createElement('div');
    label.className = 'heat-label small';
    label.innerText = `${h}h`;
    const box = document.createElement('div');
    box.className = 'heat-cell small';
    const value = counts[h] || 0;
    const alpha = 0.2 + 0.8 * (value / max);
    box.style.background = `rgba(168, 85, 247, ${alpha})`;
    box.innerText = value;
    col.appendChild(label);
    col.appendChild(box);
    container.appendChild(col);
  }
}

export function renderReadabilityTable(posts, groupReadabilityFn) {
  const counts = {};
  posts.forEach(p => {
    const g = groupReadabilityFn(p.readability.score);
    counts[g] = (counts[g] || 0) + 1;
  });
  const total = posts.length;

  let html = `<table><tr><th>Reading Level</th><th>Posts</th><th>%</th></tr>`;
  const orderedLevels = ['Elementary', 'Middle School', 'High School', 'College', 'University', 'Post-Graduate', 'Professional'];
  orderedLevels.forEach(k => {
    if (counts[k]) {
      html += `<tr><td>${k}</td><td>${counts[k]}</td><td>${((counts[k] / total) * 100).toFixed(1)}%</td></tr>`;
    }
  });
  html += `</table>`;
  document.getElementById('readabilityTable').innerHTML = html;
}

export function renderWordDistTable(posts) {
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
  const total = posts.length;
  let html = `<table><tr><th>Word Range</th><th>Posts</th><th>%</th></tr>`;
  Object.keys(buckets).forEach(k => html += `<tr><td>${k}</td><td>${buckets[k]}</td><td>${((buckets[k] / total) * 100).toFixed(1)}%</td></tr>`);
  html += `</table>`;
  document.getElementById('wordDistTable').innerHTML = html;
}

export function renderPostsList(posts) {
  const el = document.getElementById('postsList');
  el.innerHTML = '';
  posts.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `<div style="font-weight:700; font-size: 15px;">${i + 1}. ${escapeHtml(p.title || '(no title)')}</div>
      <div class="small">Posted by @${p.author} on ${new Date(p.created).toLocaleString()}</div>
      <div style="margin-top:6px"><strong>Words:</strong> ${p.wordCount} &nbsp; <strong>Images:</strong> ${p.imageCount} &nbsp; <strong>Replies:</strong> ${p.replies}</div>
      <div style="margin-top:4px"><strong>Type:</strong> ${p.contentType}</div>
      <div style="margin-top:6px"><strong>Readability:</strong> ${p.readability.score} (Grade ${p.readability.grade}) – <em>${p.readability.explainer}</em></div>
      <div style="margin-top:8px"><a href="https://peakd.com/@${p.author}/${p.permlink}" target="_blank">View Post</a></div>`;
    el.appendChild(div);
  });
}

export function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[c]);
}

export function escapeCsv(v) {
  return `"${(v || '').toString().replace(/"/g, '""')}"`;
}

export function exportChartPNG(chartInstance) {
  if (!chartInstance) return alert('Chart not ready');
  const dataUrl = chartInstance.toBase64Image();
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'chart.png';
  a.click();
}

export function exportCSV(displayedPosts, escapeCsvFn) {
  if (!displayedPosts || !displayedPosts.length) return alert('No posts to export');
  const headers = ['Author', 'Title', 'Date', 'Content', 'Word Count', 'Image Count', 'Readability Score', 'Grade', 'Level'];
  const rows = [headers.join(',')];
  displayedPosts.forEach(p => {
    const line = [
      p.author,
      escapeCsvFn(p.title || ''),
      escapeCsvFn(p.dateISO),
      escapeCsvFn((p.body || '').replace(/\n/g, ' ')),
      p.wordCount,
      p.imageCount,
      p.readability.score,
      p.readability.grade,
      escapeCsvFn(p.readability.explainer)
    ];
    rows.push(line.join(','));
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hive_posts.csv';
  a.click();
  a.remove();
}

export function exportJSON(displayedPosts) {
  if (!displayedPosts || !displayedPosts.length) return alert('No posts to export');
  const blob = new Blob([JSON.stringify(displayedPosts, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hive_posts.json';
  a.click();
  a.remove();
}

export function exportChartByCanvasId(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    alert('Chart not found');
    return;
  }
  
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${canvasId}_export.png`;
  a.click();
}

export function resetZoom(canvasId) {
  // Get the chart instance from the global chart registry
  const chartInstance = Chart.getChart(canvasId);
  if (chartInstance && chartInstance.resetZoom) {
    chartInstance.resetZoom();
  }
}