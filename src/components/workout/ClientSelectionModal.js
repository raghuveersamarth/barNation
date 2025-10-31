import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';

export default function ClientSelectionModal({ 
  visible, 
  clients, 
  selectedClients, 
  onToggleClient, 
  onClose, 
  themeColor 
}) {
  const renderClient = ({ item }) => {
    const isSelected = selectedClients.includes(item.client.id);
    return (
      <TouchableOpacity 
        style={[styles.clientItem, isSelected && { backgroundColor: themeColor }]} 
        onPress={() => onToggleClient(item.client.id)}
      >
        <Text style={[styles.clientName, isSelected && { color: '#000' }]}>
          {item.client.name}
        </Text>
        <Text style={[styles.clientEmail, isSelected && { color: '#000' }]}>
          {item.client.email}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColor }]}>Select Clients</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {clients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No clients yet</Text>
              <Text style={styles.emptySubtext}>Invite clients to get started</Text>
            </View>
          ) : (
            <FlatList 
              data={clients} 
              renderItem={renderClient} 
              keyExtractor={(item) => item.client.id} 
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141414', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#737373', fontSize: 28, fontWeight: '300' },
  clientItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#262626' },
  clientName: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  clientEmail: { color: '#737373', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#737373', fontSize: 14 },
});
