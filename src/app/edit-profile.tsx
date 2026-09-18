import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing, typography } from '@/constants/design';
import { auth, db } from '@/lib/firebase';

const MAX_NAME_LENGTH = 50;

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState(auth.currentUser?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Expo Router reuses screen instances, so reset state every time this screen opens
  useFocusEffect(
    useCallback(() => {
      setName(auth.currentUser?.displayName ?? '');
      setSaving(false);
      setError('');
    }, [])
  );

  const trimmed = name.trim();
  const unchanged = trimmed === (auth.currentUser?.displayName ?? '');
  const canSave = trimmed.length > 0 && !unchanged && !saving;

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (!trimmed) {
      setError('Name cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateProfile(user, { displayName: trimmed });
      // merge: true also creates the doc if signup's profile write had failed
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
      await setDoc(
        userRef,
        {
          name: trimmed,
          email: user.email ?? '',
          ...(userSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      );
      Alert.alert('Profile Updated', 'Your name has been saved.', [
        { text: 'OK', onPress: () => router.push('/settings') },
      ]);
    } catch (e: any) {
      console.log('Edit profile error:', e);
      setError(
        e?.code === 'auth/network-request-failed'
          ? 'No internet connection. Please try again.'
          : 'Could not save your name. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <ThemedText style={styles.label}>Name</ThemedText>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError('');
          }}
          placeholder="Your name"
          placeholderTextColor={colors.textPlaceholder}
          maxLength={MAX_NAME_LENGTH}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!saving}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (canSave) handleSave();
          }}
        />
        <ThemedText style={styles.helper}>
          {name.length}/{MAX_NAME_LENGTH}
        </ThemedText>

        <ThemedText style={styles.label}>Email</ThemedText>
        <View style={styles.readOnlyBox}>
          <ThemedText style={styles.readOnlyText}>
            {auth.currentUser?.email ?? ''}
          </ThemedText>
        </View>
        <ThemedText style={styles.helper}>Email can't be changed here.</ThemedText>

        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <TouchableOpacity
          style={[styles.button, !canSave && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.buttonText}>
            {saving ? 'Saving...' : 'Save'}
          </ThemedText>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  readOnlyBox: {
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  readOnlyText: {
    ...typography.bodyLarge,
    color: colors.textPlaceholder,
  },
  helper: {
    ...typography.caption,
    color: colors.textPlaceholder,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.background,
  },
});