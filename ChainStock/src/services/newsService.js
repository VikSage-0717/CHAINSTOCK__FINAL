// =========================================================================
// News service — NewsAPI.org
// Free tier: 100 requests/day, no CC required
// Get your free key at: https://newsapi.org/register
//
// NOTE: NewsAPI free tier only works from localhost in development.
// For production APK, use newsdata.io instead (free, works on-device):
//   https://newsdata.io/register   → 200 requests/day free
// Switch PROVIDER below to 'newsdata' if testing on a physical device/APK.
// =========================================================================

const NEWS_API_KEY     = 'f62325e23fef4b7bb3ccbae0fd64d475';
const NEWSDATA_API_KEY = 'pub_95e5075c4e854291a3e667a18b3cae6f';

// 'newsapi'  → works in web/emulator dev (localhost only)
// 'newsdata' → works on physical device / APK
const PROVIDER = 'newsdata';

/**
 * Fetch recent news articles for a given company/asset.
 * @param {string} query   - company name or ticker, e.g. "Apple AAPL"
 * @param {number} count   - max articles to return
 * @returns {Promise<Article[]>}
 *   Article: { title, source, publishedAt, url, sentiment, score }
 */
export async function fetchNews(query, count = 8) {
  if (PROVIDER === 'newsapi') {
    return fetchFromNewsAPI(query, count);
  }
  return fetchFromNewsData(query, count);
}

async function fetchFromNewsAPI(query, count) {
  const url =
    `https://newsapi.org/v2/everything` +
    `?q=${encodeURIComponent(query)}` +
    `&language=en&sortBy=publishedAt&pageSize=${count}` +
    `&apiKey=${NEWS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('NewsAPI request failed');
  const data = await res.json();

  if (data.status !== 'ok') throw new Error(data.message || 'NewsAPI error');

  return (data.articles || []).map((a) => ({
    title: a.title,
    source: a.source?.name ?? 'Unknown',
    publishedAt: a.publishedAt,
    url: a.url,
    ...scoreSentiment(a.title + ' ' + (a.description || '')),
  }));
}

async function fetchFromNewsData(query, count) {
  const url =
    `https://newsdata.io/api/1/news` +
    `?apikey=${NEWSDATA_API_KEY}` +
    `&q=${encodeURIComponent(query)}` +
    `&language=en&size=${count}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('NewsData request failed');
  const data = await res.json();

  if (data.status !== 'success') throw new Error(data.message || 'NewsData error');

  return (data.results || []).map((a) => ({
    title: a.title,
    source: a.source_id ?? 'Unknown',
    publishedAt: a.pubDate,
    url: a.link,
    ...scoreSentiment(a.title + ' ' + (a.description || '')),
  }));
}

// ─── Client-side sentiment scoring ─────────────────────────────────────────

const POSITIVE_WORDS = [
  'surge', 'rally', 'gain', 'rise', 'beat', 'record', 'profit', 'growth',
  'boost', 'strong', 'upgrade', 'buy', 'bullish', 'outperform', 'exceed',
  'positive', 'high', 'momentum', 'expansion', 'innovation', 'breakthrough',
];

const NEGATIVE_WORDS = [
  'fall', 'drop', 'crash', 'loss', 'miss', 'decline', 'cut', 'weak',
  'sell', 'bearish', 'underperform', 'risk', 'concern', 'warning', 'debt',
  'layoff', 'recession', 'inflation', 'default', 'downgrade', 'volatile',
];

function scoreSentiment(text) {
  const lower = text.toLowerCase();
  let score = 50;

  POSITIVE_WORDS.forEach((w) => { if (lower.includes(w)) score += 5; });
  NEGATIVE_WORDS.forEach((w) => { if (lower.includes(w)) score -= 5; });

  score = Math.max(0, Math.min(100, score));

  const sentiment =
    score >= 60 ? 'Positive' :
    score <= 40 ? 'Negative' :
    'Neutral';

  return { sentiment, score };
}
