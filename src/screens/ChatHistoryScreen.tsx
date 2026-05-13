import React, { useState, useCallback } from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';
import {
  initDB,
  getAllConversations,
  deleteConversation,
  getMessageCount,
} from '../../database/db';

interface ConversationItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messageCount?: number;
}

export const ChatHistoryScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const loadConversations = async () => {
    try {
      await initDB();
      const convos = await getAllConversations();
      // Get message count for each
      const withCounts = await Promise.all(
        convos.map(async (c: any) => ({
          ...c,
          messageCount: await getMessageCount(c.id),
        }))
      );
      setConversations(withCounts);
    } catch (e) {
      console.log('Failed to load conversations:', e);
    }
  };

  // Reload every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      'Delete Chat',
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(id);
              setConversations((prev) => prev.filter((c) => c.id !== id));
            } catch (e) {
              console.log('Delete failed:', e);
            }
          },
        },
      ]
    );
  };

  const handleOpenChat = (conversationId: number) => {
    navigation.navigate('ConvexaChat', { conversationId });
  };

  const handleNewChat = () => {
    navigation.navigate('ConvexaChat', { conversationId: null });
  };

  const handleTabPress = (tab: TabName) => {
    const screenMap: Record<TabName, string> = {
      Home: 'HomeDashboard',
      Chat: 'ChatHistory',
      Memory: 'MemoryTimeline',
      Practice: 'PracticeCenter',
      Profile: 'AppSettings',
    };
    if (tab !== 'Chat') {
      navigation.navigate(screenMap[tab]);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: ConversationItem }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => handleOpenChat(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.chatCardLeft}>
        <View style={styles.chatIcon}>
          <Text style={styles.chatIconText}>💬</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.chatMeta}>
            {item.messageCount || 0} messages · {formatDate(item.updated_at)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.title)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopAppBar title="Your Chats" />

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💭</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new chat with Convexa AI
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* New Chat FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <BottomNavBar activeTab="Chat" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 180,
    gap: 10,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  chatCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  chatIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(175, 198, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIconText: {
    fontSize: 18,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  chatMeta: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    opacity: 0.5,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 100, 100, 0.08)',
  },
  deleteIcon: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 26,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
