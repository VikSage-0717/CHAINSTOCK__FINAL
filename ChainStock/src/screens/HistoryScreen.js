import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';
import { HISTORICAL_EVENTS } from '../constants/data';

const FILTERS = ['All Events', 'Positive', 'Negative'];

export default function HistoryScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Events');

  const filteredEvents = HISTORICAL_EVENTS.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) || String(event.year).includes(search);

    const matchesFilter =
      filter === 'All Events' ||
      (filter === 'Positive' && event.sentiment === 'positive') ||
      (filter === 'Negative' && event.sentiment === 'negative');

    return matchesSearch && matchesFilter;
  }).sort((a, b) => b.year - a.year);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="newspaper-outline" size={24} color={COLORS.text} />
        <Text style={styles.title}>Historical Events</Text>
      </View>
      <Text style={styles.subtitle}>
        Learn how major events shaped markets throughout history
      </Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, assets, year or keywords"
          placeholderTextColor={COLORS.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => `${item.year}-${item.title}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isPositive = item.sentiment === 'positive';
          return (
            <View style={[styles.eventCard, { borderLeftColor: isPositive ? COLORS.success : COLORS.danger }]}>
              <Text style={[styles.eventYear, { color: isPositive ? COLORS.success : COLORS.danger }]}>
                {item.year}
              </Text>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDescription}>{item.description}</Text>
              <View
                style={[
                  styles.changeBadge,
                  { backgroundColor: isPositive ? COLORS.successLight : COLORS.dangerLight },
                ]}
              >
                <Text style={[styles.changeText, { color: isPositive ? COLORS.success : COLORS.danger }]}>
                  Market Change: {item.change > 0 ? '+' : ''}
                  {item.change}%
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text, marginLeft: SPACING.sm },
  subtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: SPACING.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  filterRow: { flexDirection: 'row', marginTop: SPACING.md },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { paddingVertical: SPACING.md, paddingBottom: SPACING.xl },
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  eventYear: { fontSize: FONT_SIZES.sm, fontWeight: '800' },
  eventTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  eventDescription: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs, lineHeight: 18 },
  changeBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginTop: SPACING.sm,
  },
  changeText: { fontSize: 12, fontWeight: '700' },
});
