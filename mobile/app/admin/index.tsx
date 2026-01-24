import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const API_URL = 'http://localhost:3002/api';

export default function AdminScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    pendingPayments: 0,
    activeInterviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setStats({
        totalUsers: 245,
        totalExams: 18,
        pendingPayments: 12,
        activeInterviews: 5,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  const cardBg = colorScheme === 'dark' ? '#333' : '#fff';
  const adminColor = '#e74c3c';

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={[styles.header, { backgroundColor: adminColor }]}>
          <ThemedView>
            <ThemedText style={styles.greeting}>Admin Panel ⚙️</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{user?.email}</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Dashboard Stats */}
        <ThemedView style={styles.statsContainer}>
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
            { label: 'Exams', value: stats.totalExams, icon: '📝' },
            { label: 'Pending', value: stats.pendingPayments, icon: '💳' },
            { label: 'Active', value: stats.activeInterviews, icon: '🎥' },
          ].map((stat, idx) => (
            <ThemedView
              key={idx}
              style={[styles.statCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.statIcon}>{stat.icon}</ThemedText>
              <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        {/* Management Sections */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Management
          </ThemedText>
          {[
            { label: '👥 Manage Users', action: 'users' },
            { label: '📚 Manage Exams', action: 'exams' },
            { label: '💳 Payment Verification', action: 'payments' },
            { label: '🎥 Interview Management', action: 'interviews' },
            { label: '📊 Reports & Analytics', action: 'reports' },
            { label: '⚙️ System Settings', action: 'settings' },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuButton, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.menuText}>{item.label}</ThemedText>
              <ThemedText style={styles.menuArrow}>→</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: adminColor }]}>
            <ThemedText style={styles.actionText}>🔔 Send Notifications</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: adminColor }]}>
            <ThemedText style={styles.actionText}>📋 View All Submissions</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: adminColor }]}>
            <ThemedText style={styles.actionText}>💾 Backup System</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 18,
    opacity: 0.5,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
