import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';

const BAR_DATA = [
  { day: 'MON', height: 40, opacity: 0.2 },
  { day: 'TUE', height: 55, opacity: 0.3 },
  { day: 'WED', height: 45, opacity: 0.4 },
  { day: 'THU', height: 70, opacity: 0.5 },
  { day: 'FRI', height: 65, opacity: 0.6 },
  { day: 'SAT', height: 85, opacity: 0.8 },
  { day: 'SUN', height: 92, opacity: 1.0 },
];

const getMilestones = (colors: ThemeColors) => [
  {
    icon: '📢',
    title: 'Most Clear Speaker',
    subtitle: 'Achieved 2 days ago',
    bgColor: colors.tertiaryContainer,
    textColor: colors.tertiary,
    locked: false,
  },
  {
    icon: '🏆',
    title: 'Interview Expert',
    subtitle: 'Top 5% this month',
    bgColor: colors.secondaryContainer,
    textColor: colors.secondary,
    locked: false,
  },
  {
    icon: '🔒',
    title: 'Negotiation Master',
    subtitle: '2 sessions to unlock',
    bgColor: colors.surfaceContainerHighest,
    textColor: 'rgba(73, 68, 86, 0.4)',
    locked: true,
  },
];

const SESSION_HISTORY = [
  {
    icon: '📝',
    title: 'Mock Technical Interview',
    date: 'Oct 24, 2023 • 15 mins',
    score: 92,
  },
  {
    icon: '🗣',
    title: 'Elevator Pitch Practice',
    date: 'Oct 22, 2023 • 5 mins',
    score: 85,
  },
  {
    icon: '💬',
    title: 'Casual Networking Prep',
    date: 'Oct 20, 2023 • 12 mins',
    score: 78,
  },
];

export const GrowthMetricsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const milestones = getMilestones(colors);
  const handleTabPress = (tab: TabName) => {
    const screenMap: Record<TabName, string> = {
      Home: 'HomeDashboard',
      Chat: 'ChatHistory',
      Memory: 'MemoryTimeline',
      Practice: 'PracticeCenter',
      Profile: 'AppSettings',
    };
    navigation.navigate(screenMap[tab]);
  };

  const maxBarHeight = 130;

  return (
    <View style={styles.container}>
      <TopAppBar title="Your Growth" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Summary */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={{ position: 'relative', zIndex: 10 }}>
            <Text style={styles.heroLabel}>PERFORMANCE SUMMARY</Text>
            <Text style={styles.heroTitle}>
              You've improved{' '}
              <Text style={styles.heroHighlight}>12%</Text> since your last
              session, Atharv!
            </Text>
          </View>
        </View>

        {/* Communication Skill Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Communication Skill Trend</Text>
              <Text style={styles.chartSubtitle}>Activity over the last 7 days</Text>
            </View>
            <View style={styles.weeklyBadge}>
              <Text style={styles.weeklyText}>Weekly</Text>
            </View>
          </View>
          <View style={styles.chartArea}>
            {/* Grid lines */}
            <View style={styles.gridLines}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
            {/* Bars */}
            <View style={styles.barsContainer}>
              {BAR_DATA.map((bar, idx) => {
                const barHeight = (bar.height / 100) * maxBarHeight;
                const isLast = idx === BAR_DATA.length - 1;
                return (
                  <View key={bar.day} style={styles.barWrapper}>
                    {isLast ? (
                      <LinearGradient
                        colors={[colors.secondary, colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.bar, { height: barHeight }]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: `rgba(175, 198, 255, ${bar.opacity})`,
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          {/* Day labels */}
          <View style={styles.dayLabels}>
            {BAR_DATA.map((bar) => (
              <Text key={bar.day} style={styles.dayText}>{bar.day}</Text>
            ))}
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.milestonesCard}>
          <Text style={styles.milestonesTitle}>RECENT MILESTONES</Text>
          {milestones.map((m, idx) => (
            <View
              key={idx}
              style={[
                styles.milestoneRow,
                m.locked && { opacity: 0.5 },
              ]}
            >
              <View style={[styles.milestoneIcon, { backgroundColor: m.bgColor }]}>
                <Text style={{ fontSize: 20 }}>{m.icon}</Text>
              </View>
              <View>
                <Text style={styles.milestoneTitle}>{m.title}</Text>
                <Text style={styles.milestoneSubtitle}>{m.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Active Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>ACTIVE STREAK</Text>
          <View style={styles.streakValue}>
            <Text style={styles.streakNumber}>14</Text>
            <Text style={styles.streakUnit}>Days</Text>
          </View>
        </View>

        {/* Session History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Session History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {SESSION_HISTORY.map((session, idx) => (
            <TouchableOpacity key={idx} style={styles.historyItem} activeOpacity={0.7}>
              <View style={styles.historyLeft}>
                <View style={styles.historyIcon}>
                  <Text style={{ fontSize: 18 }}>{session.icon}</Text>
                </View>
                <View>
                  <Text style={styles.historyItemTitle}>{session.title}</Text>
                  <Text style={styles.historyItemDate}>{session.date}</Text>
                </View>
              </View>
              <View style={styles.historyRight}>
                <View style={styles.scoreCol}>
                  <Text style={styles.historyScore}>{session.score}</Text>
                  <Text style={styles.historyScoreLabel}>SCORE</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab="Profile" onTabPress={handleTabPress} />
    </View>
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
  // Hero
  heroCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(175, 198, 255, 0.08)',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.onSurface,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroHighlight: {
    color: colors.primary,
  },
  // Chart
  chartCard: {
    backgroundColor: colors.glassCard,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    minHeight: 280,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  weeklyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  weeklyText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  chartArea: {
    position: 'relative',
    height: 140,
    marginBottom: 8,
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    opacity: 0.1,
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.onSurface,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  dayText: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  // Milestones
  milestonesCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  milestonesTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 52, 73, 0.5)',
    marginBottom: 10,
  },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  milestoneSubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  // Streak
  streakCard: {
    borderRadius: 16,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(175, 198, 255, 0.2)',
    backgroundColor: 'rgba(175, 198, 255, 0.05)',
  },
  streakLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.onSurface,
  },
  streakUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
    marginBottom: 4,
  },
  // History
  historySection: {
    gap: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  historyItem: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  historyItemDate: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  historyScore: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.secondary,
  },
  historyScoreLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 22,
    color: colors.onSurfaceVariant,
  },
});
