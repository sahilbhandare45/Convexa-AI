import React, { useState, useEffect, useCallback } from 'react';
import { View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeColors } from '../theme/colors';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';
import {
  getAllConversations,
  getMessagesByConversation,
} from '../../database/db';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

interface RecentData {
  id: number;
  title: string;
  timeAgo: string;
  messageCount: number;
  preview: string;
}

export const HomeDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [recent, setRecent] = useState<RecentData | null>(null);
  const { user, colors } = useUser();
  const userName = user?.name || 'User';
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getTimeAgo = (dateStr: string): string => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'JUST NOW';
    if (mins < 60) return `${mins} MIN${mins > 1 ? 'S' : ''} AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
    const days = Math.floor(hours / 24);
    return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
  };

  const loadRecentInteraction = useCallback(async () => {
    try {
      const conversations = await getAllConversations();
      if (!conversations || conversations.length === 0) {
        setRecent(null);
        return;
      }
      const latest = conversations[0];
      const msgs = await getMessagesByConversation(latest.id);
      const msgCount = msgs?.length || 0;
      const firstAiMsg = msgs?.find((m: any) => m.sender === 'ai');
      let preview = firstAiMsg?.text || msgs?.[0]?.text || 'No messages yet';
      if (preview.length > 100) preview = preview.substring(0, 100) + '...';

      setRecent({
        id: latest.id,
        title: latest.title || 'Untitled Conversation',
        timeAgo: getTimeAgo(latest.updated_at || latest.created_at),
        messageCount: msgCount,
        preview,
      });
    } catch (e) {
      console.log('[Home] Load recent error:', e);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[Demo] Flow: User entered Home Dashboard');
      loadRecentInteraction();
    });
    return unsubscribe;
  }, [navigation, loadRecentInteraction]);

  const handleTabPress = (tab: TabName) => {
    const screenMap: Record<TabName, string> = {
      Home: 'HomeDashboard',
      Chat: 'ChatHistory',
      Memory: 'MemoryTimeline',
      Practice: 'PracticeCenter',
      Profile: 'AppSettings',
    };
    if (tab !== 'Home') {
      navigation.navigate(screenMap[tab]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopAppBar title="Convexa AI" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting & Status */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {getGreeting()},{"\n"}
            <Text style={styles.greetingName}>{userName}</Text>
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDotOuter}>
              <View style={styles.statusDot} />
            </View>
            <Text style={styles.statusText}>
              CONVEXA IS READY. YOUR DATA STAYS HERE.
            </Text>
          </View>
        </View>

        {/* Start Conversation Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ConvexaChat')}
        >
          <View style={[styles.glassCard, styles.conversationCard]}>
            <View style={styles.cardGlow} />
            <View>
              <Text style={styles.cardIcon}>💬</Text>
              <Text style={styles.cardTitle}>Start Conversation</Text>
              <Text style={styles.cardDescription}>
                Explore new ideas with your personal AI companion.
              </Text>
            </View>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>Begin</Text>
              <Text style={styles.cardArrow}> →</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Practice Mode Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PracticeCenter')}
        >
          <View
            style={[styles.practiceCard, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <View>
              <Text style={[styles.cardIcon, { color: colors.secondary }]}>🧠</Text>
              <Text style={styles.cardTitle}>Communication Practice Mode</Text>
              <Text style={styles.cardDescription}>
                Sharpen your skills for the next big role.
              </Text>
            </View>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: colors.secondary }]}>
                Launch
              </Text>
              <Text style={[styles.cardArrow, { color: colors.secondary }]}> →</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Review Memory Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('MemoryTimeline')}
        >
          <View
            style={[styles.reviewCard, { backgroundColor: colors.surfaceContainerLow }]}
          >
            <View style={styles.reviewContent}>
              <View style={styles.reviewIconContainer}>
                <Text style={styles.reviewIcon}>◆</Text>
              </View>
              <View style={styles.reviewTextContainer}>
                <Text style={styles.cardTitle}>Review Memory</Text>
                <Text style={styles.cardDescription}>
                  Access your persistent context and insights.
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Interaction */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Interaction</Text>
          {recent ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ConvexaChat', { conversationId: recent.id })}
            >
              <View style={styles.recentCard}>
                <View style={styles.recentIcon}>
                  <Text style={{ color: colors.primaryFixedDim, fontSize: 20 }}>⏱</Text>
                </View>
                <View style={styles.recentContent}>
                  <View style={styles.recentHeader}>
                    <Text style={styles.recentTime}>{recent.timeAgo}</Text>
                    <Text style={styles.recentDuration}>{recent.messageCount} messages</Text>
                  </View>
                  <Text style={styles.recentTitle}>{recent.title}</Text>
                  <Text style={styles.recentDescription} numberOfLines={2}>
                    {recent.preview}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.recentCard}>
              <View style={styles.recentIcon}>
                <Text style={{ color: colors.primaryFixedDim, fontSize: 20 }}>💭</Text>
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>No interactions yet</Text>
                <Text style={styles.recentDescription}>
                  Start a conversation and it will appear here.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button (Mic) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ImmersiveVoiceMode')}
      >
        <LinearGradient
          colors={['#afc6ff', '#d0bcff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>🎤</Text>
        </LinearGradient>
      </TouchableOpacity>

      <BottomNavBar activeTab="Home" onTabPress={handleTabPress} />
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
  greetingSection: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.onSurface,
    lineHeight: 46,
    letterSpacing: -1,
  },
  greetingName: {
    color: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  statusDotOuter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  statusText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  glassCard: {
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  conversationCard: {
    backgroundColor: colors.glassCard,
    height: 220,
    justifyContent: 'space-between',
  },
  cardGlow: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(175, 198, 255, 0.15)',
  },
  practiceCard: {
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    height: 220,
    justifyContent: 'space-between',
  },
  reviewCard: {
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  reviewIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(100, 69, 134, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewIcon: {
    fontSize: 22,
    color: colors.tertiary,
  },
  reviewTextContainer: {
    flex: 1,
  },
  cardIcon: {
    fontSize: 28,
    color: colors.primary,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  cardArrow: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  recentCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
    flexDirection: 'row',
    gap: 16,
  },
  recentIcon: {
    marginTop: 4,
  },
  recentContent: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentTime: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  recentDuration: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 4,
  },
  recentDescription: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    zIndex: 50,
  },
  fabGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.background,
  },
});
