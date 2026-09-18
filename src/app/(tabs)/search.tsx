import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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

export default function SearchScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesSnap, providersSnap] = await Promise.all([
          getCategories(),
          getDocs(collection(db, 'providers')),
        ]);

        const categoryResults = categoriesSnap;
        setCategories(categoryResults);

        const nameMap: Record<string, string> = {};
        categoryResults.forEach((cat) => {
          nameMap[cat.id] = cat.name;
        });
        setCategoryNames(nameMap);

        const providerResults: Provider[] = providersSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          categoryId: d.data().categoryId,
          rating: d.data().rating,
        }));
        setProviders(providerResults);
      } catch (error) {
        console.error('Failed to fetch search data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const trimmedQuery = query.trim().toLowerCase();

  const matchedCategories = useMemo(() => {
    if (!trimmedQuery) return [];
    return categories.filter((cat) => cat.name.toLowerCase().includes(trimmedQuery));
  }, [trimmedQuery, categories]);

  const matchedProviders = useMemo(() => {
    if (!trimmedQuery) return [];
    return providers.filter((p) => p.name.toLowerCase().includes(trimmedQuery));
  }, [trimmedQuery, providers]);

  const hasResults = matchedCategories.length > 0 || matchedProviders.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Search</ThemedText>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textPlaceholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories or providers..."
          placeholderTextColor={colors.textPlaceholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={colors.textPlaceholder} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !trimmedQuery ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="search" size={40} color={colors.textPlaceholder} />
          </View>
          <ThemedText style={styles.emptyText}>Search for services and providers</ThemedText>
        </View>
      ) : !hasResults ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="sad-outline" size={40} color={colors.textPlaceholder} />
          </View>
          <ThemedText style={styles.emptyText}>No results for "{query}"</ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.results}>
          {matchedCategories.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
              {matchedCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.resultCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/provider-list?category=${cat.id}&from=search`)}
                >
                  <View style={styles.resultIconBox}>
                    <Ionicons name={cat.icon as any} size={20} color={colors.primary} />
                  </View>
                  <ThemedText style={styles.resultName}>{cat.name}</ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {matchedProviders.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Providers</ThemedText>
              {matchedProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.resultCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/provider-profile?id=${provider.id}&from=search`)}
                >
                  <View style={styles.resultIconBox}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.resultProviderInfo}>
                    <ThemedText style={styles.resultName}>{provider.name}</ThemedText>
                    <ThemedText style={styles.resultSubtext}>
                      {categoryNames[provider.categoryId] || provider.categoryId}
                    </ThemedText>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={colors.warning} />
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
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
  results: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  resultProviderInfo: {
    flex: 1,
  },
  resultName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
  },
  resultSubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
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