import React, { useState } from 'react';
import { View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';

interface PracticeMode {
  id: string;
  icon: string;
  bgIcon: string;
  title: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
}

const getPracticeModes = (colors: ThemeColors): PracticeMode[] => [
  {
    id: '1',
    icon: '💼',
    bgIcon: '💼',
    title: 'Job Interview',
    description: 'Simulate professional high-stakes career conversations.',
    iconColor: colors.primary,
    iconBgColor: 'rgba(0, 79, 177, 0.2)',
  },
  {
    id: '2',
    icon: '🗣',
    bgIcon: '🗣',
    title: 'Public Speaking',
    description: 'Master your flow, tone, and delivery for large audiences.',
    iconColor: colors.secondary,
    iconBgColor: 'rgba(87, 27, 193, 0.2)',
  },
  {
    id: '3',
    icon: '💬',
    bgIcon: '💬',
    title: 'Daily Chat',
    description:
      'Casual, fluid dialogue to improve your everyday social skills.',
    iconColor: colors.tertiary,
    iconBgColor: 'rgba(100, 69, 134, 0.2)',
  },
];

const MODE_MAP: Record<string, string> = {
  '1': 'interview',
  '2': 'public_speaking',
  '3': 'daily_chat',
};

export const PracticeCenterScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [practiceMode, setPracticeMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState('interview');
  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const practiceModes = getPracticeModes(colors);

  React.useEffect(() => {
    console.log('[Demo] Practice Center loaded');
  }, []);

  const handleTabPress = (tab: TabName) => {
    const screenMap: Record<TabName, string> = {
      Home: 'HomeDashboard',
      Chat: 'ChatHistory',
      Memory: 'MemoryTimeline',
      Practice: 'PracticeCenter',
      Profile: 'AppSettings',
    };
    if (tab !== 'Practice') {
      navigation.navigate(screenMap[tab]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopAppBar title="Practice Mode" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Central AI Orb */}
        <TouchableOpacity
          style={styles.orbSection}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ImmersiveVoiceMode')}
        >
          <View style={styles.orbGlow} />
          <LinearGradient
            colors={['#afc6ff', '#d0bcff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbBorder}
          >
            <View style={styles.orbInner}>
              <View style={styles.orbRadialGlow} />
              <Text style={styles.orbIcon}>🧠</Text>
            </View>
          </LinearGradient>
          <Text style={styles.orbLabel}>READY TO LISTEN</Text>
        </TouchableOpacity>

        {/* Practice Mode Cards */}
        {practiceModes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            activeOpacity={0.8}
            onPress={() => {
              console.log('[Demo] Practice card tapped:', mode.title);
            }}
          >
            <View style={styles.modeCardBgIcon}>
              <Text style={{ fontSize: 56, opacity: 0.08 }}>{mode.bgIcon}</Text>
            </View>
            <View>
              <View style={[styles.modeIconContainer, { backgroundColor: mode.iconBgColor }]}>
                <Text style={{ fontSize: 20 }}>{mode.icon}</Text>
              </View>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </View>
            <TouchableOpacity
              style={styles.startButton}
              activeOpacity={0.7}
              onPress={() => {
                const modeKey = MODE_MAP[mode.id] || 'interview';
                setPracticeMode(true);
                setSelectedMode(modeKey);
                navigation.navigate('ConvexaChat', { practiceMode: true, mode: modeKey });
              }}
            >
              <Text style={styles.startButtonText}>Start Session →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab="Practice" onTabPress={handleTabPress} />
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
    alignItems: 'center',
  },
  // AI Orb
  orbSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  orbGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    opacity: 0.08,
    top: -10,
  },
  orbBorder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 2,
  },
  orbInner: {
    flex: 1,
    borderRadius: 78,
    backgroundColor: colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  orbRadialGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(175, 198, 255, 0.15)',
  },
  orbIcon: {
    fontSize: 48,
  },
  orbLabel: {
    marginTop: 16,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.primary,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  // Mode cards
  modeCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 28,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 240,
    justifyContent: 'space-between',
  },
  modeCardBgIcon: {
    position: 'absolute',
    top: 16,
    right: 20,
  },
  modeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  modeDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
    maxWidth: 200,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
});
