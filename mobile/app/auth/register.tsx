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

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'student',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Registration successful! Please login.');
        router.push('/auth/login');
      } else {
        Alert.alert('Registration Failed', data.error || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const textColor = colorScheme === 'dark' ? '#ffffff' : '#333333';
  const bgColor = colorScheme === 'dark' ? '#333333' : '#f5f5f5';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText style={styles.subtitle}>Join Online Assessment Portal</ThemedText>
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          {[
            { key: 'name', label: 'Full Name', placeholder: 'Enter your full name' },
            { key: 'email', label: 'Email', placeholder: 'Enter your email', keyboardType: 'email-address' },
            { key: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', keyboardType: 'phone-pad' },
            { key: 'password', label: 'Password', placeholder: 'Enter password', secureTextEntry: true },
            { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Confirm password', secureTextEntry: true },
          ].map((field) => (
            <ThemedView key={field.key} style={styles.inputGroup}>
              <ThemedText style={styles.label}>{field.label}</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: bgColor,
                    color: textColor,
                    borderColor: Colors[colorScheme ?? 'light'].tint,
                  },
                ]}
                placeholder={field.placeholder}
                placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#cccccc'}
                value={formData[field.key as keyof typeof formData]}
                onChangeText={(text) =>
                  setFormData({ ...formData, [field.key]: text })
                }
                editable={!loading}
                secureTextEntry={field.secureTextEntry || false}
                keyboardType={(field.keyboardType as any) || 'default'}
                autoCapitalize={field.key === 'email' ? 'none' : 'sentences'}
              />
            </ThemedView>
          ))}

          <TouchableOpacity
            style={[
              styles.registerButton,
              {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.registerButtonText}>Create Account</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <ThemedText style={styles.loginText}>
              Already have an account? <ThemedText style={styles.loginLink}>Sign In</ThemedText>
            </ThemedText>
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
    marginBottom: 30,
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
    marginBottom: 15,
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
  registerButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 15,
  },
  loginLink: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
});
