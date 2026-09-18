import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { colors, spacing, radius, typography, cardShadow } from '@/constants/design';
import { auth } from '@/lib/firebase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(emailParam ?? '');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sent, setSent] = useState(false);

  // Expo Router reuses screen instances, so reset everything each time this screen opens
  useFocusEffect(
    useCallback(() => {
      setEmail(emailParam ?? '');
      setSending(false);
      setErrorMessage('');
      setSent(false);
    }, [emailParam])
  );

  const goToLogin = () => {
    router.replace('/(auth)/login');
  };

  const handleSend = async () => {
    if (sending) return;
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSent(true);
    } catch (error: any) {
      console.log('Password reset error:', error);
      const code = error?.code;
      if (code === 'auth/user-not-found') {
        // Never reveal whether an account exists
        setSent(true);
      } else if (code === 'auth/invalid-email' || code === 'auth/missing-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('No internet connection. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToLogin} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons
            name={sent ? 'mail-open-outline' : 'lock-closed-outline'}
            size={28}
            color={colors.primary}
          />
        </View>

        {sent ? (
          <>
            <ThemedText style={styles.title}>Check Your Email</ThemedText>
            <ThemedText style={styles.subtitle}>
              If an account exists for this email, a password reset link has been sent. Check
              your inbox and spam folder.
            </ThemedText>

            <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={goToLogin}>
              <ThemedText style={styles.buttonText}>Back to Log In</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ThemedText style={styles.title}>Reset Password</ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter your account email and we&apos;ll send you a link to reset your password.
            </ThemedText>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textPlaceholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!sending}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />

              {errorMessage ? (
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              ) : null}

              <TouchableOpacity
                style={[styles.button, sending && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleSend}
                disabled={sending}
              >
                <ThemedText style={styles.buttonText}>
                  {sending ? 'Sending...' : 'Send Reset Link'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconBox: {
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
});