import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { billAPI } from '../services/api';
import { formatINR, formatDateTimeIST } from '../utils/formatCurrency';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';
const STATUS_COLORS = { paid: '#27AE60', unpaid: '#E74C3C', partial: '#F39C12' };

export default function BillsListScreen({ navigation }) {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBills = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await billAPI.getAll(params);
      setBills(res.data.bills || []);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadBills(); }, [search, statusFilter]));

  const onRefresh = () => { setRefreshing(true); loadBills(); };

  const renderBill = ({ item }) => (
    <TouchableOpacity
      style={styles.billCard}
      onPress={() => navigation.navigate('BillDetail', { billId: item._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.billNumber}>{item.billNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customer?.name || 'Unknown'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{formatDateTimeIST(item.date)}</Text>
        <Text style={styles.amount}>{formatINR(item.totalAmount)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, bill no..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filters}>
        {['', 'paid', 'unpaid', 'partial'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, statusFilter === s && styles.filterActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item._id}
          renderItem={renderBill}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No bills found</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateBill')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchBar: { padding: 12, paddingBottom: 0 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14,
    borderWidth: 1, borderColor: '#E8E4DC', color: '#333',
  },

  filters: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD',
  },
  filterActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterText: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'capitalize' },
  filterTextActive: { color: '#fff' },

  list: { padding: 12, paddingBottom: 80 },
  billCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  billNumber: { fontSize: 14, fontWeight: '700', color: NAVY },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#999' },
  amount: { fontSize: 17, fontWeight: '800', color: GOLD },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#999' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: GOLD,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '700', marginTop: -2 },
});
