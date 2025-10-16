// src/screens/coach/ClientListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { supabase } from '../../services/supabase';
import InviteService from '../../services/inviteService';

export default function ClientListScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load clients and invites in parallel
      const [clientsData, invitesData] = await Promise.all([
        InviteService.getCoachClients(user.id),
        InviteService.getCoachInvites(user.id)
      ]);

      setClients(clientsData);
      setInvites(invitesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim() && inviteEmail !== '') {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setCreatingInvite(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const inviteCode = await InviteService.createInvite(
        user.id, 
        inviteEmail.trim() || null
      );

      Alert.alert(
        'Invite Created!',
        `Share this code with your client: ${inviteCode}`,
        [
          { text: 'Copy Code', onPress: () => {
            // In a real app, you'd use Clipboard API here
            // console.log('Code to copy:', inviteCode);
          }},
          { text: 'OK', onPress: () => {
            setShowCreateInvite(false);
            setInviteEmail('');
            loadData(); // Refresh the invites list
          }}
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create invite');
    } finally {
      setCreatingInvite(false);
    }
  };

  const ClientCard = ({ client }) => (
    <TouchableOpacity style={styles.clientCard} activeOpacity={0.8}>
      <View style={styles.clientHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{client.client.name?.[0]?.toUpperCase() || 'C'}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.client.name || 'Unknown Client'}</Text>
          <Text style={styles.clientEmail}>{client.client.email}</Text>
          <Text style={styles.clientMeta}>
            {client.client.age ? `${client.client.age} years • ` : ''}
            {client.client.gender || 'Not specified'} • 
            Joined {new Date(client.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {/* Placeholder for progress/stats - will be implemented later */}
      <View style={styles.clientStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>WORKOUTS</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PROGRESS</Text>
          <Text style={styles.statValue}>--%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>LAST ACTIVE</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const InviteCard = ({ invite }) => (
    <View style={[styles.inviteCard, invite.status === 'expired' && styles.expiredCard]}>
      <View style={styles.inviteHeader}>
        <Text style={styles.inviteCode}>{invite.invite_code}</Text>
        <View style={[
          styles.statusBadge, 
          styles[`status${invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}`]
        ]}>
          <Text style={styles.statusText}>{invite.status.toUpperCase()}</Text>
        </View>
      </View>
      
      {invite.client_email && (
        <Text style={styles.inviteEmail}>For: {invite.client_email}</Text>
      )}
      
      {invite.status === 'accepted' && invite.client && (
        <Text style={styles.acceptedBy}>Accepted by: {invite.client.name}</Text>
      )}
      
      <Text style={styles.inviteDate}>
        Created: {new Date(invite.created_at).toLocaleDateString()}
      </Text>
      
      {invite.expires_at && invite.status === 'pending' && (
        <Text style={styles.expireDate}>
          Expires: {new Date(invite.expires_at).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading clients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YOUR LIFTERS</Text>
        <Text style={styles.headerSubtitle}>
          {clients.length} clients • {invites.filter(i => i.status === 'pending').length} pending invites
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#00ff41"
            colors={['#00ff41']}
          />
        }
      >
        {/* Add Client Button */}
        <TouchableOpacity 
          style={styles.addClientButton}
          onPress={() => setShowCreateInvite(!showCreateInvite)}
        >
          <Text style={styles.addClientIcon}>+</Text>
          <Text style={styles.addClientText}>INVITE NEW CLIENT</Text>
        </TouchableOpacity>

        {/* Create Invite Form */}
        {showCreateInvite && (
          <View style={styles.inviteForm}>
            <Text style={styles.formTitle}>CREATE INVITE CODE</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Client email (optional)"
              placeholderTextColor="#737373"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateInvite}
                disabled={creatingInvite}
              >
                <Text style={styles.createButtonText}>
                  {creatingInvite ? 'CREATING...' : 'CREATE CODE'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateInvite(false);
                  setInviteEmail('');
                }}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Clients */}
        {clients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACTIVE CLIENTS</Text>
            {clients.map((client) => (
              <ClientCard
                key={(client.linkId ?? client.client?.id ?? client.client_id ?? client.id ?? '').toString()}
                client={client}
              />
           ))}
          </View>
        )}
        {/* Pending Invites */}
        {invites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INVITES</Text>
            {invites.map((invite) => (
              <InviteCard key={invite.id} invite={invite} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {clients.length === 0 && invites.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>NO CLIENTS YET</Text>
            <Text style={styles.emptyText}>
              Start building your coaching empire by inviting your first client
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#00ff41',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    color: '#00ff41',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: '#00ff41',
    textShadowRadius: 15,
  },
  headerSubtitle: {
    color: '#d4d4d4',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#d4d4d4',
    fontSize: 16,
  },
  addClientButton: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#00ff41',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 20,
  },
  addClientIcon: {
    color: '#00ff41',
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  addClientText: {
    color: '#00ff41',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  inviteForm: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00ff41',
    marginBottom: 20,
  },
  formTitle: {
    color: '#00ff41',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  emailInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#00ff41',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#404040',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#d4d4d4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  clientCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  clientHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00ff41',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  clientEmail: {
    color: '#00ff41',
    fontSize: 14,
    marginBottom: 4,
  },
  clientMeta: {
    color: '#737373',
    fontSize: 12,
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: '#d4d4d4',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  expiredCard: {
    opacity: 0.6,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteCode: {
    color: '#00ff41',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  statusAccepted: {
    backgroundColor: 'rgba(0, 255, 65, 0.2)',
  },
  statusExpired: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  inviteEmail: {
    color: '#d4d4d4',
    fontSize: 14,
    marginBottom: 4,
  },
  acceptedBy: {
    color: '#00ff41',
    fontSize: 14,
    marginBottom: 4,
  },
  inviteDate: {
    color: '#737373',
    fontSize: 12,
    marginBottom: 2,
  },
  expireDate: {
    color: '#ffa500',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#d4d4d4',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyText: {
    color: '#737373',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});