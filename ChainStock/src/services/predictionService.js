// =========================================================================
// On-device price predictor — NO TensorFlow.js
// Uses a pure JavaScript implementation to avoid the 'isTypedArray' crash
// that occurs when TF.js backend isn't ready on Android.
//
// Algorithm: Exponential Smoothing + Linear Regression trend
// This is fast, reliable, works on all platforms, and gives good results
// for short-term price forecasting.
// =========================================================================

// ─── Moving average (exported for chart smoothing) ────────────────────────────
export function movingAverage(series, window = 3) {
  return series.map((_, i) => {
    if (i < window - 1) return series[i];
    const slice = series.slice(i - window + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / window;
  });
}

// ─── Math helpers ─────────────────────────────────────────────────────────────
const mean   = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdDev = (arr) => {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
};

// ─── Linear regression ────────────────────────────────────────────────────────
function linearRegression(values) {
  const n  = values.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = mean(xs);
  const my = mean(values);

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (values[i] - my);
    den += (xs[i] - mx) ** 2;
  }

  const slope     = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

// ─── Holt's double exponential smoothing ─────────────────────────────────────
function holtSmoothing(values, alpha = 0.3, beta = 0.1) {
  if (values.length < 2) return { level: values[0], trend: 0 };

  let level = values[0];
  let trend = values[1] - values[0];

  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  return { level, trend };
}

// ─── Volatility-aware noise for realistic forecast ────────────────────────────
function addNoise(price, volatility, step, totalSteps) {
  // Noise decreases as forecast goes further (mean reversion)
  const decayFactor = 1 - (step / totalSteps) * 0.3;
  const noise = (Math.random() * 2 - 1) * volatility * price * decayFactor;
  return price + noise;
}

// ─── RSI from price array ─────────────────────────────────────────────────────
function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains  += diff;
    else          losses -= diff;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  return 100 - 100 / (1 + rs);
}

// ─── Main prediction function ─────────────────────────────────────────────────
/**
 * Predict future prices using Holt's exponential smoothing + linear regression.
 *
 * @param {{ price: number }[]} historicalPoints
 * @param {number}              forecastDays
 * @param {(pct:number)=>void}  [onProgress]
 * @returns {Promise<PredictionResult>}
 */
export async function predictPrices(historicalPoints, forecastDays = 30, onProgress) {
  if (!historicalPoints || historicalPoints.length < 10) {
    throw new Error('Need at least 10 historical data points to predict');
  }

  const prices = historicalPoints.map((p) => {
    const v = parseFloat(p.price);
    if (isNaN(v)) throw new Error('Invalid price data in historical points');
    return v;
  });

  onProgress?.(10);

  // ── 1. Linear trend ──────────────────────────────────────────────────────
  const { slope, intercept } = linearRegression(prices);
  onProgress?.(25);

  // ── 2. Holt smoothing for level + trend ──────────────────────────────────
  const { level, trend } = holtSmoothing(prices);
  onProgress?.(40);

  // ── 3. Volatility estimate (daily std dev as % of price) ─────────────────
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const dailyVol = stdDev(returns);
  onProgress?.(55);

  // ── 4. Generate forecast ──────────────────────────────────────────────────
  // Blend Holt (short-term) with linear regression (long-term trend)
  const forecast = [];
  let holtLevel = level;
  let holtTrend = trend;

  for (let i = 0; i < forecastDays; i++) {
    const holtForecast = holtLevel + holtTrend;
    const regForecast  = intercept + slope * (prices.length + i);

    // Weight: Holt dominates short-term, regression dominates long-term
    const weight     = Math.min(i / forecastDays, 0.6);
    const blended    = holtForecast * (1 - weight) + regForecast * weight;
    const withNoise  = addNoise(blended, dailyVol, i, forecastDays);

    // Clamp to reasonable range (±50% of current price)
    const current    = prices[prices.length - 1];
    const clamped    = Math.max(current * 0.5, Math.min(current * 1.5, withNoise));

    forecast.push(parseFloat(clamped.toFixed(4)));

    // Update Holt state
    const prevLevel = holtLevel;
    holtLevel = 0.3 * clamped + 0.7 * (holtLevel + holtTrend);
    holtTrend = 0.1 * (holtLevel - prevLevel) + 0.9 * holtTrend;

    onProgress?.(55 + Math.round(((i + 1) / forecastDays) * 35));
  }

  // ── 5. Signal + confidence ────────────────────────────────────────────────
  const currentPrice = prices[prices.length - 1];
  const finalPrice   = forecast[forecast.length - 1];
  const pctChange    = ((finalPrice - currentPrice) / currentPrice) * 100;

  const rsi    = calcRSI(prices);
  const trendStrength = Math.abs(slope) / (mean(prices) / 100); // normalized slope

  // Signal: combine price forecast direction with RSI and trend
  let signal;
  if (pctChange > 2 && rsi < 70 && slope > 0) {
    signal = 'BUY';
  } else if (pctChange < -2 && rsi > 30 && slope < 0) {
    signal = 'SELL';
  } else {
    signal = 'HOLD';
  }

  // Confidence based on: trend consistency + low volatility + RSI not extreme
  const volScore       = Math.max(0, 1 - dailyVol * 10);         // lower vol = higher conf
  const trendScore     = Math.min(1, trendStrength * 5);          // stronger trend = higher conf
  const rsiScore       = 1 - Math.abs(rsi - 50) / 50;            // RSI near 50 = neutral
  const rawConfidence  = (volScore * 0.4 + trendScore * 0.4 + rsiScore * 0.2) * 100;
  const confidence     = Math.max(45, Math.min(90, Math.round(rawConfidence)));

  const support        = Math.min(...forecast) * 0.98;
  const resistance     = Math.max(...forecast) * 1.02;

  onProgress?.(100);

  return {
    signal,
    confidence,
    support:      parseFloat(support.toFixed(2)),
    resistance:   parseFloat(resistance.toFixed(2)),
    forecast,
    forecastDays,
    pctChange:    parseFloat(pctChange.toFixed(2)),
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    finalPrice:   parseFloat(finalPrice.toFixed(2)),
    rsi:          parseFloat(rsi.toFixed(1)),
    dailyVol:     parseFloat((dailyVol * 100).toFixed(2)),
    rmse:         null,
  };
}
