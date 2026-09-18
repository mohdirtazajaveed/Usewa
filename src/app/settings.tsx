import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/themed-text';
import { colors, spacing, radius, typography } from '@/constants/design';

const SUPPORT_EMAIL = 'support@u-sewa.in';
const APP_VERSION = Constants.expoConfig?.version ?? 'Unknown';

const SETTINGS_ITEMS = [
  { id: '1', label: 'Edit Profile', icon: 'person-outline' },
  { id: '2', label: 'Notifications', icon: 'notifications-outline' },
  { id: '3', label: 'Language', icon: 'language-outline' },
  { id: '4', label: 'Privacy', icon: 'lock-closed-outline' },
  { id: '5', label: 'About U-Sewa', icon: 'information-circle-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();

  const handleItemPress = (label: string) => {
    if (label === 'Edit Profile') {
      router.push('/edit-profile');
    } else if (label === 'Notifications') {
      Alert.alert(
        'Notifications',
        'Booking notifications are coming soon.'
      );
    } else if (label === 'Language') {
      Alert.alert(
        'Language',
        'U-Sewa is currently available in English only. More languages are coming soon.'
      );
    } else if (label === 'Privacy') {
      Alert.alert(
        'Privacy',
        `Our full Privacy Policy is coming soon. For any privacy questions, contact us at ${SUPPORT_EMAIL}.`
      );
    } else if (label === 'About U-Sewa') {
      Alert.alert(
        'About U-Sewa',
        `Version ${APP_VERSION}\n\nU-Sewa connects you with trusted local service providers, from electricians and plumbers to tutors and more.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.menu}>
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            activeOpacity={0.6}
            onPress={() => handleItemPress(item.label)}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon as any} size={19} color={colors.primary} />
            </View>
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
  menu: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    ...typography.bodyLarge,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});