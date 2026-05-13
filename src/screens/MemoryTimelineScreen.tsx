import React, { useState, useEffect, useCallback } from 'react';
import { View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';
import {
  getAllConversations,
  getMessagesByConversation,
  getMessageCount,
  deleteConversation,
} from '../../database/db';

interface MemoryCard {
  id: number;
  title: string;
  date: string;
  rawDate: string;
  tag: string;
  tagColor: string;
  preview: string;
  messageCount: number;
  isFirst: boolean;
}

type FilterCategory = 'All' | 'Conversations' | 'Practice';

export const MemoryTimelineScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [memories, setMemories] = useState<MemoryCard[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<MemoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');
  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const CATEGORIES: FilterCategory[] = ['All', 'Conversations', 'Practice'];

  // Load conversations from DB
  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Memory] Loading conversations...');
      const conversations = await getAllConversations();

      if (!conversations || conversations.length === 0) {
        setMemories([]);
        setFilteredMemories([]);
        setIsLoading(false);
        return;
      }

      const cards: MemoryCard[] = [];

      for (let i = 0; i < conversations.length; i++) {
        const convo = conversations[i];
        const msgCount = await getMessageCount(convo.id);

        // Get first user message as preview
        let preview = '';
        try {
          const msgs = await getMessagesByConversation(convo.id);
          if (msgs && msgs.length > 0) {
            // Find first user message for preview
            const firstUserMsg = msgs.find((m: any) => m.sender === 'user');
            const firstAiMsg = msgs.find((m: any) => m.sender === 'ai');
            preview = firstUserMsg?.text || firstAiMsg?.text || 'No messages';
            if (preview.length > 120) preview = preview.substring(0, 120) + '...';
          }
        } catch (e) {
          preview = 'Unable to load preview';
        }

        // Determine tag based on title
        const title = convo.title || 'Untitled';
        const isPractice = title.toLowerCase().includes('practice');
        const tag = isPractice ? 'PRACTICE' : 'CONVERSATION';
        const tagColor = isPractice ? colors.secondary : colors.primary;

        // Format date
        const dateObj = new Date(convo.updated_at || convo.created_at);
        const formattedDate = formatDate(dateObj);

        cards.push({
          id: convo.id,
          title,
          date: formattedDate,
          rawDate: convo.updated_at || convo.created_at,
          tag,
          tagColor,
          preview,
          messageCount: msgCount || 0,
          isFirst: i === 0,
        });
      }

      console.log('[Memory] Loaded', cards.length, 'conversations');
      setMemories(cards);
      setFilteredMemories(cards);
    } catch (error) {
      console.log('[Memory] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMemories();
    });
    return unsubscribe;
  }, [navigation, loadMemories]);

  // Filter by category and search
  useEffect(() => {
    let filtered = [...memories];

    // Category filter
    if (activeCategory === 'Conversations') {
      filtered = filtered.filter((m) => m.tag === 'CONVERSATION');
    } else if (activeCategory === 'Practice') {
      filtered = filtered.filter((m) => m.tag === 'PRACTICE');
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.preview.toLowerCase().includes(query)
      );
    }

    setFilteredMemories(filtered);
  }, [memories, activeCategory, searchQuery]);

  const formatDate = (date: Date): string => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${month} ${day}, ${year} • ${h12}:${mins} ${ampm}`;
  };

  const handleDeleteMemory = (card: MemoryCard) => {
    Alert.alert(
      'Delete Memory',
      `Delete "${card.title}"? This will remove all messages in this conversation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(card.id);
              console.log('[Memory] Deleted conversation:', card.id);
              setMemories((prev) => prev.filter((m) => m.id !== card.id));
            } catch (e) {
              console.log('[Memory] Delete error:', e);
            }
          },
        },
      ]
    );
  };

  const handleOpenConversation = (card: MemoryCard) => {
    navigation.navigate('ConvexaChat', { conversationId: card.id });
  };

  const handleTabPress = (tab: TabName) => {
    const screenMap: Record<TabName, string> = {
      Home: 'HomeDashboard',
      Chat: 'ChatHistory',
      Memory: 'MemoryTimeline',
      Practice: 'PracticeCenter',
      Profile: 'AppSettings',
    };
    if (tab !== 'Memory') {
      navigation.navigate(screenMap[tab]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopAppBar title="Your Memory" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your memories..."
            placeholderTextColor="rgba(218, 226, 253, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.filterIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesLabel}>CATEGORIES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  activeCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineLabel}>TIMELINE</Text>

          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>Loading memories...</Text>
            </View>
          ) : filteredMemories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {searchQuery ? '🔍' : '💭'}
              </Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No results found' : 'No memories yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start a conversation and your memories will appear here'}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.timelineLine} />
              {filteredMemories.map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.timelineCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenConversation(card)}
                  onLongPress={() => handleDeleteMemory(card)}
                >
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: index === 0
                          ? colors.primary
                          : 'rgba(208, 188, 255, 0.5)',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.cardBody,
                      {
                        borderLeftColor: index === 0
                          ? colors.primary
                          : 'rgba(208, 188, 255, 0.3)',
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardDate}>{card.date}</Text>
                      <View
                        style={[
                          styles.tagBadge,
                          {
                            backgroundColor: `${card.tagColor}15`,
                          },
                        ]}
                      >
                        <Text style={[styles.tagText, { color: card.tagColor }]}>
                          {card.tag}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {card.preview}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={{ fontSize: 14, color: colors.secondary }}>
                        💬
                      </Text>
                      <Text style={[styles.footerText, { color: `${colors.onSurfaceVariant}cc` }]}>
                        {card.messageCount} messages
                      </Text>
                      <View style={styles.footerSpacer} />
                      <Text style={styles.footerHint}>Tap to open • Hold to delete</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab="Memory" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 18,
    color: 'rgba(175, 198, 255, 0.6)',
  },
  searchInput: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 15,
  },
  filterIcon: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
  },
  // Categories
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.primary,
    opacity: 0.8,
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    marginRight: 12,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  categoryTextActive: {
    color: colors.surfaceContainerLowest,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
  },
  emptyText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Timeline
  timelineSection: {
    position: 'relative',
    paddingLeft: 24,
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.primary,
    opacity: 0.8,
    marginBottom: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 30,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(175, 198, 255, 0.15)',
  },
  timelineCard: {
    position: 'relative',
    marginBottom: 32,
  },
  timelineDot: {
    position: 'absolute',
    left: -20,
    top: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardBody: {
    backgroundColor: colors.glassCard,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardDate: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(203, 195, 217, 0.7)',
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
  },
  footerSpacer: {
    flex: 1,
  },
  footerHint: {
    fontSize: 10,
    color: 'rgba(203, 195, 217, 0.4)',
    fontStyle: 'italic',
  },
});
