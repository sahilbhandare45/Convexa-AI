import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

interface MetricScore {
  label: string;
  score: number;
  percentage: number;
}

const METRICS: MetricScore[] = [
  { label: 'CONFIDENCE', score: 8.5, percentage: 85 },
  { label: 'CLARITY', score: 7.2, percentage: 72 },
  { label: 'STRUCTURE', score: 9.0, percentage: 90 },
];

const getSuggestions = (colors: ThemeColors) => [
  {
    color: colors.secondary,
    text: 'Your opening statement was strong, but consider pausing for 2 seconds after key points to allow the audience to process information.',
  },
  {
    color: colors.primary,
    text: 'Try to reduce the use of filler words like "actually" and "basically" during the transition between Clarity and Structure sections.',
  },
  {
    color: colors.secondary,
    text: 'Excellent eye contact simulation. To further improve confidence, use more varying vocal pitches when describing your successes.',
  },
];

export const FeedbackInsightsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const suggestions = getSuggestions(colors);
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

  // SVG circular progress values
  const size = 200;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 80;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <View style={styles.container}>
      <TopAppBar title="Session Feedback" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreAura} />
          <View style={styles.svgContainer}>
            <Svg width={size} height={size}>
              <Defs>
                <SvgLinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#afc6ff" />
                  <Stop offset="100%" stopColor="#d0bcff" />
                </SvgLinearGradient>
              </Defs>
              {/* Background circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.surfaceContainerHighest}
                strokeWidth={strokeWidth - 2}
                fill="transparent"
              />
              {/* Progress circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#scoreGrad)"
                strokeWidth={strokeWidth + 2}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={styles.scoreOverlay}>
              <Text style={styles.scoreText}>80%</Text>
              <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
            </View>
          </View>
        </View>

        {/* Detail Scores */}
        <View style={styles.metricsRow}>
          {METRICS.map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#afc6ff', '#d0bcff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${metric.percentage}%` }]}
                />
              </View>
              <Text style={styles.metricScore}>{metric.score.toFixed(1)}</Text>
            </View>
          ))}
        </View>

        {/* AI Suggestions */}
        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsIcon}>🧠</Text>
            <Text style={styles.suggestionsTitle}>Convexa's Suggestions</Text>
          </View>
          <View style={styles.suggestionsCard}>
            {suggestions.map((suggestion, idx) => (
              <View key={idx} style={styles.suggestionRow}>
                <View
                  style={[styles.suggestionDot, { backgroundColor: suggestion.color }]}
                />
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Retake Button */}
        <TouchableOpacity style={styles.retakeButton} activeOpacity={0.8}>
          <LinearGradient
            colors={['#afc6ff', '#d0bcff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.retakeGradient}
          >
            <Text style={styles.retakeText}>Retake Session</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab="Memory" onTabPress={handleTabPress} />
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
  // Score section
  scoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    position: 'relative',
  },
  scoreAura: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.tertiaryContainer,
    opacity: 0.08,
  },
  svgContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricScore: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  // Suggestions
  suggestionsSection: {
    marginBottom: 28,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  suggestionsIcon: {
    fontSize: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  suggestionsCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: 14,
  },
  suggestionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  // Retake button
  retakeButton: {
    marginBottom: 16,
  },
  retakeGradient: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#afc6ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  retakeText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});
