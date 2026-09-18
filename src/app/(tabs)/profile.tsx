import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { colors, spacing, typography } from '@/constants/design';
import { auth } from '@/lib/firebase';

const SUPPORT_EMAIL = 'support@u-sewa.in';

const MENU_ITEMS = [
  { id: '1', label: 'My Bookings', icon: 'calendar-outline' },
  { id: '2', label: 'Settings', icon: 'settings-outline' },
  { id: '3', label: 'Help & Support', icon: 'help-circle-outline' },
  { id: '4', label: 'Log Out', icon: 'log-out-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  // Refresh the name whenever this tab gains focus (e.g. after Edit Profile)
  useFocusEffect(
    useCallback(() => {
      setDisplayName(auth.currentUser?.displayName ?? '');
    }, [])
  );

  const openSupportEmail = async () => {
    const subject = encodeURIComponent('U-Sewa Support Request');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'No Mail App Found',
        `Please email us at ${SUPPORT_EMAIL}`
      );
    }
  };

  const handleMenuPress = async (label: string) => {
    if (label === 'My Bookings') {
      router.navigate('/bookings');
    } else if (label === 'Settings') {
      router.push('/settings');
    } else if (label === 'Help & Support') {
      Alert.alert(
        'Help & Support',
        `Need help? Contact us at ${SUPPORT_EMAIL}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Email Support', onPress: openSupportEmail },
        ]
      );
    } else if (label === 'Log Out') {
      await signOut(auth);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <ThemedText style={styles.name}>{displayName || 'U-Sewa User'}</ThemedText>
        <ThemedText style={styles.email}>{user?.email || ''}</ThemedText>
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.label)}
          >
            <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
            <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
            <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
          </TouchableOpacity>
        ))}
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
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  email: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: 2,
  },
  menu: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
});