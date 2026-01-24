import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TextInput } from 'react-native';

const API_URL = 'http://localhost:3002/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Check your email for password reset link');
        router.push('/auth/login');
      } else {
        Alert.alert('Error', data.error || 'Failed to process request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = colorScheme === 'dark' ? '#333333' : '#f5f5f5';
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#333333';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Reset Password
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter your email to receive password reset instructions
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor: Colors[colorScheme ?? 'light'].tint,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#cccccc'}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ThemedView>

          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleResetPassword}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.resetButtonText}>Send Reset Link</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <ThemedText style={styles.link}>Back to Sign In</ThemedText>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  resetButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#0a7ea4',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
});
