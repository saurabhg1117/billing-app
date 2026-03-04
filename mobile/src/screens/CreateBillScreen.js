import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { billAPI } from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';
import BillItemRow from '../components/BillItemRow';
import { formatINR, formatDateTimeIST } from '../utils/formatCurrency';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';

export default function CreateBillScreen({ navigation }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState([{ productName: '', description: '', quantity: 1, price: 0 }]);
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdBill, setCreatedBill] = useState(null);
  const [paidInFull, setPaidInFull] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.price || 0), 0);
  const totalAmount = subtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0);

  React.useEffect(() => {
    if (paidInFull) setAmountPaid(String(Math.round(totalAmount * 100) / 100));
  }, [paidInFull, totalAmount]);

  const handleAddItem = () => {
    setItems([...items, { productName: '', description: '', quantity: 1, price: 0 }]);
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!customerName.trim()) {
      setErrorMessage('Please enter customer name');
      setShowErrorPopup(true);
      return;
    }
    const validItems = items
      .map((i) => {
        const name = (i.productName || '').trim();
        const desc = (i.description || '').trim();
        return {
          productName: name || desc || '',
          description: desc,
          quantity: parseInt(i.quantity, 10) || 1,
          price: parseFloat(i.price) || 0,
        };
      })
      .filter((i) => i.productName.length > 0);

    if (validItems.length === 0) {
      setErrorMessage('Please enter at least one item name');
      setShowErrorPopup(true);
      return;
    }

    setSaving(true);
    try {
      const billData = {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
        },
        items: validItems,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        notes,
      };
      const res = await billAPI.create(billData);
      setCreatedBill(res.data);
      setShowSuccessPopup(true);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (__DEV__) console.error('[CreateBill] API error:', err?.response?.status, err?.response?.data, err?.message);
      setErrorMessage(msg || 'Failed to create bill. Please try again.');
      setShowErrorPopup(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Customer Section - Manual Entry */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.customerCard}>
          <TextInput
            style={styles.input}
            placeholder="Customer Name *"
            placeholderTextColor="#999"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="Address"
            placeholderTextColor="#999"
            value={customerAddress}
            onChangeText={setCustomerAddress}
            multiline
          />
        </View>

        {/* Items Section - Manual Entry */}
        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item, index) => (
          <BillItemRow
            key={index}
            item={item}
            index={index}
            onUpdate={handleUpdateItem}
            onRemove={handleRemoveItem}
          />
        ))}
        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
          <Text style={styles.addItemText}>+ Add Item</Text>
        </TouchableOpacity>

        {/* Totals Section */}
        <Text style={styles.sectionTitle}>Billing</Text>
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatINR(subtotal)}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <TextInput style={styles.totalInput} keyboardType="numeric" value={discount} onChangeText={setDiscount} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.totalLabel}>Tax (GST)</Text>
            <TextInput style={styles.totalInput} keyboardType="numeric" value={tax} onChangeText={setTax} />
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatINR(totalAmount)}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.totalLabel}>Amount Paid</Text>
            <TextInput
              style={styles.totalInput}
              keyboardType="numeric"
              value={amountPaid}
              onChangeText={(v) => { setAmountPaid(v); setPaidInFull(false); }}
              editable={!paidInFull}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Paid in full</Text>
            <Switch
              value={paidInFull}
              onValueChange={(v) => { setPaidInFull(v); if (v) setAmountPaid(String(Math.round(totalAmount * 100) / 100)); }}
              trackColor={{ false: '#DDD', true: GOLD }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any additional notes..."
          placeholderTextColor="#999"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Create Bill</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Error Popup - when bill fails to create */}
      <Modal visible={showErrorPopup} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successPopup}>
            <Text style={[styles.successIcon, { color: '#E74C3C' }]}>⚠</Text>
            <Text style={styles.successTitle}>Could Not Create Bill</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.successBtnPrimary}
              onPress={() => setShowErrorPopup(false)}
            >
              <Text style={styles.successBtnPrimaryText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bill Created Success Popup */}
      <Modal visible={showSuccessPopup} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successPopup}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Bill Created</Text>
            {createdBill && (
              <>
                <Text style={styles.successBillNo}>{createdBill.billNumber}</Text>
                <Text style={styles.successDate}>{formatDateTimeIST(createdBill.date)}</Text>
              </>
            )}
            <View style={styles.successButtons}>
              <TouchableOpacity
                style={styles.successBtnPrimary}
                onPress={() => {
                  setShowSuccessPopup(false);
                  navigation.replace('BillDetail', { billId: createdBill._id });
                }}
              >
                <Text style={styles.successBtnPrimaryText}>View Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.successBtnSecondary}
                onPress={() => {
                  setShowSuccessPopup(false);
                  setCreatedBill(null);
                  navigation.goBack();
                }}
              >
                <Text style={styles.successBtnSecondaryText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3EE' },
  content: { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: NAVY, marginBottom: 10, marginTop: 16 },

  customerCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: GOLD,
  },
  input: {
    borderWidth: 1, borderColor: '#EEE', borderRadius: 8, padding: 12,
    fontSize: 15, color: '#333', marginBottom: 10,
  },
  addressInput: { minHeight: 60, textAlignVertical: 'top' },

  addItemBtn: {
    backgroundColor: NAVY, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4,
  },
  addItemText: { color: GOLD, fontWeight: '700', fontSize: 15 },

  totalsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8,
  },
  totalLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#333' },
  inputRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, marginTop: 4,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  toggleLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  totalInput: {
    borderWidth: 1, borderColor: '#EEE', borderRadius: 6, padding: 8, width: 120,
    textAlign: 'right', fontSize: 14, color: '#333',
  },
  grandTotalRow: { borderTopWidth: 2, borderTopColor: GOLD, marginTop: 6, paddingTop: 12 },
  grandTotalLabel: { fontSize: 17, fontWeight: '800', color: NAVY },
  grandTotalValue: { fontSize: 20, fontWeight: '800', color: GOLD },

  notesInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 14, color: '#333',
    minHeight: 80, textAlignVertical: 'top',
  },

  saveBtn: {
    backgroundColor: GOLD, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  successOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  successPopup: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 320, alignItems: 'center',
  },
  successIcon: { fontSize: 48, color: '#27AE60', marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 4 },
  successBillNo: { fontSize: 16, color: GOLD, fontWeight: '700', marginBottom: 4 },
  successDate: { fontSize: 12, color: '#888', marginBottom: 20 },
  successButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  successBtnPrimary: {
    flex: 1, backgroundColor: GOLD, borderRadius: 10, padding: 14, alignItems: 'center',
  },
  successBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successBtnSecondary: {
    flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: NAVY, borderRadius: 10, padding: 14, alignItems: 'center',
  },
  successBtnSecondaryText: { color: NAVY, fontWeight: '700', fontSize: 15 },
  errorMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
});
