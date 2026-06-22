import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';
import { AssetRow } from '../components';
import { fetchCryptoPrices, fetchStockPrice } from '../services/marketService';
import { CRYPTO_ASSETS, STOCK_ASSETS } from '../constants/data';
import { useAuth } from '../context/AuthContext';

const REFRESH_INTERVAL_MS = 30000; // 30 seconds

export default function MarketsScreen({ navigation }) {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  const loadData = useCallback(async () => {
    try {
      // Live crypto prices (CoinGecko)
      const cryptoData = await fetchCryptoPrices(CRYPTO_ASSETS.map((c) => c.id));

      // Live stock prices (Alpha Vantage) - fetched individually so one
      // failed/rate-limited symbol doesn't break the whole list
      const stockResults = await Promise.allSettled(
        STOCK_ASSETS.map(async (stock) => {
          try {
            const quote = await fetchStockPrice(stock.symbol);
            return { ...stock, price: quote.price, change24h: quote.change24h };
          } catch (err) {
            return { ...stock, price: 0, change24h: 0, unavailable: true };
          }
        })
      );

      const stocks = stockResults.map((result) => result.value);

      setAssets([...stocks, ...cryptoData]);
    } catch (err) {
      console.warn('Failed to load market data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
      asset.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ChainStock</Text>
          <Text style={styles.subtitle}>Real-time Market Analysis</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks or crypto..."
          placeholderTextColor={COLORS.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredAssets}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <AssetRow asset={item} onPress={() => navigation.navigate('Detail', { asset: item })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  logoutButton: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: FONT_SIZES.xs },
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
  loader: { marginTop: SPACING.xl },
  listContent: { paddingVertical: SPACING.md, paddingBottom: SPACING.xl },
});
