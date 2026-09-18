import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { colors, spacing, radius, typography, cardShadow } from '@/constants/design';
import { db, auth } from '@/lib/firebase';
import { dateKeyToTimestamp, formatDateKey } from '@/lib/dates';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { providerId, date, slot } = useLocalSearchParams<{
    providerId: string;
    date: string;
    slot: string;
  }>();

  const [providerName, setProviderName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  // Guards against writing the booking twice for the SAME booking attempt
  // (re-renders), while still allowing a fresh write when the user makes
  // a genuinely new booking (different provider/date/slot).
  const lastWrittenKey = useRef<string | null>(null);

  useEffect(() => {
    async function createBooking() {
      if (!providerId || !date || !slot) return;

      const bookingKey = `${providerId}|${date}|${slot}`;
      if (lastWrittenKey.current === bookingKey) return;
      lastWrittenKey.current = bookingKey;

      setLoading(true);

      try {
        const providerDoc = await getDoc(doc(db, 'providers', providerId));
        if (!providerDoc.exists()) {
          setLoading(false);
          return;
        }
        const providerData = providerDoc.data();

        const categoryDoc = await getDoc(doc(db, 'categories', providerData.categoryId));
        const catName = categoryDoc.exists() ? categoryDoc.data().name : providerData.categoryId;

        setProviderName(providerData.name);
        setCategoryName(catName);

        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        await addDoc(collection(db, 'bookings'), {
          userId: user.uid,
          providerId,
          providerName: providerData.name,
          categoryId: providerData.categoryId,
          categoryName: catName,
          date: dateKeyToTimestamp(date),
          slot,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to create booking:', error);
      } finally {
        setLoading(false);
      }
    }

    createBooking();
  }, [providerId, date, slot]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>

        <ThemedText style={styles.title}>Booking Confirmed!</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your service request has been sent.
        </ThemedText>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Provider</ThemedText>
            <ThemedText style={styles.detailValue}>{providerName}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Service</ThemedText>
            <ThemedText style={styles.detailValue}>{categoryName}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date</ThemedText>
            <ThemedText style={styles.detailValue}>{date ? formatDateKey(date) : ''}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Time Slot</ThemedText>
            <ThemedText style={styles.detailValue}>{slot}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/home')}
        >
          <ThemedText style={styles.homeButtonText}>Back to Home</ThemedText>
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  successIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...cardShadow,
    shadowColor: colors.success,
    shadowOpacity: 0.25,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textTertiary,
  },
  detailValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  bottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  homeButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    ...cardShadow,
  },
  homeButtonText: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});