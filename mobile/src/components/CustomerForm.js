import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { customerAPI } from '../services/api';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';

export default function CustomerForm({ onCustomerCreated, onCancel }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return setError('Name is required');
    if (!phone.trim()) return setError('Phone is required');
    setError('');
    setLoading(true);
    try {
      const res = await customerAPI.create({ name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim() });
      onCustomerCreated(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Customer</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="Customer Name *" placeholderTextColor="#999" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone Number *" placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#999" value={address} onChangeText={setAddress} multiline />
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Save Customer</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: NAVY, marginBottom: 16 },
  error: { color: '#E74C3C', fontSize: 13, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12,
    fontSize: 15, marginBottom: 12, color: '#333',
  },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { color: '#999', fontSize: 15, fontWeight: '600' },
  saveBtn: { backgroundColor: GOLD, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
