import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const API_URL = 'http://localhost:3002/api';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/root');
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = colorScheme === 'dark' ? '#1a1a1a' : '#ffffff';
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#333333';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Online Assessment
          </ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to your account</ThemedText>
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === 'dark' ? '#333333' : '#f5f5f5',
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

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <ThemedView
              style={[
                styles.passwordInput,
                {
                  backgroundColor: colorScheme === 'dark' ? '#333333' : '#f5f5f5',
                  borderColor: Colors[colorScheme ?? 'light'].tint,
                },
              ]}>
              <TextInput
                style={[styles.input, { color: textColor, flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#cccccc'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <ThemedText style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
            <ThemedText style={styles.link}>Forgot Password?</ThemedText>
          </TouchableOpacity>

          <ThemedView style={styles.divider} />

          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <ThemedText style={styles.registerText}>
              Don't have an account? <ThemedText style={styles.registerLink}>Register</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

import { TextInput } from 'react-native';

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
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingRight: 15,
  },
  eyeIcon: {
    fontSize: 18,
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
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
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  registerText: {
    textAlign: 'center',
    fontSize: 14,
  },
  registerLink: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
});
