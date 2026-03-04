import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { formatINR } from '../utils/formatCurrency';

const NAVY = '#1B2A4A';

export default function BillItemRow({ item, index, onUpdate, onRemove }) {
  const lineTotal = (item.quantity || 0) * (item.price || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.index}>{index + 1}.</Text>
        <View style={styles.nameField}>
          <Text style={styles.fieldLabel}>Item name *</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Sherwani, Suit..."
            placeholderTextColor="#999"
            value={item.productName || ''}
            onChangeText={(text) => onUpdate(index, 'productName', text)}
          />
        </View>
        <TouchableOpacity onPress={() => onRemove(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.removeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Notes (optional)</Text>
      <TextInput
        style={styles.descInput}
        placeholder="Size, color, etc."
        placeholderTextColor="#aaa"
        value={item.description || ''}
        onChangeText={(text) => onUpdate(index, 'description', text)}
      />

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Qty</Text>
          <TextInput
            style={styles.numInput}
            keyboardType="numeric"
            value={String(item.quantity)}
            onChangeText={(text) => onUpdate(index, 'quantity', parseInt(text) || 0)}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.numInput}
            keyboardType="numeric"
            value={String(item.price)}
            onChangeText={(text) => onUpdate(index, 'price', parseFloat(text) || 0)}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.total}>{formatINR(lineTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: NAVY,
  },
  header: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  index: { fontSize: 13, fontWeight: '700', color: '#999', marginRight: 6, marginBottom: 10 },
  nameField: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#999', marginBottom: 4, fontWeight: '600' },
  nameInput: {
    fontSize: 15, fontWeight: '700', color: NAVY,
    borderWidth: 1, borderColor: '#EEE', borderRadius: 6, padding: 10,
  },
  removeBtn: { fontSize: 16, color: '#E74C3C', fontWeight: '700', marginBottom: 10 },
  descInput: {
    borderWidth: 1, borderColor: '#EEE', borderRadius: 6, padding: 8,
    fontSize: 13, color: '#555', marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1 },
  label: { fontSize: 11, color: '#999', marginBottom: 4, fontWeight: '600' },
  numInput: {
    borderWidth: 1, borderColor: '#EEE', borderRadius: 6, padding: 8,
    fontSize: 14, color: '#333', textAlign: 'center',
  },
  total: { fontSize: 15, fontWeight: '700', color: NAVY, textAlign: 'center', paddingTop: 8 },
});
