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

export default function InterviewerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([
    { id: 1, studentName: 'John Doe', time: '2:00 PM', status: 'Pending' },
    { id: 2, studentName: 'Jane Smith', time: '3:30 PM', status: 'Completed' },
    { id: 3, studentName: 'Mike Johnson', time: '4:00 PM', status: 'Scheduled' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviewerData();
  }, []);

  const loadInterviewerData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading interviewer data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#f39c12';
      case 'Completed':
        return '#27ae60';
      case 'Scheduled':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  const cardBg = colorScheme === 'dark' ? '#333' : '#fff';
  const interviewerColor = '#9b59b6';

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={[styles.header, { backgroundColor: interviewerColor }]}>
          <ThemedView>
            <ThemedText style={styles.greeting}>Interviewer Dashboard 🎥</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{user?.email}</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Today's Stats */}
        <ThemedView style={styles.statsContainer}>
          {[
            { label: "Today's Interviews", value: 3, icon: '📅' },
            { label: 'Completed', value: 1, icon: '✓' },
            { label: 'Pending', value: 1, icon: '⏳' },
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

        {/* Interview List */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Today's Interviews
          </ThemedText>
          {interviews.map((interview) => (
            <TouchableOpacity
              key={interview.id}
              style={[styles.interviewCard, { backgroundColor: cardBg }]}>
              <ThemedView style={styles.interviewContent}>
                <ThemedText style={styles.studentName}>{interview.studentName}</ThemedText>
                <ThemedText style={styles.interviewTime}>📍 {interview.time}</ThemedText>
              </ThemedView>
              <ThemedView
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(interview.status) },
                ]}>
                <ThemedText style={styles.statusText}>{interview.status}</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: interviewerColor }]}>
            <ThemedText style={styles.actionText}>🎥 Start Interview</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: interviewerColor }]}>
            <ThemedText style={styles.actionText}>📝 View Feedback</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: interviewerColor }]}>
            <ThemedText style={styles.actionText}>⭐ Rate Student</ThemedText>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  interviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  interviewContent: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  interviewTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
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
