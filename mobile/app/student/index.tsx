import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const API_URL = 'http://localhost:3002/api';

export default function StudentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState({ completedExams: 0, pendingPayments: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userData) {
        setUser(JSON.parse(userData));
      }

      if (token) {
        const examsResponse = await fetch(`${API_URL}/exams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (examsResponse.ok) {
          const examsData = await examsResponse.json();
          setExams(examsData.slice(0, 5));
          setStats({
            completedExams: examsData.filter((e: any) => e.completed).length,
            pendingPayments: examsData.filter((e: any) => e.paymentPending).length,
            interviews: 3,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const bgColor = colorScheme === 'dark' ? '#222' : '#f9f9f9';
  const cardBg = colorScheme === 'dark' ? '#333' : '#fff';

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <ThemedView>
            <ThemedText style={styles.greeting}>Welcome, {user?.name}! 👋</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{user?.email}</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Stats */}
        <ThemedView style={styles.statsContainer}>
          {[
            { label: 'Completed', value: stats.completedExams, icon: '✓' },
            { label: 'Pending', value: stats.pendingPayments, icon: '⏳' },
            { label: 'Interviews', value: stats.interviews, icon: '🎥' },
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

        {/* Quick Actions */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <ThemedText style={styles.actionText}>📚 Browse Exams</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <ThemedText style={styles.actionText}>💳 Make Payment</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <ThemedText style={styles.actionText}>🎥 Schedule Interview</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Available Exams */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Available Exams
          </ThemedText>
          {exams.length > 0 ? (
            exams.map((exam: any, idx) => (
              <TouchableOpacity key={idx} style={[styles.examCard, { backgroundColor: cardBg }]}>
                <ThemedText style={styles.examTitle}>{exam.title || 'Exam ' + (idx + 1)}</ThemedText>
                <ThemedText style={styles.examDetails}>Duration: 60 mins • Questions: 50</ThemedText>
                <ThemedText style={styles.examStatus}>
                  {exam.completed ? '✓ Completed' : '○ Not Started'}
                </ThemedText>
              </TouchableOpacity>
            ))
          ) : (
            <ThemedText style={styles.noData}>No exams available</ThemedText>
          )}
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
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
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
  examCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  examTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  examDetails: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 5,
  },
  examStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  noData: {
    textAlign: 'center',
    opacity: 0.5,
    paddingVertical: 20,
  },
});
