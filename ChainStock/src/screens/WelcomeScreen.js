import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';

const FEATURES = [
  {
    icon: 'trending-up-outline',
    title: 'Live Market Data',
    description: 'Real-time tracking of stocks and cryptocurrencies',
  },
  {
    icon: 'pulse-outline',
    title: 'AI Predictions',
    description: 'AI-powered price forecasts and trade signals',
  },
  {
    icon: 'time-outline',
    title: 'Historical Events',
    description: 'Learn how major events shaped markets over time',
  },
];

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.iconWrapper}>
          <Ionicons name="trending-up" size={48} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>ChainStock</Text>
        <Text style={styles.subtitle}>
          Your intelligent companion for crypto and stock market analysis
        </Text>

        <View style={styles.featuresContainer}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => navigation.replace('MainTabs')}>
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: SPACING.lg },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  featuresContainer: { width: '100%', marginTop: SPACING.xl },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#FFFFFF' },
  featureDescription: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cta: {
    marginTop: 'auto',
    marginBottom: SPACING.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: FONT_SIZES.md },
});
