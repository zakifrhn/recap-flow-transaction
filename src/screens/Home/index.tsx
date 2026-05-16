import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { checkPermission, requestPermission } from '../../modules/notification/permission';
import { getTransactions } from '../../db/transactions';
import { getDB } from '../../db';
import type { Transaction } from '../../types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#f5f1e8',
  bg2:        '#ede7d8',
  card:       '#ffffff',
  card2:      '#fbf8f1',
  green:      '#7cb88a',
  greenSoft:  '#cfe6cd',
  greenMint:  '#e6f1de',
  greenDeep:  '#355c43',
  coral:      '#e89a8a',
  coralSoft:  '#f4d8cf',
  coralDeep:  '#87392c',
  ink:        '#1f231f',
  ink2:       '#3a3f3a',
  mute:       '#7c7f76',
  line:       '#e3ddcd',
  line2:      '#d6cfbb',
};

// ─── Bank badge config ────────────────────────────────────────────────────────
type BankConfig = { short: string; bg: string; fg: string };
const BANK_MAP: Record<string, BankConfig> = {
  BCA:       { short: 'BC', bg: '#0061a8', fg: '#fff' },
  GoPay:     { short: 'GP', bg: '#0f7ec1', fg: '#fff' },
  OVO:       { short: 'O',  bg: '#4c2d8a', fg: '#fff' },
  DANA:      { short: 'D',  bg: '#0090f3', fg: '#fff' },
  Mandiri:   { short: 'M',  bg: '#f9a825', fg: '#15355a' },
  Jenius:    { short: 'J',  bg: '#15355a', fg: '#f3e2a8' },
  ShopeePay: { short: 'S',  bg: '#ee4d2d', fg: '#fff' },
  SeaBank:   { short: 'SB', bg: '#1a5dc7', fg: '#fff' },
  BNI:       { short: 'BN', bg: '#e85206', fg: '#fff' },
  BRI:       { short: 'BR', bg: '#003d82', fg: '#fff' },
  Jago:      { short: 'JG', bg: '#2d4de0', fg: '#fff' },
};

function getBankConfig(bank: string): BankConfig {
  return BANK_MAP[bank] ?? {
    short: bank.slice(0, 2).toUpperCase(),
    bg: C.greenDeep,
    fg: C.greenMint,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtRupiah(amount: number, mode: 'long' | 'short' = 'long'): string {
  const abs = Math.abs(amount);
  if (mode === 'short') {
    if (abs >= 1_000_000) {
      const v = abs / 1_000_000;
      return `Rp ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} jt`;
    }
    if (abs >= 1_000) return `Rp ${Math.round(abs / 1_000)}rb`;
    return `Rp ${abs}`;
  }
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

function fmtTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDayLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function fmtMonthYear(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BankBadge({ bank, size = 42 }: Readonly<{ bank: string; size?: number }>) {
  const cfg = getBankConfig(bank);
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.28),
      backgroundColor: cfg.bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ color: cfg.fg, fontWeight: '800', fontSize: Math.round(size * 0.32) }}>
        {cfg.short}
      </Text>
    </View>
  );
}

function DirectionDot({ isDebit }: Readonly<{ isDebit: boolean }>) {
  return (
    <View style={{
      position: 'absolute',
      right: -3,
      bottom: -3,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: isDebit ? C.coralSoft : C.greenMint,
      borderWidth: 2,
      borderColor: C.card,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{
        fontSize: 9,
        fontWeight: '800',
        color: isDebit ? C.coralDeep : C.greenDeep,
        lineHeight: 11,
        includeFontPadding: false,
      }}>
        {isDebit ? '↑' : '↓'}
      </Text>
    </View>
  );
}

function PermBanner({ onPress }: Readonly<{ onPress: () => void }>) {
  return (
    <TouchableOpacity style={s.permBanner} onPress={onPress} activeOpacity={0.85}>
      <View style={s.permIconWrap}>
        <Text style={{ fontSize: 16 }}>🔔</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.permTitle}>Akses notifikasi belum aktif</Text>
        <Text style={s.permSub}>Tap untuk mengaktifkan di Pengaturan</Text>
      </View>
      <Text style={s.permChevron}>›</Text>
    </TouchableOpacity>
  );
}

function HeroCard({
  income,
  expense,
}: Readonly<{
  income: number;
  expense: number;
}>) {
  const net = income - expense;
  return (
    <View style={s.heroCard}>
      <Text style={s.heroCaption}>Cashflow bulan ini</Text>
      <Text style={s.heroAmount}>{fmtRupiah(net)}</Text>
      <View style={s.heroStats}>
        <View style={s.heroStat}>
          <Text style={s.heroStatLabel}>↓ Pemasukan</Text>
          <Text style={s.heroStatVal}>{fmtRupiah(income, 'short')}</Text>
        </View>
        <View style={s.heroStat}>
          <Text style={s.heroStatLabel}>↑ Pengeluaran</Text>
          <Text style={s.heroStatVal}>{fmtRupiah(expense, 'short')}</Text>
        </View>
      </View>
      {/* decorative rings */}
      <View style={s.heroRing1} pointerEvents="none" />
      <View style={s.heroRing2} pointerEvents="none" />
    </View>
  );
}

function MiniChart({ transactions }: Readonly<{ transactions: Transaction[] }>) {
  const today = new Date();
  const days: { label: string; key: string }[] = [];
  const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ label: DAY_NAMES[d.getDay()], key: d.toISOString().slice(0, 10) });
  }

  const totals = transactions.reduce<Record<string, { i: number; o: number }>>((acc, t) => {
    const k = dayKey(t.timestamp);
    if (!acc[k]) { acc[k] = { i: 0, o: 0 }; }
    if (t.direction === 'credit') { acc[k].i += t.amount; }
    else { acc[k].o += t.amount; }
    return acc;
  }, {});

  const maxVal = Math.max(...days.map(d => Math.max(totals[d.key]?.i ?? 0, totals[d.key]?.o ?? 0)), 1);
  const BAR_H = 56;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 14, height: BAR_H + 18 }}>
      {days.map(d => {
        const inc = totals[d.key]?.i ?? 0;
        const exp = totals[d.key]?.o ?? 0;
        const ih = Math.max((inc / maxVal) * BAR_H, inc > 0 ? 2 : 0);
        const eh = Math.max((exp / maxVal) * BAR_H, exp > 0 ? 2 : 0);
        return (
          <View key={d.key} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_H, gap: 2 }}>
              <View style={{ width: 6, height: ih, borderRadius: 3, backgroundColor: C.green }} />
              <View style={{ width: 6, height: eh, borderRadius: 3, backgroundColor: C.coral }} />
            </View>
            <Text style={{ fontSize: 9, color: C.mute, fontWeight: '600', marginTop: 4 }}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function TxItem({ item, isLast }: Readonly<{ item: Transaction; isLast: boolean }>) {
  const isDebit = item.direction === 'debit';
  const label = item.merchant ?? item.counterparty ?? item.type;
  const amountColor = isDebit ? C.coralDeep : C.greenDeep;
  const sign = isDebit ? '- ' : '+ ';

  return (
    <View style={[s.txRow, !isLast && s.txBorder]}>
      <View style={{ position: 'relative' }}>
        <BankBadge bank={item.bank} size={42} />
        <DirectionDot isDebit={isDebit} />
      </View>
      <View style={s.txMid}>
        <View style={s.txTop}>
          <Text style={s.txLabel} numberOfLines={1}>{label}</Text>
          <Text style={[s.txAmount, { color: amountColor }]}>
            {sign}{fmtRupiah(item.amount, 'short')}
          </Text>
        </View>
        <View style={s.txBot}>
          <Text style={s.txMeta}>{item.bank} · {fmtTime(item.timestamp)}</Text>
          <Text style={s.txCat}>{item.category}</Text>
        </View>
      </View>
    </View>
  );
}

function DayGroup({ dateKey, items }: Readonly<{ dateKey: string; items: Transaction[] }>) {
  const income = items.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const expense = items.filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);
  const ts = new Date(dateKey + 'T00:00').getTime();

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={s.dayHeader}>
        <Text style={s.dayLabel}>{fmtDayLabel(ts)}</Text>
        <Text style={s.dayTotals}>
          {income > 0 && (
            <Text style={{ color: C.greenDeep }}>+{fmtRupiah(income, 'short')}</Text>
          )}
          {income > 0 && expense > 0 && <Text style={{ color: C.mute }}> · </Text>}
          {expense > 0 && (
            <Text style={{ color: C.coralDeep }}>-{fmtRupiah(expense, 'short')}</Text>
          )}
        </Text>
      </View>
      <View style={s.txCard}>
        {items.map((item, idx) => (
          <TxItem key={item.id ?? idx} item={item} isLast={idx === items.length - 1} />
        ))}
      </View>
    </View>
  );
}

function TabBar() {
  const tabs = [
    { id: 'home', label: 'Beranda',   glyph: '⌂' },
    { id: 'list', label: 'Transaksi', glyph: '≡' },
    { id: 'stat', label: 'Insight',   glyph: '▦' },
    { id: 'set',  label: 'Setelan',   glyph: '⚙' },
  ];
  return (
    <View style={s.tabBar}>
      {tabs.map(t => {
        const active = t.id === 'home';
        return (
          <View key={t.id} style={s.tabItem}>
            <Text style={[s.tabGlyph, active && { color: C.greenDeep }]}>{t.glyph}</Text>
            <Text style={[s.tabLabel, active && { color: C.greenDeep }]}>{t.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthTotals, setMonthTotals] = useState({ income: 0, expense: 0 });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    getDB();
    const txs = getTransactions(200);
    setTransactions(txs);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const ms = monthStart.getTime();

    const income  = txs.filter(t => t.direction === 'credit' && t.timestamp >= ms).reduce((a, t) => a + t.amount, 0);
    const expense = txs.filter(t => t.direction === 'debit'  && t.timestamp >= ms).reduce((a, t) => a + t.amount, 0);
    setMonthTotals({ income, expense });
  }, []);

  useEffect(() => {
    checkPermission().then(granted => setHasPermission(granted));
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  // Group by day (most recent first)
  const byDay = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    const k = dayKey(t.timestamp);
    if (!acc[k]) { acc[k] = []; }
    acc[k].push(t);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  const now = new Date();

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.greenDeep} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Recap Flow</Text>
            <Text style={s.period}>{fmtMonthYear(now)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[s.iconBtn, { position: 'relative' }]}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              {hasPermission === false && (
                <View style={s.bellDot} />
              )}
            </View>
            <View style={s.avatarBtn}>
              <Text style={s.avatarText}>R</Text>
            </View>
          </View>
        </View>

        {/* ── Permission banner ── */}
        {hasPermission === false && (
          <View style={{ paddingHorizontal: 20 }}>
            <PermBanner onPress={requestPermission} />
          </View>
        )}

        {/* ── Hero cashflow card ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <HeroCard income={monthTotals.income} expense={monthTotals.expense} />
        </View>

        {/* ── 7-day chart ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.sectionTitle}>7 hari terakhir</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green }} />
                  <Text style={s.legendTxt}>Masuk</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.coral }} />
                  <Text style={s.legendTxt}>Keluar</Text>
                </View>
              </View>
            </View>
            <MiniChart transactions={transactions} />
          </View>
        </View>

        {/* ── Transaction list ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Aktivitas terbaru</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>Belum ada transaksi</Text>
              <Text style={s.emptyHint}>
                Lakukan pembayaran atau transfer — notifikasi akan otomatis terbaca.
              </Text>
            </View>
          ) : (
            days.map(k => (
              <DayGroup key={k} dateKey={k} items={byDay[k]} />
            ))
          )}
        </View>
      </ScrollView>

      <TabBar />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: C.bg },

  // Header
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greeting:  { fontSize: 12, fontWeight: '700', color: C.mute, letterSpacing: 0.4 },
  period:    { fontSize: 22, fontWeight: '700', color: C.greenDeep, marginTop: 2 },
  iconBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  bellDot:   { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.coral },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.greenDeep, alignItems: 'center', justifyContent: 'center' },
  avatarText:{ color: C.greenMint, fontWeight: '800', fontSize: 16 },

  // Permission banner
  permBanner:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.coralSoft, borderRadius: 16, padding: 14, marginTop: 12 },
  permIconWrap:{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(135,57,44,0.12)', alignItems: 'center', justifyContent: 'center' },
  permTitle:   { fontSize: 13, fontWeight: '700', color: C.coralDeep },
  permSub:     { fontSize: 11, color: C.coralDeep, opacity: 0.75, marginTop: 1 },
  permChevron: { fontSize: 20, color: C.coralDeep, opacity: 0.5 },

  // Hero card
  heroCard:     { backgroundColor: C.greenDeep, borderRadius: 22, padding: 22, overflow: 'hidden' },
  heroCaption:  { fontSize: 12, color: C.greenMint, opacity: 0.7, fontWeight: '600' },
  heroAmount:   { fontSize: 36, fontWeight: '800', color: C.greenMint, marginTop: 8, letterSpacing: -0.5 },
  heroStats:    { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroStat:     { flex: 1, backgroundColor: 'rgba(207,230,205,0.12)', borderRadius: 14, padding: 12 },
  heroStatLabel:{ fontSize: 11, color: C.greenMint, opacity: 0.75, fontWeight: '600' },
  heroStatVal:  { fontSize: 15, fontWeight: '700', color: C.greenMint, marginTop: 4 },
  heroRing1:    { position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(207,230,205,0.18)' },
  heroRing2:    { position: 'absolute', right: -10, top: -10, width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: 'rgba(207,230,205,0.12)' },

  // Generic card
  card: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 16 },

  // Section header
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.ink2 },
  legendTxt:    { fontSize: 10, color: C.mute, fontWeight: '600' },

  // Day group
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, paddingBottom: 8 },
  dayLabel:  { fontSize: 12, fontWeight: '700', color: C.ink2 },
  dayTotals: { fontSize: 11 },

  // Transaction card / row
  txCard:   { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  txRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  txBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  txMid:    { flex: 1, minWidth: 0 },
  txTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  txLabel:  { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink },
  txAmount: { fontSize: 13, fontWeight: '700', flexShrink: 0 },
  txBot:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  txMeta:   { fontSize: 11, color: C.mute },
  txCat:    { fontSize: 10, color: C.mute },

  // Empty state
  emptyCard:  { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.ink2, textAlign: 'center' },
  emptyHint:  { fontSize: 13, color: C.mute, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // Tab bar
  tabBar:  { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.92)', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, paddingBottom: 22 },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabGlyph:{ fontSize: 20, color: C.mute },
  tabLabel:{ fontSize: 10, fontWeight: '600', color: C.mute },
});
