import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { cardShadow, colors, radius, spacing, typography } from '@/constants/design';
import { getCategories, type Category } from '@/lib/categories';
import { db } from '@/lib/firebase';

type Provider = {
  id: string;
  name: string;
  categoryId: string;
  rating: number;
};

export default function HomeScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // categoryId -> name, so provider cards can show "Electrician" instead of "electrician"
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchCategories() {
      try {
        const results = await getCategories();
        setCategories(results);

        const nameMap: Record<string, string> = {};
        results.forEach((cat) => {
          nameMap[cat.id] = cat.name;
        });
        setCategoryNames(nameMap);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategoriesError(true);
      } finally {
        setCategoriesLoading(false);
      }
    }

    async function fetchTopProviders() {
      try {
        const providersQuery = query(
          collection(db, 'providers'),
          orderBy('rating', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(providersQuery);
        const results: Provider[] = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          categoryId: d.data().categoryId,
          rating: d.data().rating,
        }));
        setProviders(results);
      } catch (error) {
        console.error('Failed to fetch providers:', error);
        setProvidersError(true);
      } finally {
        setProvidersLoading(false);
      }
    }

    fetchCategories();
    fetchTopProviders();
  }, [retryKey]);

  const retryHomeData = () => {
    setCategoriesLoading(true);
    setProvidersLoading(true);
    setCategoriesError(false);
    setProvidersError(false);
    setRetryKey((current) => current + 1);
  };

  const showServiceArea = () => {
    Alert.alert(
      'Service Area',
      'U-Sewa currently serves Jammu, J&K. More cities are coming soon.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header: Logo + Location */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.brand}>U-Sewa</ThemedText>
            <TouchableOpacity
              style={styles.locationRow}
              activeOpacity={0.7}
              onPress={showServiceArea}
            >
              <Ionicons name="location-sharp" size={14} color={colors.primary} />
              <ThemedText style={styles.locationText}>Jammu, J&K</ThemedText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.profileIcon}
            activeOpacity={0.7}
            onPress={() => router.navigate('/profile')}
          >
            <Ionicons name="person" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Ionicons name="search" size={18} color={colors.textPlaceholder} />
          <ThemedText style={styles.searchPlaceholder}>Search for services...</ThemedText>
        </TouchableOpacity>

        {(categoriesError || providersError) && (
          <View style={styles.fetchError}>
            <ThemedText style={styles.fetchErrorText}>
              We couldn't load some Home data. Please try again.
            </ThemedText>
            <TouchableOpacity onPress={retryHomeData} activeOpacity={0.7}>
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Service Categories */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>Service Categories</ThemedText>
          <TouchableOpacity onPress={() => router.push('/categories')} activeOpacity={0.7}>
            <ThemedText style={styles.seeAll}>See All</ThemedText>
          </TouchableOpacity>
        </View>

        {categoriesLoading ? (
          <View style={styles.sectionLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : categoriesError ? null : (
          <View style={styles.categoriesGrid}>
            {categories.slice(0, 8).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/provider-list?category=${cat.id}&from=home`)}
              >
                <View style={styles.categoryIconBox}>
                  <Ionicons name={cat.icon as any} size={22} color={colors.primary} />
                </View>
                <ThemedText style={styles.categoryLabel}>{cat.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Top Rated Providers */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>Top Rated Providers</ThemedText>
        </View>

        {providersLoading ? (
          <View style={styles.sectionLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : providersError ? null : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={styles.providerCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/provider-profile?id=${provider.id}&from=home`)}
              >
                <View style={styles.providerAvatar}>
                  <Ionicons name="person" size={26} color={colors.primary} />
                </View>
                <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                <ThemedText style={styles.providerService}>
                  {categoryNames[provider.categoryId] || provider.categoryId}
                </ThemedText>
                <View style={styles.ratingRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={colors.warning} />
                    <ThemedText style={styles.ratingText}>{provider.rating}</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  brand: {
    ...typography.h1,
    color: colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  profileIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textPlaceholder,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  sectionLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  fetchError: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  fetchErrorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  retryText: {
    ...typography.bodyBold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryCard: {
    width: '22%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIconBox: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  providerScroll: {
    paddingLeft: spacing.xl,
  },
  providerCard: {
    width: 150,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  providerName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  providerService: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  ratingRow: {
    marginTop: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});