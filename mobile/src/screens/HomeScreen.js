import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { billAPI } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await billAPI.getStats();
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.shopName}>Royal Wedding Collection</Text>
        <Text style={styles.tagline}>Men's Premium Wedding Attire</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateBill')}>
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionLabel}>New Bill</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnAlt]} onPress={() => navigation.navigate('BillsTab')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionLabelAlt}>View Bills</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Bills" value={stats.totalBills} color={NAVY} />
            <StatCard label="Paid" value={stats.paidBills} color="#27AE60" />
            <StatCard label="Unpaid" value={stats.unpaidBills} color="#E74C3C" />
            <StatCard label="Partial" value={stats.partialBills} color="#F39C12" />
          </View>

          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={styles.revenueCard}>
            <RevenueRow label="Total Revenue" value={formatINR(stats.totalRevenue)} color={NAVY} />
            <RevenueRow label="Collected" value={formatINR(stats.totalCollected)} color="#27AE60" />
            <RevenueRow label="Outstanding" value={formatINR(stats.outstanding)} color="#E74C3C" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RevenueRow({ label, value, color }) {
  return (
    <View style={styles.revenueRow}>
      <Text style={styles.revenueLabel}>{label}</Text>
      <Text style={[styles.revenueValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3EE' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3EE' },

  heroCard: {
    backgroundColor: NAVY, borderRadius: 16, padding: 28, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  shopName: { fontSize: 24, fontWeight: '800', color: GOLD, marginBottom: 4 },
  tagline: { fontSize: 14, color: '#B8C4D8', fontWeight: '500' },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1, backgroundColor: GOLD, borderRadius: 12, padding: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  actionBtnAlt: { backgroundColor: '#fff', borderWidth: 2, borderColor: NAVY },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  actionLabelAlt: { fontSize: 15, fontWeight: '700', color: NAVY },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: NAVY, marginBottom: 12, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 10, padding: 16,
    borderTopWidth: 3, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: '600' },

  revenueCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  revenueRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  revenueLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  revenueValue: { fontSize: 16, fontWeight: '700' },
});
