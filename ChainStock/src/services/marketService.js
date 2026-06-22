// =========================================================================
// Live market data service
// Uses Twelve Data API (free tier: 800 requests/day, no CC required)
// Get your free key at: https://twelvedata.com/register
//
// Crypto prices still use CoinGecko (no key needed - free forever)
// =========================================================================

export const TWELVE_DATA_API_KEY = '2a5dbbff85e348ab82db62ce8134597b';

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// ─── CRYPTO via CoinGecko ────────────────────────────────────────────────────

export async function fetchCryptoPrices(ids = ['bitcoin', 'ethereum', 'solana', 'ripple']) {
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&price_change_percentage=24h`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('CoinGecko fetch failed');
  const data = await res.json();
  return data.map((c) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    type: 'crypto',
    price: c.current_price,
    change24h: c.price_change_percentage_24h ?? 0,
    high24h: c.high_24h,
    low24h: c.low_24h,
    volume: c.total_volume,
    marketCap: c.market_cap,
    image: c.image,
  }));
}

export async function fetchCryptoChart(id = 'bitcoin', days = 30) {
  const url = `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('CoinGecko chart fetch failed');
  const data = await res.json();
  return data.prices.map(([ts, price]) => ({
    timestamp: ts,
    price,
    date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));
}

// ─── STOCKS via Twelve Data ──────────────────────────────────────────────────

/**
 * Fetch real-time quote for a stock symbol.
 * Twelve Data free tier works reliably for US + Indian stocks.
 */
export async function fetchStockPrice(symbol) {
  // Normalise Indian BSE symbols: "RELIANCE.BSE" → "RELIANCE:BSE"
  const tdSymbol = symbol.replace('.BSE', ':BSE').replace('.NSE', ':NSE');
  const url = `${TWELVE_DATA_BASE}/quote?symbol=${tdSymbol}&apikey=${TWELVE_DATA_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twelve Data fetch failed for ${symbol}`);
  const d = await res.json();

  if (d.status === 'error') throw new Error(d.message || `No data for ${symbol}`);

  return {
    symbol: d.symbol,
    name: d.name,
    price: parseFloat(d.close),
    open: parseFloat(d.open),
    high: parseFloat(d.high),
    low: parseFloat(d.low),
    volume: parseFloat(d.volume),
    change: parseFloat(d.change),
    change24h: parseFloat(d.percent_change),
    fiftyTwoWeekHigh: parseFloat(d.fifty_two_week?.high ?? 0),
    fiftyTwoWeekLow: parseFloat(d.fifty_two_week?.low ?? 0),
    avgVolume: parseFloat(d.average_volume ?? 0),
    exchange: d.exchange,
  };
}

/**
 * Fetch up to 90 daily OHLCV bars for a stock (for chart + ML model).
 */
export async function fetchStockTimeSeries(symbol, outputsize = 90) {
  const tdSymbol = symbol.replace('.BSE', ':BSE').replace('.NSE', ':NSE');
  const url = `${TWELVE_DATA_BASE}/time_series?symbol=${tdSymbol}&interval=1day&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twelve Data time series failed for ${symbol}`);
  const d = await res.json();

  if (d.status === 'error') throw new Error(d.message || `No series for ${symbol}`);

  return (d.values || [])
    .reverse()
    .map((bar) => ({
      date: bar.datetime,
      open: parseFloat(bar.open),
      high: parseFloat(bar.high),
      low: parseFloat(bar.low),
      price: parseFloat(bar.close),
      volume: parseFloat(bar.volume),
    }));
}

/**
 * Fetch technical indicators (RSI, MACD, EMA) from Twelve Data.
 */
export async function fetchTechnicalIndicators(symbol) {
  const tdSymbol = symbol.replace('.BSE', ':BSE').replace('.NSE', ':NSE');

  const [rsiRes, macdRes, emaRes] = await Promise.allSettled([
    fetch(`${TWELVE_DATA_BASE}/rsi?symbol=${tdSymbol}&interval=1day&time_period=14&apikey=${TWELVE_DATA_API_KEY}`),
    fetch(`${TWELVE_DATA_BASE}/macd?symbol=${tdSymbol}&interval=1day&apikey=${TWELVE_DATA_API_KEY}`),
    fetch(`${TWELVE_DATA_BASE}/ema?symbol=${tdSymbol}&interval=1day&time_period=20&apikey=${TWELVE_DATA_API_KEY}`),
  ]);

  const safe = async (settled) => {
    if (settled.status === 'rejected') return null;
    const data = await settled.value.json();
    return data.status === 'error' ? null : data;
  };

  const [rsi, macd, ema] = await Promise.all([safe(rsiRes), safe(macdRes), safe(emaRes)]);

  return {
    rsi: rsi?.values?.[0]?.rsi ? parseFloat(rsi.values[0].rsi) : null,
    macd: macd?.values?.[0]?.macd ? parseFloat(macd.values[0].macd) : null,
    macdSignal: macd?.values?.[0]?.macd_signal ? parseFloat(macd.values[0].macd_signal) : null,
    ema20: ema?.values?.[0]?.ema ? parseFloat(ema.values[0].ema) : null,
  };
}
