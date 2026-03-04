import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet,
  Alert, ActivityIndicator, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { productAPI } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';

const EMPTY_FORM = { name: '', basePrice: '', description: '' };

export default function ManageProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    try {
      const res = await productAPI.getAll({ active: 'true' });
      setProducts(res.data);
    } catch {
      // Error shown by api interceptor
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadProducts(); }, []));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setForm({
      name: product.name,
      basePrice: String(product.basePrice),
      description: product.description || '',
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Product name is required');
    if (!form.basePrice || parseFloat(form.basePrice) <= 0) return Alert.alert('Error', 'Enter a valid price');

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        basePrice: parseFloat(form.basePrice),
        description: form.description.trim(),
      };

      if (editingId) {
        await productAPI.update(editingId, data);
      } else {
        await productAPI.create(data);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadProducts();
    } catch {
      // Error shown by api interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (product) => {
    Alert.alert(
      'Deactivate Product',
      `Remove "${product.name}" from the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await productAPI.delete(product._id);
              await loadProducts();
            } catch {
              // Error shown by api interceptor
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addBtn} onPress={openAddForm}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(p) => p._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} tintColor={GOLD} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found</Text>}
        renderItem={({ item: product }) => (
          <View style={styles.productRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.description ? (
                <Text style={styles.productDesc}>{product.description}</Text>
              ) : null}
            </View>
            <View style={styles.productActions}>
              <Text style={styles.productPrice}>{formatINR(product.basePrice)}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openEditForm(product)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeactivate(product)} style={styles.deactivateBtn}>
                  <Text style={styles.deactivateBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Product' : 'Add Product'}</Text>
                <TouchableOpacity onPress={() => { setShowForm(false); setEditingId(null); }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Product Name *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Silk Kurta"
                placeholderTextColor="#999"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
              />

              <Text style={styles.fieldLabel}>Base Price (₹) *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 5000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={form.basePrice}
                onChangeText={(v) => setForm({ ...form, basePrice: v })}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.descInput]}
                placeholder="Optional description"
                placeholderTextColor="#999"
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingId ? 'Update Product' : 'Add Product'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3EE' },
  listContent: { paddingBottom: 40 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    padding: 10, fontSize: 14, color: '#333', backgroundColor: '#FAFAFA',
  },
  addBtn: {
    backgroundColor: GOLD, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 40, fontSize: 15 },

  productRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: '600', color: '#333' },
  productDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  productActions: { alignItems: 'flex-end' },
  productPrice: { fontSize: 15, fontWeight: '700', color: GOLD, marginBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, backgroundColor: '#EEF2FF' },
  editBtnText: { color: '#3B5BDB', fontSize: 12, fontWeight: '600' },
  deactivateBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, backgroundColor: '#FFF0F0' },
  deactivateBtnText: { color: '#E74C3C', fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%', padding: 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: NAVY },
  modalClose: { fontSize: 20, color: '#999', padding: 4 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 12 },
  fieldInput: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12,
    fontSize: 15, color: '#333', backgroundColor: '#FAFAFA',
  },
  descInput: { minHeight: 60, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: GOLD, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
