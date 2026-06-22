import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';

/**
 * A single row in the markets list showing symbol, name, price and 24h change.
 */
export function AssetRow({ asset, onPress }) {
  const isPositive = (asset.change24h ?? 0) >= 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={styles.symbolLine}>
          <Text style={styles.symbol}>{asset.symbol}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{asset.type?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.name}>{asset.name}</Text>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.price}>
          ${Number(asset.price ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <View
          style={[
            styles.changeBadge,
            { backgroundColor: isPositive ? COLORS.successLight : COLORS.dangerLight },
          ]}
        >
          <Text style={[styles.changeText, { color: isPositive ? COLORS.success : COLORS.danger }]}>
            {isPositive ? '+' : ''}
            {Number(asset.change24h ?? 0).toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * A bordered card with an optional title used to group content.
 */
export function SectionCard({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

/**
 * Small colored pill used for tags like BUY/SELL/HOLD or asset type.
 */
export function Tag({ label, color = COLORS.primary }) {
  return (
    <View style={[styles.tag, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rowLeft: { flex: 1 },
  symbolLine: { flexDirection: 'row', alignItems: 'center' },
  symbol: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginRight: SPACING.xs },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  price: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  changeBadge: { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.xs, paddingVertical: 2, marginTop: 4 },
  changeText: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, fontWeight: '700' },
});
