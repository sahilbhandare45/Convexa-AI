import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { RootStackParamList } from '../navigation/types';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'HomeDashboard'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[AppColors.primaryDark, '#0B1021', AppColors.primaryMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Area */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Good Evening,</Text>
              <Text style={styles.name}>Alex</Text>
            </View>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[AppColors.accentCyan, AppColors.accentViolet]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>A</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Insight / Progress Widget */}
          <View style={styles.insightWrapper}>
            <LinearGradient
              colors={['rgba(0, 217, 255, 0.15)', 'rgba(139, 92, 246, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightCard}
            >
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>✨</Text>
                <Text style={styles.insightTitle}>Weekly Insight</Text>
              </View>
              <Text style={styles.insightText}>
                Your conversational fluency improved by <Text style={styles.highlight}>12%</Text> this week. You are using fewer filler words.
              </Text>
            </LinearGradient>
          </View>

          {/* Primary Action - Start Chat */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ImmersiveVoiceMode')}
            style={styles.primaryActionWrapper}
          >
            <LinearGradient
              colors={[AppColors.accentCyan, '#0EA5E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryActionCard}
            >
              <View style={styles.primaryActionContent}>
                <Text style={styles.primaryActionTitle}>Start Voice Session</Text>
                <Text style={styles.primaryActionSub}>Talk with your AI Coach</Text>
              </View>
              <View style={styles.playIconContainer}>
                <Text style={styles.playIcon}>🎙️</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Practice Scenarios */}
          <Text style={styles.sectionTitle}>Practice Scenarios</Text>
          <View style={styles.gridContainer}>
            <View style={styles.row}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.scenarioCard}
                onPress={() => navigation.navigate('ConvexaChat', { mode: 'interview' })}
              >
                <LinearGradient
                  colors={[AppColors.surfaceElevated, AppColors.surfaceCard]}
                  style={styles.scenarioGradient}
                >
                  <Text style={styles.scenarioIcon}>💼</Text>
                  <Text style={styles.scenarioTitle}>Interview Prep</Text>
                  <Text style={styles.scenarioSub}>Mock interviews</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.scenarioCard}
                onPress={() => navigation.navigate('ImmersiveVoiceMode')}
              >
                <LinearGradient
                  colors={[AppColors.surfaceElevated, AppColors.surfaceCard]}
                  style={styles.scenarioGradient}
                >
                  <Text style={styles.scenarioIcon}>🎤</Text>
                  <Text style={styles.scenarioTitle}>Presentation</Text>
                  <Text style={styles.scenarioSub}>Public speaking</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.scenarioCard}
                onPress={() => navigation.navigate('ConvexaChat', { mode: 'daily_chat' })}
              >
                <LinearGradient
                  colors={[AppColors.surfaceElevated, AppColors.surfaceCard]}
                  style={styles.scenarioGradient}
                >
                  <Text style={styles.scenarioIcon}>👋</Text>
                  <Text style={styles.scenarioTitle}>Casual Chat</Text>
                  <Text style={styles.scenarioSub}>Reduce social anxiety</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.scenarioCard} />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  insightWrapper: {
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: AppColors.accentViolet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  insightCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.accentCyan,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 16,
    color: AppColors.textPrimary,
    lineHeight: 24,
  },
  highlight: {
    color: AppColors.accentCyan,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  primaryActionWrapper: {
    marginBottom: 32,
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
  },
  primaryActionContent: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  primaryActionSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  playIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
  },
  gridContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  scenarioCard: {
    flex: 1,
    height: 140,
  },
  scenarioGradient: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
  },
  scenarioIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  scenarioSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});
