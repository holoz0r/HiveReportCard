// js/api.js

export async function fetchAuthoredPosts(username, mode, statusCallback) {
  const limit = 20;
  let entryId = 0;
  let collected = [];
  const seen = new Set();

  while (true) {
    if (statusCallback) {
      statusCallback(`Loading posts… (${collected.length} fetched so far)`);
    }
    
    const data = await new Promise((resolve, reject) => {
      hive.api.getBlog(username, entryId, limit, function(err, result) {
        if (err) return reject(err);
        resolve(result || []);
      });
    });

    if (!data || data.length === 0) break;

    for (const item of data) {
      const c = item.comment;
      if (!c) continue;
      if (c.author !== username) continue;
      if (c.permlink && /hive-\d{6}$/.test(c.permlink)) continue;
      if (c.body && c.body.includes('Posted via <a href="https://d.buzz" data-link="promote-link">D.Buzz</a>')) continue;
      if (c.body && c.body.startsWith('This is a cross post of [')) continue;
      const key = `${c.author}/${c.permlink}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(item);
      if (mode === '100' && collected.length >= 100) break;
    }

    if (mode === '100' && collected.length >= 100) break;
    if (data.length < limit) break;
    entryId = data[data.length - 1].entry_id + 1;
  }

  collected = deduplicateByTitle(collected);
  return collected;
}

function deduplicateByTitle(posts) {
  const titleGroups = {};

  posts.forEach(item => {
    const c = item.comment;
    if (!c || !c.title) return;

    const normalizedTitle = c.title.toLowerCase().trim().replace(/\s+/g, ' ');

    if (!titleGroups[normalizedTitle]) {
      titleGroups[normalizedTitle] = [];
    }

    titleGroups[normalizedTitle].push(item);
  });

  const deduplicated = [];

  Object.values(titleGroups).forEach(group => {
    if (group.length === 1) {
      deduplicated.push(group[0]);
    } else {
      group.sort((a, b) => {
        const dateA = new Date(a.comment.created);
        const dateB = new Date(b.comment.created);
        return dateA - dateB;
      });

      const keeper = [];

      for (let i = 0; i < group.length; i++) {
        const current = group[i];
        const currentDate = new Date(current.comment.created);
        let isDuplicate = false;

        for (let j = 0; j < keeper.length; j++) {
          const keptDate = new Date(keeper[j].comment.created);
          const daysDiff = Math.abs((currentDate - keptDate) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 7) {
            isDuplicate = true;
            const currentBody = current.comment.body || '';
            const keptBody = keeper[j].comment.body || '';

            if (currentBody.length > keptBody.length) {
              keeper[j] = current;
            }
            break;
          }
        }

        if (!isDuplicate) {
          keeper.push(current);
        }
      }

      deduplicated.push(...keeper);
    }
  });

  return deduplicated;
}