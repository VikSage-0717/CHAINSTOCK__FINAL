import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';
import { SectionCard, Tag } from '../components';
import PredictionYearSlider from '../components/PredictionYearSlider';
import { predictPrices, movingAverage } from '../services/predictionService';
import { fetchCryptoChart, fetchStockTimeSeries } from '../services/marketService';
import { CRYPTO_ASSETS, STOCK_ASSETS } from '../constants/data';

const { width: SCREEN_W } = Dimensions.get('window');
const ALL_ASSETS = [
  ...STOCK_ASSETS,
  ...CRYPTO_ASSETS.map((c) => ({ symbol: c.symbol, name: c.name, type: 'crypto', id: c.id })),
];
const SIGNAL_COLOR = { BUY: COLORS.success, SELL: COLORS.danger, HOLD: '#F59E0B' };

export default function PredictionsScreen({ route }) {
  const initialAsset = route?.params?.asset || ALL_ASSETS[0];
  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [years, setYears]         = useState(1);
  const [prediction, setPred]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [rawPoints, setRaw]       = useState([]);

  const forecastDays = years * 30; // approximate

  const runPrediction = async () => {
    setLoading(true);
    setProgress(0);
    setPred(null);

    try {
      // 1. Fetch historical data
      let points = [];
      if (selectedAsset.type === 'crypto') {
        points = await fetchCryptoChart(selectedAsset.id, 90);
      } else {
        points = await fetchStockTimeSeries(selectedAsset.symbol, 90);
      }
      setRaw(points);

      // 2. Run LSTM
      const result = await predictPrices(points, forecastDays, setProgress);
      setPred(result);
    } catch (e) {
      Alert.alert('Prediction Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const forecastPrices = prediction?.forecast ?? [];
  const historicalPrices = rawPoints.map((p) => p.price).slice(-30);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>AI Predictions</Text>
        <Text style={styles.subtitle}>On-device LSTM neural network — no API key needed</Text>

        {/* Asset selector */}
        <SectionCard title="Select Asset">
          <FlatList
            data={ALL_ASSETS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.symbol}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, selectedAsset.symbol === item.symbol && styles.chipActive]}
                onPress={() => { setSelectedAsset(item); setPred(null); }}
              >
                <Text style={[styles.chipText, selectedAsset.symbol === item.symbol && styles.chipTextActive]}>
                  {item.symbol}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SectionCard>

        {/* Year slider */}
        <View style={{ marginBottom: SPACING.md }}>
          <PredictionYearSlider onValueChange={setYears} initialValue={1} />
        </View>
        <Text style={styles.forecastNote}>Forecasting ~{forecastDays} trading days</Text>

        {/* Run button */}
        <TouchableOpacity style={styles.runBtn} onPress={runPrediction} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <><Ionicons name="sparkles" size={18} color="#FFF" />
               <Text style={styles.runBtnText}>Run LSTM Prediction</Text></>}
        </TouchableOpacity>

        {/* Progress */}
        {loading && (
          <View style={styles.progressWrap}>
            <Text style={styles.progressLabel}>Training model… {progress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* Result */}
        {prediction && !loading && (
          <>
            <SectionCard title={`${selectedAsset.symbol} · ${years}-Year LSTM Forecast`} style={{ marginTop: SPACING.md }}>
              <View style={styles.signalRow}>
                <View style={[styles.signalBadge, { backgroundColor: SIGNAL_COLOR[prediction.signal] }]}>
                  <Text style={styles.signalText}>{prediction.signal}</Text>
                </View>
                <Text style={styles.confidence}>Confidence: {prediction.confidence}%</Text>
              </View>

              {/* Forecast chart */}
              {forecastPrices.length > 1 && (
                <LineChart
                  data={{
                    labels: ['Now', ...Array.from({ length: Math.min(forecastPrices.length, 4) },
                      (_, i) => `+${Math.round((i + 1) * forecastDays / 4)}d`)],
                    datasets: [
                      { data: historicalPrices, color: () => COLORS.primary, strokeWidth: 2 },
                      { data: forecastPrices.slice(0, 30), color: () => '#F59E0B', strokeWidth: 2 },
                    ],
                  }}
                  width={SCREEN_W - SPACING.md * 4}
                  height={180}
                  withDots={false}
                  chartConfig={{
                    backgroundColor: '#FFF',
                    backgroundGradientFrom: '#FFF',
                    backgroundGradientTo: '#FFF',
                    decimalPlaces: 2,
                    color: () => COLORS.primary,
                    labelColor: () => COLORS.textSecondary,
                    propsForBackgroundLines: { stroke: COLORS.border },
                  }}
                  bezier
                  style={{ borderRadius: RADIUS.md }}
                />
              )}

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                {[
                  { label: 'Current Price',  value: `$${prediction.currentPrice?.toFixed(2)}` },
                  { label: `${forecastDays}d Target`, value: `$${prediction.finalPrice?.toFixed(2)}`,
                    color: prediction.pctChange >= 0 ? COLORS.success : COLORS.danger },
                  { label: 'Expected Change', value: `${prediction.pctChange >= 0 ? '+' : ''}${prediction.pctChange}%`,
                    color: prediction.pctChange >= 0 ? COLORS.success : COLORS.danger },
                  { label: 'Support',     value: `$${prediction.support}`,    color: COLORS.success },
                  { label: 'Resistance',  value: `$${prediction.resistance}`, color: COLORS.danger },
                  { label: 'Model RMSE',  value: prediction.rmse?.toFixed(4) ?? '—' },
                ].map((s) => (
                  <View key={s.label} style={styles.statBox}>
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <Text style={[styles.statValue, s.color ? { color: s.color } : null]}>{s.value}</Text>
                  </View>
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.legendText}>Historical (30d)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>LSTM Forecast</Text>
                </View>
              </View>
            </SectionCard>

            <Text style={styles.disclaimer}>
              This prediction is generated by an LSTM neural network trained on historical price data.
              It is for educational purposes only and is NOT financial advice.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll:    { padding: SPACING.md, paddingBottom: SPACING.xl },
  title:     { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text },
  subtitle:  { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.md },
  forecastNote: { fontSize: FONT_SIZES.xs, color: COLORS.primary, textAlign: 'center', marginBottom: SPACING.sm },
  chip:      { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  chipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:  { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  chipTextActive: { color: '#FFF' },
  runBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.md, marginBottom: SPACING.md },
  runBtnText:{ color: '#FFF', fontWeight: '700', fontSize: FONT_SIZES.md, marginLeft: SPACING.sm },
  progressWrap: { marginBottom: SPACING.md },
  progressLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  signalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  signalBadge: { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 6, marginRight: SPACING.md },
  signalText:{ color: '#FFF', fontWeight: '800', fontSize: FONT_SIZES.md },
  confidence:{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.md },
  statBox:   { width: '33.33%', alignItems: 'center', paddingVertical: SPACING.sm },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase', fontWeight: '600' },
  statValue: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  legend:    { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.sm },
  legendItem:{ flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText:{ fontSize: 11, color: COLORS.textSecondary },
  disclaimer:{ fontSize: 10, color: COLORS.gray, textAlign: 'center', marginTop: SPACING.md, lineHeight: 14 },
});
