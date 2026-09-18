import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/design';
import { getCategories, type Category } from '@/lib/categories';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    async function fetchCategories() {
      setError(false);
      try {
        const results = await getCategories();
        setCategories(results);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [retryKey]);

  const retryFetch = () => {
    setLoading(true);
    setRetryKey((current) => current + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>All Categories</ThemedText>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.loadingState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.textPlaceholder} />
          </View>
          <ThemedText style={styles.emptyText}>
            We couldn't load categories. Please try again.
          </ThemedText>
          <TouchableOpacity onPress={retryFetch} activeOpacity={0.7} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/provider-list?category=${cat.id}&from=provider-list`)}
              >
                <View style={styles.categoryIconBox}>
                  <Ionicons name={cat.icon as any} size={26} color={colors.primary} />
                </View>
                <ThemedText style={styles.categoryLabel}>{cat.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  categoryCard: {
    width: '22%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryIconBox: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});