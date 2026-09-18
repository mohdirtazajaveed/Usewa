import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/design';
import { toDateKey } from '@/lib/dates';
import { db } from '@/lib/firebase';

type Provider = {
  id: string;
  name: string;
  categoryId: string;
};

// Build a simple list of the next 7 days, e.g. "Mon 15", "Tue 16"
function getNextSevenDays() {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: `${dayNames[d.getDay()]} ${d.getDate()}`,
      value: toDateKey(d),
    });
  }
  return days;
}

// Builds "&from=...&category=..." so Provider Profile keeps the original origin
function originQuery(from?: string, category?: string) {
  let q = '';
  if (from) q += `&from=${encodeURIComponent(from)}`;
  if (category) q += `&category=${encodeURIComponent(category)}`;
  return q;
}

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

export default function BookingScreen() {
  const router = useRouter();
  const { providerId, from, category } = useLocalSearchParams<{
    providerId: string;
    from?: string;
    category?: string;
  }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProvider(null);
    setCategoryName('');

    async function fetchProvider() {
      if (!providerId) {
        setLoading(false);
        return;
      }

      try {
        const providerDoc = await getDoc(doc(db, 'providers', providerId));
        if (active && providerDoc.exists()) {
          const data = providerDoc.data();
          setProvider({ id: providerDoc.id, name: data.name, categoryId: data.categoryId });

          const categoryDoc = await getDoc(doc(db, 'categories', data.categoryId));
          if (active && categoryDoc.exists()) {
            setCategoryName(categoryDoc.data().name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch provider:', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProvider();
    return () => {
      active = false;
    };
  }, [providerId]);

  useEffect(() => {
    setSubmitting(false);
  }, [providerId]);

  const days = getNextSevenDays();
  const [selectedDate, setSelectedDate] = useState(days[0].value);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canConfirm = selectedDate && selectedSlot && !submitting;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      router.push(
        `/booking-confirmation?providerId=${providerId}&date=${selectedDate}&slot=${selectedSlot}`
      );
    } catch (error) {
      console.error('Failed to proceed to booking confirmation:', error);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.push(`/provider-profile?id=${providerId}${originQuery(from, category)}`)
          }
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Book Service</ThemedText>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Provider summary */}
            {provider && (
              <View style={styles.providerCard}>
                <View style={styles.providerAvatar}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View>
                  <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                  <ThemedText style={styles.providerCategory}>{categoryName}</ThemedText>
                </View>
              </View>
            )}

            {/* Date picker */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {days.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.chip,
                      selectedDate === day.value && styles.chipSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedDate(day.value)}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        selectedDate === day.value && styles.chipTextSelected,
                      ]}
                    >
                      {day.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time slot picker */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Select Time Slot</ThemedText>
              <View style={styles.slotRow}>
                {TIME_SLOTS.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotChip,
                      selectedSlot === slot && styles.chipSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        selectedSlot === slot && styles.chipTextSelected,
                      ]}
                    >
                      {slot}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Confirm button */}
          <View style={styles.bookBar}>
            <TouchableOpacity
              style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
              disabled={!canConfirm}
              activeOpacity={0.85}
              onPress={handleConfirm}
            >
              <ThemedText style={styles.confirmButtonText}>
                {submitting ? 'Confirming...' : 'Confirm Booking'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </>
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  providerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  providerName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  providerCategory: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundMuted,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  slotChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    ...cardShadow,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textPlaceholder,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});