// src/screens/coach/CoachDashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../services/supabase';
import InviteService from '../../services/inviteService';

export default function CoachDashboardScreen({ navigation }) {
  const [coachName, setCoachName] = useState('Coach');
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach name
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      setCoachName(userData?.name || 'Coach');

      // Get recent clients

      const clients = await InviteService.getCoachClients(user.id);
      // Filter out invalid clients
      const filteredClients = clients.filter(item => item.client);
      setRecentClients(filteredClients.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const ClientItem = ({ client }) => {
    const name = client.client?.name || 'Unnamed Client';
    return (
      <TouchableOpacity
        style={styles.clientItem}
        onPress={() => navigation.navigate('ClientDetails', { clientId: client.client?.id })}
      >
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
            {name?.[0]?.toUpperCase() || 'C'}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{name}</Text>
          <Text style={styles.clientActivity}>
            Last active: {getRelativeTime(client.created_at)}
          </Text>
        </View>
        <Text style={styles.clientArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, Coach {coachName}!</Text>
      </View>

      {/* Assign Workouts Card */}
      <View style={styles.assignCard}>
        <Text style={styles.assignTitle}>Assign workouts to your clients</Text>
        <Text style={styles.assignSubtitle}>
          Get your clients moving and motivated by assigning them personalized workouts
        </Text>
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => navigation.navigate('CreateWorkout')}
        >
          <Text style={styles.assignButtonText}>Assign Workouts</Text>
        </TouchableOpacity>
      </View>

      {/* Clients Section */}
      <View style={styles.clientsSection}>
        <View style={styles.clientsHeader}>
          <Text style={styles.clientsTitle}>Clients</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Clients')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {// ...existing code...
        loading ? (
          <Text style={styles.loadingText}>Loading clients...</Text>
        ) : recentClients.length > 0 ? (
          recentClients.map((client) => (
            <ClientItem
              key={(client.linkId ?? client.client?.id ?? '').toString()} // <-- use stable UUID
              client={client}
            />
          ))
        ) : (
// ...existing code... : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateText}>No clients yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Invite your first client to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Clients')}
            >
              <Text style={styles.emptyStateButtonText}>Invite Client</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a2820' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  menuButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  menuIcon: { color: '#ffffff', fontSize: 24 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  placeholder: { width: 40 },
  welcomeSection: { paddingHorizontal: 20, marginBottom: 24 },
  welcomeText: { color: '#ffffff', fontSize: 24, fontWeight: '700', lineHeight: 32 },
  assignCard: { backgroundColor: '#00ff41', marginHorizontal: 20, borderRadius: 16, padding: 24, marginBottom: 32 },
  assignTitle: { color: '#000000', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  assignSubtitle: { color: '#1a4a3a', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  assignButton: { backgroundColor: '#0a2820', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  assignButtonText: { color: '#00ff41', fontSize: 16, fontWeight: '700' },
  clientsSection: { paddingHorizontal: 20, paddingBottom: 40 },
  clientsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  clientsTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  viewAllText: { color: '#00ff41', fontSize: 14, fontWeight: '600' },
  clientItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f3529', borderRadius: 12, padding: 16, marginBottom: 12 },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00ff41', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  clientAvatarText: { color: '#000000', fontSize: 20, fontWeight: '700' },
  clientInfo: { flex: 1 },
  clientName: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  clientActivity: { color: '#808080', fontSize: 13 },
  clientArrow: { color: '#808080', fontSize: 24, fontWeight: '300' },
  loadingText: { color: '#808080', fontSize: 14, textAlign: 'center', padding: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateIcon: { fontSize: 64, marginBottom: 16 },
  emptyStateText: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyStateSubtext: { color: '#808080', fontSize: 14, marginBottom: 24, textAlign: 'center' },
  emptyStateButton: { backgroundColor: '#00ff41', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyStateButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
