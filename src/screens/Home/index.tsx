import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { checkPermission, requestPermission } from '../../modules/notification/permission';
import { getTransactions, getTodayTotal } from '../../db/transactions';
import { getDB } from '../../db';
import type { Transaction } from '../../types';

function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function TransactionItem({ item }: { item: Transaction }) {
  const isDebit = item.direction === 'debit';
  const label = item.merchant ?? item.counterparty ?? item.type;

  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.itemMeta}>{item.bank} · {item.category} · {formatTime(item.timestamp)}</Text>
      </View>
      <Text style={[styles.itemAmount, isDebit ? styles.debit : styles.credit]}>
        {isDebit ? '-' : '+'}{formatRupiah(item.amount)}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    // Initialize DB on first load
    getDB();
    setTransactions(getTransactions(100));
    setTodayTotal(getTodayTotal());
  }, []);

  useEffect(() => {
    checkPermission().then(granted => {
      setHasPermission(granted);
      if (!granted) {
        Alert.alert(
          'Izin Diperlukan',
          'RecapFlow perlu akses notifikasi untuk mencatat transaksi otomatis.',
          [
            { text: 'Buka Pengaturan', onPress: requestPermission },
            { text: 'Nanti', style: 'cancel' },
          ],
        );
      }
    });
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>RecapFlow</Text>
        <Text style={styles.headerDate}>{formatDate(Date.now())}</Text>
        {hasPermission === false && (
          <TouchableOpacity style={styles.permBanner} onPress={requestPermission}>
            <Text style={styles.permBannerText}>⚠ Akses notifikasi belum aktif — Tap untuk mengaktifkan</Text>
          </TouchableOpacity>
        )}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pengeluaran Hari Ini</Text>
          <Text style={styles.summaryAmount}>{formatRupiah(todayTotal)}</Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <TransactionItem item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Belum ada transaksi tercatat.</Text>
            <Text style={styles.emptyHint}>Lakukan pembayaran QRIS, transfer, atau tarik tunai — notifikasi akan otomatis terbaca.</Text>
          </View>
        }
        contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { backgroundColor: '#1a1a2e', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle:    { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerDate:     { color: '#aaa', fontSize: 13, marginTop: 2, marginBottom: 12 },
  permBanner:     { backgroundColor: '#ff6b35', borderRadius: 8, padding: 10, marginBottom: 12 },
  permBannerText: { color: '#fff', fontSize: 12, textAlign: 'center' },
  summaryCard:    { backgroundColor: '#16213e', borderRadius: 12, padding: 16 },
  summaryLabel:   { color: '#aaa', fontSize: 13 },
  summaryAmount:  { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
  item:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 10, padding: 14 },
  itemLeft:       { flex: 1, marginRight: 12 },
  itemLabel:      { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  itemMeta:       { fontSize: 12, color: '#888', marginTop: 2 },
  itemAmount:     { fontSize: 15, fontWeight: '700' },
  debit:          { color: '#e53e3e' },
  credit:         { color: '#38a169' },
  emptyContainer: { flex: 1 },
  empty:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText:      { fontSize: 16, fontWeight: '600', color: '#555', textAlign: 'center' },
  emptyHint:      { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
