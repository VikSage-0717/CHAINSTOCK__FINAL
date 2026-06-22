import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Dimensions, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';
import { SectionCard, Tag } from '../components';
import {
  fetchCryptoChart, fetchStockTimeSeries,
  fetchStockPrice, fetchTechnicalIndicators,
} from '../services/marketService';
import { fetchNews } from '../services/newsService';
import { predictPrices, movingAverage } from '../services/predictionService';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - SPACING.md * 2;

const SIGNAL_COLOR = { BUY: COLORS.success, SELL: COLORS.danger, HOLD: '#F59E0B' };

// ─── tiny helpers ────────────────────────────────────────────────────────────
const fmt = (n, dec = 2) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

function StatBox({ label, value, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function NewsCard({ item }) {
  const isPos = item.sentiment === 'Positive';
  const isNeg = item.sentiment === 'Negative';
  const sentColor = isPos ? COLORS.success : isNeg ? COLORS.danger : COLORS.gray;

  const relTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => item.url && Linking.openURL(item.url)}
      activeOpacity={0.75}
    >
      <View style={styles.newsTop}>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <View style={[styles.sentimentDot, { backgroundColor: sentColor }]} />
      </View>
      <View style={styles.newsMeta}>
        <Text style={styles.newsSource}>{item.source}</Text>
        <Text style={styles.newsTime}>{relTime(item.publishedAt)}</Text>
        <View style={[styles.sentimentBadge, { backgroundColor: `${sentColor}20` }]}>
          <Text style={[styles.sentimentText, { color: sentColor }]}>{item.sentiment}</Text>
        </View>
        <Text style={styles.newsScore}>Score: {item.score}%</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function DetailScreen({ route, navigation }) {
  const { asset } = route.params;
  const isCrypto = asset.type === 'crypto';

  const [quote, setQuote]       = useState(asset);
  const [rawPoints, setRaw]     = useState([]);
  const [indicators, setInds]   = useState(null);
  const [news, setNews]         = useState([]);
  const [prediction, setPred]   = useState(null);

  const [smoothing, setSmoothing]     = useState(3);
  const [iterations, setIterations]   = useState(1);
  const [loadingChart, setLchart]     = useState(true);
  const [loadingNews, setLnews]       = useState(true);
  const [loadingPred, setLpred]       = useState(false);
  const [predProgress, setPredProg]   = useState(0);
  const [newsOverall, setNewsOverall] = useState(null);

  // ── load quote + chart + indicators + news in parallel ──────────────────
  const loadAll = useCallback(async () => {
    setLchart(true);
    setLnews(true);

    try {
      const [points, newsArticles] = await Promise.all([
        isCrypto
          ? fetchCryptoChart(asset.id, 30)
          : fetchStockTimeSeries(asset.symbol, 90),
        fetchNews(`${asset.name} ${asset.symbol} stock market`),
      ]);
      setRaw(points);

      // compute overall news sentiment
      if (newsArticles.length) {
        const avg = newsArticles.reduce((s, a) => s + a.score, 0) / newsArticles.length;
        setNewsOverall(avg >= 60 ? 'Positive' : avg <= 40 ? 'Negative' : 'Neutral');
      }
      setNews(newsArticles);

      // fetch updated quote + technicals for stocks
      if (!isCrypto) {
        const [q, tech] = await Promise.allSettled([
          fetchStockPrice(asset.symbol),
          fetchTechnicalIndicators(asset.symbol),
        ]);
        if (q.status === 'fulfilled') setQuote((prev) => ({ ...prev, ...q.value }));
        if (tech.status === 'fulfilled') setInds(tech.value);
      }
    } catch (e) {
      console.warn('DetailScreen load error:', e.message);
    } finally {
      setLchart(false);
      setLnews(false);
    }
  }, [asset]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── apply smoothing + iterations ─────────────────────────────────────────
  const chartPoints = React.useMemo(() => {
    if (!rawPoints.length) return [];
    let prices = rawPoints.map((p) => p.price);
    for (let i = 0; i < iterations; i++) {
      prices = movingAverage(prices, smoothing);
    }
    return rawPoints.map((p, i) => ({ ...p, price: prices[i] }));
  }, [rawPoints, smoothing, iterations]);

  // ── run LSTM prediction ───────────────────────────────────────────────────
  const runPrediction = async () => {
    if (rawPoints.length < 25) {
      Alert.alert('Not enough data', 'Need at least 25 price points to run the model.');
      return;
    }
    setLpred(true);
    setPredProg(0);
    setPred(null);
    try {
      const result = await predictPrices(rawPoints, 30, setPredProg);
      setPred(result);
    } catch (e) {
      Alert.alert('Prediction failed', e.message);
    } finally {
      setLpred(false);
    }
  };

  // ── chart data ────────────────────────────────────────────────────────────
  const prices = chartPoints.map((p) => p.price);
  const step   = Math.max(1, Math.ceil(chartPoints.length / 6));
  const labels = chartPoints
    .filter((_, i) => i % step === 0)
    .map((p) => p.date);

  const forecastPrices = prediction?.forecast?.slice(0, 30) ?? [];
  const combinedPrices = [...prices, ...forecastPrices];
  const forecastLabels = [
    ...labels,
    ...Array.from({ length: forecastPrices.length }, (_, i) => `+${i + 1}d`).filter(
      (_, i) => i % Math.max(1, Math.ceil(forecastPrices.length / 3)) === 0
    ),
  ];

  const isPos = (quote.change24h ?? 0) >= 0;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={loadAll} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Text style={styles.symbol}>{quote.symbol}</Text>
          <Tag label={asset.type?.toUpperCase()} color={COLORS.primary} />
        </View>
        <Text style={styles.assetName}>{quote.name ?? asset.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>${fmt(quote.price)}</Text>
          <View style={[styles.changeBadge, { backgroundColor: isPos ? COLORS.successLight : COLORS.dangerLight }]}>
            <Text style={[styles.changeText, { color: isPos ? COLORS.success : COLORS.danger }]}>
              {isPos ? '+' : ''}{fmt(quote.change24h)}%
            </Text>
          </View>
          {quote.change != null && (
            <Text style={[styles.changeAbs, { color: isPos ? COLORS.success : COLORS.danger }]}>
              {isPos ? '+' : ''}${fmt(Math.abs(quote.change))}
            </Text>
          )}
        </View>

        {/* ── Key Stats ─────────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          {quote.open    != null && <StatBox label="Open"    value={`$${fmt(quote.open)}`} />}
          {quote.high    != null && <StatBox label="High"    value={`$${fmt(quote.high)}`}    color={COLORS.success} />}
          {quote.low     != null && <StatBox label="Low"     value={`$${fmt(quote.low)}`}     color={COLORS.danger}  />}
          {quote.volume  != null && <StatBox label="Volume"  value={Number(quote.volume ?? 0).toLocaleString()} />}
          {quote.fiftyTwoWeekHigh != null && quote.fiftyTwoWeekHigh > 0 && (
            <StatBox label="52W High" value={`$${fmt(quote.fiftyTwoWeekHigh)}`} color={COLORS.success} />
          )}
          {quote.fiftyTwoWeekLow != null && quote.fiftyTwoWeekLow > 0 && (
            <StatBox label="52W Low"  value={`$${fmt(quote.fiftyTwoWeekLow)}`}  color={COLORS.danger}  />
          )}
        </ScrollView>

        {/* ── Technical Indicators ─────────────────────────────── */}
        {indicators && (
          <SectionCard title="Technical Indicators">
            <View style={styles.indRow}>
              {indicators.rsi != null && (
                <View style={styles.indBox}>
                  <Text style={styles.indLabel}>RSI (14)</Text>
                  <Text style={[
                    styles.indValue,
                    { color: indicators.rsi > 70 ? COLORS.danger : indicators.rsi < 30 ? COLORS.success : COLORS.text },
                  ]}>
                    {indicators.rsi.toFixed(1)}
                  </Text>
                  <Text style={styles.indHint}>
                    {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                  </Text>
                </View>
              )}
              {indicators.macd != null && (
                <View style={styles.indBox}>
                  <Text style={styles.indLabel}>MACD</Text>
                  <Text style={[
                    styles.indValue,
                    { color: indicators.macd > indicators.macdSignal ? COLORS.success : COLORS.danger },
                  ]}>
                    {indicators.macd.toFixed(2)}
                  </Text>
                  <Text style={styles.indHint}>
                    Signal: {indicators.macdSignal?.toFixed(2) ?? '—'}
                  </Text>
                </View>
              )}
              {indicators.ema20 != null && (
                <View style={styles.indBox}>
                  <Text style={styles.indLabel}>EMA (20)</Text>
                  <Text style={[
                    styles.indValue,
                    { color: quote.price > indicators.ema20 ? COLORS.success : COLORS.danger },
                  ]}>
                    ${indicators.ema20.toFixed(2)}
                  </Text>
                  <Text style={styles.indHint}>
                    Price {quote.price > indicators.ema20 ? 'above' : 'below'} EMA
                  </Text>
                </View>
              )}
            </View>
          </SectionCard>
        )}

        {/* ── Chart ──────────────────────────────────────────────── */}
        <SectionCard title="30-Day Performance">
          {/* Smoothing controls */}
          <View style={styles.controlRow}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Smoothing window: {smoothing}</Text>
              <View style={styles.chipRow}>
                {[3, 5, 7].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, smoothing === v && styles.chipActive]}
                    onPress={() => setSmoothing(v)}
                  >
                    <Text style={[styles.chipText, smoothing === v && styles.chipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Iterations: {iterations}</Text>
              <View style={styles.chipRow}>
                {[1, 2, 3].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, iterations === v && styles.chipActive]}
                    onPress={() => setIterations(v)}
                  >
                    <Text style={[styles.chipText, iterations === v && styles.chipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {loadingChart ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
          ) : prices.length > 1 ? (
            <LineChart
              data={{
                labels: prediction ? forecastLabels : labels,
                datasets: [
                  {
                    data: prediction ? combinedPrices : prices,
                    color: () => COLORS.primary,
                    strokeWidth: 2,
                  },
                  ...(prediction
                    ? [{
                        data: [...Array(prices.length).fill(null), ...forecastPrices],
                        color: () => '#F59E0B',
                        strokeWidth: 2,
                        withDots: false,
                      }]
                    : []),
                ],
              }}
              width={CHART_W - SPACING.md * 2}
              height={220}
              withDots={false}
              withInnerLines={true}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(99,102,241,${opacity})`,
                labelColor: () => COLORS.textSecondary,
                fillShadowGradient: '#10B981',
                fillShadowGradientOpacity: 0.15,
                propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '4 4' },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noData}>No chart data — check your Twelve Data API key</Text>
          )}

          {prediction && (
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Historical</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>AI Forecast (30d)</Text>
              </View>
            </View>
          )}
        </SectionCard>

        {/* ── AI Deep Learning Prediction ───────────────────────── */}
        <SectionCard title="AI Price Prediction (LSTM)">
          {!prediction && !loadingPred && (
            <TouchableOpacity style={styles.predictBtn} onPress={runPrediction}>
              <Ionicons name="sparkles" size={16} color="#FFF" />
              <Text style={styles.predictBtnText}>Run Deep Learning Model</Text>
            </TouchableOpacity>
          )}

          {loadingPred && (
            <View style={styles.progressContainer}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.progressText}>Training LSTM model… {predProgress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${predProgress}%` }]} />
              </View>
            </View>
          )}

          {prediction && !loadingPred && (
            <View>
              <View style={styles.signalRow}>
                <View style={[styles.signalBadge, { backgroundColor: SIGNAL_COLOR[prediction.signal] }]}>
                  <Text style={styles.signalText}>{prediction.signal}</Text>
                </View>
                <Text style={styles.confidence}>Confidence: {prediction.confidence}%</Text>
              </View>

              <View style={styles.predStats}>
                <StatBox label="Current"    value={`$${fmt(prediction.currentPrice)}`} />
                <StatBox label="30d Target" value={`$${fmt(prediction.finalPrice)}`}
                  color={prediction.pctChange >= 0 ? COLORS.success : COLORS.danger} />
                <StatBox label="Expected Δ"
                  value={`${prediction.pctChange >= 0 ? '+' : ''}${prediction.pctChange}%`}
                  color={prediction.pctChange >= 0 ? COLORS.success : COLORS.danger} />
              </View>

              <View style={styles.predStats}>
                <StatBox label="Support"    value={`$${fmt(prediction.support)}`}    color={COLORS.success} />
                <StatBox label="Resistance" value={`$${fmt(prediction.resistance)}`} color={COLORS.danger}  />
                {prediction.rmse != null && (
                  <StatBox label="Model RMSE" value={prediction.rmse.toFixed(4)} />
                )}
              </View>

              <TouchableOpacity
                style={[styles.predictBtn, { backgroundColor: COLORS.textSecondary, marginTop: SPACING.sm }]}
                onPress={runPrediction}
              >
                <Ionicons name="refresh" size={14} color="#FFF" />
                <Text style={styles.predictBtnText}>Retrain Model</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                ⚠️ Predictions are generated by an on-device LSTM neural network for educational
                purposes only. Not financial advice.
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Market Events & News ─────────────────────────────── */}
        <View style={styles.newsSectionHeader}>
          <Text style={styles.newsSectionTitle}>Market Events &amp; News</Text>
          {newsOverall && (
            <View style={[styles.sentimentBadge, {
              backgroundColor: newsOverall === 'Positive'
                ? COLORS.successLight
                : newsOverall === 'Negative'
                ? COLORS.dangerLight
                : '#F1F5F9',
            }]}>
              <Text style={[styles.sentimentText, {
                color: newsOverall === 'Positive'
                  ? COLORS.success
                  : newsOverall === 'Negative'
                  ? COLORS.danger
                  : COLORS.gray,
              }]}>
                {newsOverall}
              </Text>
            </View>
          )}
        </View>

        {loadingNews ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
        ) : news.length > 0 ? (
          news.map((item, idx) => <NewsCard key={idx} item={item} />)
        ) : (
          <Text style={styles.noData}>
            No news found. Check your NewsData API key in newsService.js
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  backBtn:       { flexDirection: 'row', alignItems: 'center' },
  backText:      { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text, marginLeft: SPACING.xs },
  refreshBtn:    { padding: SPACING.xs },
  scroll:        { paddingHorizontal: SPACING.md, paddingBottom: 80 },

  headerRow:     { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  symbol:        { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, marginRight: SPACING.sm },
  assetName:     { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.sm },

  priceRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  price:         { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginRight: SPACING.sm },
  changeBadge:   { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4, marginRight: SPACING.xs },
  changeText:    { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  changeAbs:     { fontSize: FONT_SIZES.sm, fontWeight: '600' },

  statsRow:      { flexDirection: 'row', marginBottom: SPACING.md },
  statBox:       { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginRight: SPACING.sm, alignItems: 'center', minWidth: 90 },
  statLabel:     { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  statValue:     { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, marginTop: 2 },

  indRow:        { flexDirection: 'row', justifyContent: 'space-around' },
  indBox:        { alignItems: 'center', flex: 1 },
  indLabel:      { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  indValue:      { fontSize: FONT_SIZES.md, fontWeight: '800', marginTop: 2 },
  indHint:       { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  controlRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  controlGroup:  { flex: 1 },
  controlLabel:  { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  chipRow:       { flexDirection: 'row' },
  chip:          { width: 32, height: 32, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  chipActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:      { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  chipTextActive:{ color: '#FFF' },

  chart:         { borderRadius: RADIUS.md, marginLeft: -SPACING.sm },
  noData:        { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: SPACING.lg, fontSize: FONT_SIZES.sm },

  chartLegend:   { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.sm },
  legendItem:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.sm },
  legendDot:     { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText:    { fontSize: 11, color: COLORS.textSecondary },

  predictBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  predictBtnText:{ color: '#FFF', fontWeight: '700', fontSize: FONT_SIZES.sm, marginLeft: 6 },

  progressContainer: { alignItems: 'center', paddingVertical: SPACING.md },
  progressText:  { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  progressBar:   { width: '100%', height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: SPACING.sm, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  signalRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  signalBadge:   { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 6, marginRight: SPACING.md },
  signalText:    { color: '#FFF', fontWeight: '800', fontSize: FONT_SIZES.md },
  confidence:    { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  predStats:     { flexDirection: 'row', justifyContent: 'space-between', marginVertical: SPACING.xs },
  disclaimer:    { fontSize: 10, color: COLORS.gray, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 14 },

  newsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  newsSectionTitle:  { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },

  newsCard:      { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  newsTop:       { flexDirection: 'row', alignItems: 'flex-start' },
  newsTitle:     { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, lineHeight: 18, marginRight: SPACING.sm },
  sentimentDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  newsMeta:      { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs, flexWrap: 'wrap', gap: 6 },
  newsSource:    { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  newsTime:      { fontSize: 11, color: COLORS.gray },
  sentimentBadge:{ borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  sentimentText: { fontSize: 10, fontWeight: '700' },
  newsScore:     { fontSize: 10, color: COLORS.gray },
});
