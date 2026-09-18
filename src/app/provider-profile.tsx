import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { colors, spacing, radius, typography, cardShadow } from '@/constants/design';
import { db } from '@/lib/firebase';

type Provider = {
  id: string;
  name: string;
  categoryId: string;
  rating: number;
  experience: string;
  bio: string;
};

// Builds "&from=...&category=..." so the origin survives a trip through Booking
function originQuery(from?: string, category?: string) {
  let q = '';
  if (from) q += `&from=${encodeURIComponent(from)}`;
  if (category) q += `&category=${encodeURIComponent(category)}`;
  return q;
}

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { id, from, category } = useLocalSearchParams<{
    id: string;
    from?: string;
    category?: string;
  }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    // Expo Router reuses this screen, so clear the previous provider on every new id
    let cancelled = false;
    setProvider(null);
    setCategoryName('');
    setLoading(true);
    setError(false);

    async function fetchProvider() {
      if (!id) {
        // No id: show "Provider not found" instead of spinning forever
        setLoading(false);
        return;
      }

      try {
        const providerDoc = await getDoc(doc(db, 'providers', id));
        if (cancelled) return;
        if (providerDoc.exists()) {
          const data = providerDoc.data();
          setProvider({
            id: providerDoc.id,
            name: data.name,
            categoryId: data.categoryId,
            rating: data.rating,
            experience: data.experience,
            bio: data.bio,
          });

          const categoryDoc = await getDoc(doc(db, 'categories', data.categoryId));
          if (cancelled) return;
          if (categoryDoc.exists()) {
            setCategoryName(categoryDoc.data().name);
          } else {
            setCategoryName(data.categoryId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch provider:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProvider();

    // Ignore results from an older id if the user opened another provider meanwhile
    return () => {
      cancelled = true;
    };
  }, [id, retryKey]);

  const retryFetch = () => {
    setRetryKey((current) => current + 1);
  };

  // Return to wherever the user actually came from; Home if unknown
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (from === 'search') {
      router.navigate('/search');
      return;
    }
    if (from === 'provider-list') {
      const listCategory = category || provider?.categoryId;
      if (listCategory) {
        router.push(`/provider-list?category=${listCategory}`);
        return;
      }
    }
    router.navigate('/home');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          {error ? (
            <>
              <ThemedText style={styles.emptyText}>
                We couldn't load this provider. Please try again.
              </ThemedText>
              <TouchableOpacity onPress={retryFetch} activeOpacity={0.7} style={styles.retryButton}>
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <ThemedText style={styles.emptyText}>Provider not found.</ThemedText>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Provider Profile</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={44} color={colors.primary} />
          </View>
          <ThemedText style={styles.name}>{provider.name}</ThemedText>
          <ThemedText style={styles.category}>{categoryName}</ThemedText>

          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <ThemedText style={styles.ratingText}>{provider.rating}</ThemedText>
            </View>
            <ThemedText style={styles.experienceText}>{provider.experience} experience</ThemedText>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <View style={styles.bioCard}>
            <ThemedText style={styles.bioText}>{provider.bio}</ThemedText>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Now button */}
      <View style={styles.bookBar}>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.85}
          onPress={() =>
            router.push(`/booking?providerId=${provider.id}${originQuery(from, category)}`)
          }
        >
          <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
  },
  retryText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  profileTop: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  category: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  ratingText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  experienceText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  bioCard: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  bioText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
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
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    ...cardShadow,
  },
  bookButtonText: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});