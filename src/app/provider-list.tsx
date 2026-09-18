import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/design';
import { db } from '@/lib/firebase';

type Provider = {
  id: string;
  name: string;
  categoryId: string;
  rating: number;
};

export default function ProviderListScreen() {
  const router = useRouter();
  const { category, from } = useLocalSearchParams<{ category: string; from?: string }>();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setProviders([]);
    setCategoryName('');

    async function fetchData() {
      if (!category) {
        setLoading(false);
        return;
      }

      try {
        // Get the category's display name (e.g. "electrician" -> "Electrician")
        const categoryDoc = await getDoc(doc(db, 'categories', category));
        if (active && categoryDoc.exists()) {
          setCategoryName(categoryDoc.data().name);
        } else if (active) {
          setCategoryName(category);
        }

        // Get all providers whose categoryId matches this category
        const providersQuery = query(
          collection(db, 'providers'),
          where('categoryId', '==', category)
        );
        const snapshot = await getDocs(providersQuery);
        const results: Provider[] = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          categoryId: d.data().categoryId,
          rating: d.data().rating,
        }));
        if (active) setProviders(results);
      } catch (err) {
        console.error('Failed to fetch providers:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, [category, retryKey]);

  const retryFetch = () => {
    setRetryKey((current) => current + 1);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (from === 'home') {
      router.replace('/home');
      return;
    }
    if (from === 'search') {
      router.replace('/search');
      return;
    }
    router.replace(category ? `/categories?category=${category}` : '/categories');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{categoryName}</ThemedText>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="cloud-offline-outline" size={28} color={colors.textPlaceholder} />
              </View>
              <ThemedText style={styles.emptyText}>
                We couldn't load providers. Please try again.
              </ThemedText>
              <TouchableOpacity onPress={retryFetch} activeOpacity={0.7} style={styles.retryButton}>
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : providers.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="search" size={28} color={colors.textPlaceholder} />
              </View>
              <ThemedText style={styles.emptyText}>
                No providers found for this category yet.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.list}>
              {providers.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.providerCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(
                      `/provider-profile?id=${provider.id}&from=provider-list&category=${category}`
                    )
                  }
                >
                  <View style={styles.providerAvatar}>
                    <Ionicons name="person" size={26} color={colors.primary} />
                  </View>
                  <View style={styles.providerInfo}>
                    <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                    <ThemedText style={styles.providerCategory}>{categoryName}</ThemedText>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={13} color={colors.warning} />
                    <ThemedText style={styles.ratingText}>{provider.rating}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
  list: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  providerInfo: {
    flex: 1,
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
    ...typography.caption,
    color: colors.textSecondary,
  },
});