import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { formatINR } from '../utils/formatCurrency';
import { productAPI } from '../services/api';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';

export default function ProductPicker({ products, onSelect, onClose }) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddCustom = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Product name is required');
    if (!price || parseFloat(price) <= 0) return Alert.alert('Error', 'Enter a valid price');

    setSaving(true);
    try {
      const res = await productAPI.create({
        name: name.trim(),
        basePrice: parseFloat(price),
      });
      onSelect(res.data);
    } catch {
      // Error shown by api interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Product</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Quick-add custom product toggle */}
      <TouchableOpacity
        style={styles.customToggle}
        onPress={() => setShowCustomForm(!showCustomForm)}
      >
        <Text style={styles.customToggleText}>
          {showCustomForm ? '✕  Cancel Custom Product' : '+  Add Custom Product'}
        </Text>
      </TouchableOpacity>

      {showCustomForm && (
        <View style={styles.customForm}>
          <TextInput
            style={styles.formInput}
            placeholder="Product Name *"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.formInput}
            placeholder="Price (₹) *"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TouchableOpacity style={styles.formSaveBtn} onPress={handleAddCustom} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.formSaveBtnText}>Add & Select</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        renderItem={({ item: product }) => (
          <TouchableOpacity
            style={styles.productRow}
            onPress={() => onSelect(product)}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDesc}>{product.description}</Text>
            </View>
            <Text style={styles.productPrice}>{formatINR(product.basePrice)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: NAVY,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  closeBtn: { fontSize: 20, color: GOLD, fontWeight: '700', padding: 4 },

  customToggle: {
    backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 2, borderBottomColor: GOLD,
  },
  customToggleText: { color: GOLD, fontWeight: '700', fontSize: 15, textAlign: 'center' },

  customForm: {
    backgroundColor: '#FFFDF5', padding: 14, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  formInput: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10,
    fontSize: 14, color: '#333', backgroundColor: '#fff', marginBottom: 8,
  },
  formSaveBtn: {
    backgroundColor: GOLD, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4,
  },
  formSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  productRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: '600', color: '#333' },
  productDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  productPrice: { fontSize: 15, fontWeight: '700', color: GOLD },
});
