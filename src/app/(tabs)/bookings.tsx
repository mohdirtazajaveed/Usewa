import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import type { Timestamp } from 'firebase/firestore';
import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/design';
import { formatBookingDate } from '@/lib/dates';
import { auth, db } from '@/lib/firebase';

type Booking = {
  id: string;
  providerName: string;
  categoryName: string;
  date: Timestamp | string;
  slot: string;
  status: string;
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function fetchBookings() {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(bookingsQuery);
      const results: Booking[] = snapshot.docs.map((d) => ({
        id: d.id,
        providerName: d.data().providerName,
        categoryName: d.data().categoryName,
        date: d.data().date,
        slot: d.data().slot,
        status: d.data().status,
      }));
      setBookings(results);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      setErrorMessage("Couldn't load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  function confirmCancel(bookingId: string, providerName: string) {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking with ${providerName}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        { text: 'Cancel Booking', style: 'destructive', onPress: () => handleCancel(bookingId) },
      ]
    );
  }

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      Alert.alert('Error', 'Could not cancel this booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }

  function statusStyle(status: string) {
    if (status === 'cancelled') {
      return { badge: styles.statusBadgeCancelled, text: styles.statusTextCancelled };
    }
    if (status === 'completed') {
      return { badge: styles.statusBadgeCompleted, text: styles.statusTextCompleted };
    }
    return { badge: styles.statusBadge, text: styles.statusText };
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>My Bookings</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          </View>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar" size={40} color={colors.textPlaceholder} />
          </View>
          <ThemedText style={styles.emptyText}>You have no bookings yet</ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {bookings.map((booking) => {
            const s = statusStyle(booking.status);
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <ThemedText style={styles.providerName}>{booking.providerName}</ThemedText>
                  <View style={s.badge}>
                    <ThemedText style={s.text}>{booking.status}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.categoryText}>{booking.categoryName}</ThemedText>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                  <ThemedText style={styles.detailText}>{formatBookingDate(booking.date)}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                  <ThemedText style={styles.detailText}>{booking.slot}</ThemedText>
                </View>

                {booking.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.7}
                    disabled={cancellingId === booking.id}
                    onPress={() => confirmCancel(booking.id, booking.providerName)}
                  >
                    {cancellingId === booking.id ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <ThemedText style={styles.cancelButtonText}>Cancel Booking</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconBox: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  bookingCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEE4E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusTextCancelled: {
    ...typography.caption,
    color: colors.danger,
    textTransform: 'capitalize',
  },
  statusBadgeCompleted: {
    backgroundColor: '#D1FADF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusTextCompleted: {
    ...typography.caption,
    color: colors.success,
    textTransform: 'capitalize',
  },
  categoryText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.danger,
  },
});