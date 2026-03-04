import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Modal,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { billAPI } from '../services/api';
import { formatINR, formatDateTimeIST } from '../utils/formatCurrency';
import { SHOP_NAME, SHOP_ADDRESS, SHOP_PHONE } from '../config/shop';
import { showError } from '../utils/errorHandler';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';
const STATUS_COLORS = { paid: '#27AE60', unpaid: '#E74C3C', partial: '#F39C12' };

export default function BillDetailScreen({ route, navigation }) {
  const { billId } = route.params;
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    loadBill();
  }, [billId]);

  const loadBill = async () => {
    try {
      const res = await billAPI.getById(billId);
      setBill(res.data);
    } catch {
      // Error shown by api interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfUrl = billAPI.getPdfUrl(billId);
      await Linking.openURL(pdfUrl);
    } catch {
      // Error shown by api interceptor
    }
  };

  const handlePrintBill = async () => {
    if (!bill) return;
    const html = generateBillHTML(bill);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Print.printAsync({ uri });
    } catch {
      // Error shown by api interceptor
    }
  };

  const handleShareBill = async () => {
    if (!bill) return;
    const html = generateBillHTML(bill);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        showError('Sharing is not available on this device');
      }
    } catch {
      // Error shown by api interceptor
    }
  };

  const handleDelete = () => setShowDeleteConfirm(true);

  const performDelete = async () => {
    setDeleting(true);
    try {
      await billAPI.delete(billId);
      setShowDeleteConfirm(false);
      navigation.goBack();
    } catch {
      // Error shown by api interceptor
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!bill || bill.amountPaid >= bill.totalAmount) return;
    setMarkingPaid(true);
    try {
      await billAPI.update(billId, { amountPaid: bill.totalAmount });
      setBill({ ...bill, amountPaid: bill.totalAmount, status: 'paid' });
    } catch {
      // Error shown by api interceptor
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Bill not found</Text>
      </View>
    );
  }

  const customer = bill.customer || {};
  const balanceDue = bill.totalAmount - bill.amountPaid;

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Shop Info */}
      <View style={styles.shopCard}>
        <Text style={styles.shopName}>{SHOP_NAME}</Text>
        {SHOP_ADDRESS ? <Text style={styles.shopAddress}>{SHOP_ADDRESS}</Text> : null}
        {SHOP_PHONE ? <Text style={styles.shopPhone}>{SHOP_PHONE}</Text> : null}
      </View>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.billNumber}>{bill.billNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[bill.status] }]}>
            <Text style={styles.statusText}>{bill.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDateTimeIST(bill.date)}</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer</Text>
        <Text style={styles.custName}>{customer.name}</Text>
        {customer.phone ? <Text style={styles.custDetail}>Phone: {customer.phone}</Text> : null}
        {customer.address ? <Text style={styles.custDetail}>{customer.address}</Text> : null}
      </View>

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Item</Text>
          <Text style={[styles.th, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Price</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Total</Text>
        </View>
        {(bill.items || []).map((item, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>{item.productName}</Text>
              {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
            </View>
            <Text style={[styles.td, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</Text>
            <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{formatINR(item.price)}</Text>
            <Text style={[styles.tdBold, { flex: 1, textAlign: 'right' }]}>{formatINR(item.total)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.card}>
        <TotalRow label="Subtotal" value={formatINR(bill.subtotal)} />
        {bill.discount > 0 && <TotalRow label="Discount" value={`-${formatINR(bill.discount)}`} color="#E74C3C" />}
        {bill.tax > 0 && <TotalRow label="Tax (GST)" value={formatINR(bill.tax)} />}
        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>TOTAL</Text>
          <Text style={styles.grandValue}>{formatINR(bill.totalAmount)}</Text>
        </View>
        {bill.amountPaid > 0 && <TotalRow label="Amount Paid" value={formatINR(bill.amountPaid)} color="#27AE60" />}
        {balanceDue > 0 && <TotalRow label="Balance Due" value={formatINR(balanceDue)} color="#E74C3C" bold />}
        {balanceDue > 0 && (
          <TouchableOpacity
            style={styles.markPaidBtn}
            onPress={handleMarkPaid}
            disabled={markingPaid}
          >
            {markingPaid ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.markPaidBtnText}>Mark as paid (full amount)</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Notes */}
      {bill.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notesText}>{bill.notes}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handlePrintBill}>
          <Text style={styles.actionIcon}>🖨️</Text>
          <Text style={styles.actionLabel}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShareBill}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadPDF}>
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionLabel}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={[styles.actionLabel, { color: '#E74C3C' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Delete Confirmation Modal */}
    <Modal visible={showDeleteConfirm} transparent animationType="fade">
      <View style={styles.deleteOverlay}>
        <View style={styles.deletePopup}>
          <Text style={styles.deleteTitle}>Delete Bill</Text>
          <Text style={styles.deleteMessage}>Are you sure you want to delete this bill? This cannot be undone.</Text>
          <View style={styles.deleteButtons}>
            <TouchableOpacity
              style={styles.deleteCancelBtn}
              onPress={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              <Text style={styles.deleteCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteConfirmBtn}
              onPress={performDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deleteConfirmText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </View>
  );
}

function TotalRow({ label, value, color = '#333', bold = false }) {
  return (
    <View style={trStyles.row}>
      <Text style={trStyles.label}>{label}</Text>
      <Text style={[trStyles.value, { color }, bold && { fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const trStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 15, fontWeight: '600' },
});

function generateBillHTML(bill) {
  const customer = bill.customer || {};
  const itemsRows = (bill.items || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#F8F6F0' : '#fff'}">
      <td style="padding:8px">${i + 1}</td>
      <td style="padding:8px"><strong>${item.productName}</strong>${item.description ? `<br><small style="color:#888">${item.description}</small>` : ''}</td>
      <td style="padding:8px;text-align:center">${item.quantity}</td>
      <td style="padding:8px;text-align:right">₹${Number(item.price).toLocaleString('en-IN')}</td>
      <td style="padding:8px;text-align:right"><strong>₹${Number(item.total).toLocaleString('en-IN')}</strong></td>
    </tr>
  `).join('');

  return `
    <html><body style="font-family:Arial;margin:0;padding:20px;color:#333">
      <div style="background:#1B2A4A;color:#fff;padding:20px;border-radius:8px;margin-bottom:20px">
        <h1 style="margin:0;color:#C5A55A">${SHOP_NAME}</h1>
        ${SHOP_ADDRESS ? `<p style="margin:4px 0 0;font-size:12px;color:#B8C4D8">${SHOP_ADDRESS}</p>` : ''}
        ${SHOP_PHONE ? `<p style="margin:4px 0 0;font-size:12px;color:#B8C4D8">${SHOP_PHONE}</p>` : ''}
        <p style="margin:4px 0 0;font-size:12px;color:#B8C4D8">Men's Premium Wedding Attire</p>
        <div style="float:right;text-align:right;margin-top:-40px">
          <h2 style="color:#C5A55A;margin:0">INVOICE</h2>
          <p style="margin:4px 0;font-size:12px">${bill.billNumber}</p>
          <p style="margin:0;font-size:12px">${formatDateTimeIST(bill.date)}</p>
        </div>
        <div style="clear:both"></div>
      </div>
      <div style="background:#F8F6F0;padding:16px;border-radius:8px;margin-bottom:20px">
        <strong>Bill To:</strong><br>
        ${customer.name || 'N/A'}<br>
        ${customer.phone ? `Phone: ${customer.phone}<br>` : ''}
        ${customer.address || ''}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr style="background:#1B2A4A;color:#fff">
          <th style="padding:10px;text-align:left">#</th>
          <th style="padding:10px;text-align:left">Item</th>
          <th style="padding:10px;text-align:center">Qty</th>
          <th style="padding:10px;text-align:right">Price</th>
          <th style="padding:10px;text-align:right">Total</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div style="text-align:right;margin-bottom:20px">
        <p>Subtotal: <strong>₹${Number(bill.subtotal).toLocaleString('en-IN')}</strong></p>
        ${bill.discount > 0 ? `<p style="color:#E74C3C">Discount: -₹${Number(bill.discount).toLocaleString('en-IN')}</p>` : ''}
        ${bill.tax > 0 ? `<p>Tax (GST): ₹${Number(bill.tax).toLocaleString('en-IN')}</p>` : ''}
        <hr style="border-top:2px solid #C5A55A">
        <h2 style="color:#1B2A4A">TOTAL: ₹${Number(bill.totalAmount).toLocaleString('en-IN')}</h2>
        ${bill.amountPaid > 0 ? `<p style="color:#27AE60">Paid: ₹${Number(bill.amountPaid).toLocaleString('en-IN')}</p>` : ''}
        ${bill.totalAmount - bill.amountPaid > 0 ? `<p style="color:#E74C3C"><strong>Balance Due: ₹${Number(bill.totalAmount - bill.amountPaid).toLocaleString('en-IN')}</strong></p>` : ''}
      </div>
      ${bill.notes ? `<div style="background:#F8F6F0;padding:12px;border-radius:6px"><strong>Notes:</strong> ${bill.notes}</div>` : ''}
      <div style="text-align:center;margin-top:30px;padding:16px;background:#1B2A4A;color:#C5A55A;border-radius:8px">
        <strong>Thank you for your business!</strong>
        <p style="color:#aaa;font-size:10px;margin-top:6px">Goods once sold will not be taken back.</p>
      </div>
    </body></html>
  `;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3EE' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3EE' },
  errorText: { fontSize: 16, color: '#999' },

  shopCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  shopName: { fontSize: 18, fontWeight: '800', color: NAVY },
  shopAddress: { fontSize: 13, color: '#666', marginTop: 4 },
  shopPhone: { fontSize: 13, color: '#666', marginTop: 2 },

  headerCard: {
    backgroundColor: NAVY, borderRadius: 14, padding: 20, marginBottom: 12,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billNumber: { fontSize: 20, fontWeight: '800', color: GOLD },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 14 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  dateText: { fontSize: 13, color: '#B8C4D8', marginTop: 6 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: NAVY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  custName: { fontSize: 17, fontWeight: '700', color: '#333' },
  custDetail: { fontSize: 13, color: '#777', marginTop: 3 },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: NAVY, paddingBottom: 8 },
  th: { fontSize: 11, fontWeight: '700', color: NAVY, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tableRowAlt: { backgroundColor: '#FAFAF8' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemDesc: { fontSize: 11, color: '#999', marginTop: 1 },
  td: { fontSize: 13, color: '#555' },
  tdBold: { fontSize: 14, fontWeight: '700', color: NAVY },

  grandRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 2, borderTopColor: GOLD, paddingTop: 10, marginTop: 6,
  },
  markPaidBtn: {
    backgroundColor: '#27AE60', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12,
  },
  markPaidBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  grandLabel: { fontSize: 18, fontWeight: '800', color: NAVY },
  grandValue: { fontSize: 22, fontWeight: '800', color: GOLD },

  notesText: { fontSize: 14, color: '#555', lineHeight: 20 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  deleteBtn: { borderWidth: 1, borderColor: '#FFDDDD' },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: NAVY },

  deleteOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  deletePopup: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 320,
  },
  deleteTitle: { fontSize: 20, fontWeight: '800', color: NAVY, marginBottom: 8 },
  deleteMessage: { fontSize: 15, color: '#666', marginBottom: 20, lineHeight: 22 },
  deleteButtons: { flexDirection: 'row', gap: 12 },
  deleteCancelBtn: {
    flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: '#DDD', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  deleteCancelText: { color: '#666', fontWeight: '700', fontSize: 15 },
  deleteConfirmBtn: {
    flex: 1, backgroundColor: '#E74C3C', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  deleteConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
