import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';

const STEPS = [
  'Go to the Home tab and pick an asset',
  'Select an asset to view live details and charts',
  'Use AI Predictions to check the outlook before investing',
];

export default function PortfolioScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={24} color={COLORS.text} />
        <Text style={styles.title}>Portfolio</Text>
      </View>
      <Text style={styles.subtitle}>Your portfolio is empty</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Portfolio Value</Text>
        <Text style={styles.totalValue}>$0.00</Text>
      </View>

      <View style={styles.emptyCard}>
        <Ionicons name="briefcase-outline" size={48} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>Your portfolio is empty</Text>
        <Text style={styles.emptySubtitle}>Start by exploring assets from the markets tab</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.browseText}>Browse Assets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>How to Get Started</Text>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text, marginLeft: SPACING.sm },
  subtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: SPACING.xs },
  totalCard: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  totalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZES.xs },
  totalValue: { color: '#FFFFFF', fontSize: FONT_SIZES.xl, fontWeight: '800', marginTop: 4 },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.md,
  },
  emptyTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  browseText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.sm, marginLeft: SPACING.xs },
  guideCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  guideTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  stepNumberText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.sm },
  stepText: { color: COLORS.text, fontSize: FONT_SIZES.sm, flex: 1 },
});
