import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { colors, spacing, radius, typography, cardShadow } from '@/constants/design';
import { auth, db } from '@/lib/firebase';

// Writes the user's profile doc, retrying once if the first attempt fails
// (e.g. a transient network blip right after signup). Never throws — a
// failed profile write should not block the user from being signed in.
async function createUserProfileDocument(uid: string, profile: { name: string; email: string }) {
  const userRef = doc(db, 'users', uid);
  const payload = { ...profile, createdAt: serverTimestamp() };

  try {
    await setDoc(userRef, payload);
  } catch (firstError) {
    console.error('Failed to create user profile document, retrying once:', firstError);
    try {
      await setDoc(userRef, payload);
    } catch (secondError) {
      console.error('Failed to create user profile document after retry:', secondError);
    }
  }
}

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async () => {
    setErrorMessage('');

    if (!name || !email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name.trim() });

      // Create the user's profile document. If this fails (even after a
      // retry), the auth account still exists and is valid — we don't
      // block the user, we just log it for debugging.
      await createUserProfileDocument(user.uid, { name: name.trim(), email: email.trim() });

      router.replace('/(tabs)/home');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandBox}>
          <Ionicons name="storefront" size={28} color={colors.primary} />
        </View>

        <ThemedText style={styles.title}>Create Account</ThemedText>
        <ThemedText style={styles.subtitle}>Join U-Sewa to book trusted services</ThemedText>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.textPlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {errorMessage ? (
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={handleSignup}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
          <Link href="/(auth)/login">
            <ThemedText style={styles.link}>Log In</ThemedText>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  brandBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyLarge,
    fontWeight: '400',
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxxl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundMuted,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...cardShadow,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  link: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});