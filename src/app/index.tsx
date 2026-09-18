import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { auth } from '@/lib/firebase';

export default function SplashScreen() {
  const router = useRouter();

  // We wait for BOTH of these before navigating:
  // 1. The minimum splash screen time (so it doesn't flash too quickly)
  // 2. Firebase telling us whether someone is already logged in
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isLoggedIn = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 1800);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      isLoggedIn.current = !!user;
      setAuthChecked(true);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (minTimeElapsed && authChecked) {
      router.replace(isLoggedIn.current ? '/(tabs)/home' : '/(auth)/login');
    }
  }, [minTimeElapsed, authChecked]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.logoBox}>
          <ThemedText style={styles.logoText}>U</ThemedText>
        </View>
        <ThemedText style={styles.appName}>U-Sewa</ThemedText>
        <ThemedText style={styles.tagline}>
          Trusted local services, at your doorstep
        </ThemedText>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B5FFF',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0B5FFF',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 14,
    color: '#DCE6FF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});