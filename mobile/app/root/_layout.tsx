import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [userRole, setUserRole] = useState('student');

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserRole(userData.role || 'student');
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return 'gear';
      case 'interviewer':
        return 'video.fill';
      case 'hr':
        return 'person.2.fill';
      default:
        return 'book.fill';
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="student"
        options={{
          title: 'Student',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      {userRole === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
          }}
        />
      )}
      {userRole === 'interviewer' && (
        <Tabs.Screen
          name="interviewer"
          options={{
            title: 'Interviews',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="video.fill" color={color} />,
          }}
        />
      )}
      {userRole === 'hr' && (
        <Tabs.Screen
          name="hr"
          options={{
            title: 'HR',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}
