import React, { useState } from 'react';
import { View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';
import { useUser } from '../context/UserContext';
import { clearAllData } from '../../database/db';

const VOICE_OPTIONS = [
  'Aura (Warm & Narrative)',
  'Nova (Energetic & Sharp)',
  'Atlas (Deep & Calm)',
  'Echo (Neutral & Minimalist)',
];

export const AppSettingsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout, updateSettings, colors } = useUser();
  const [localAI, setLocalAI] = useState(true);
  const [isVoiceModalVisible, setVoiceModalVisible] = useState(false);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  // Derive settings with defaults safely
  const settings = user?.settings;
  const isDark = settings?.isDark ?? true;
  const speechSpeed = settings?.speechSpeed ?? 1.0;
  const voice = settings?.voice ?? 'Aura (Warm & Narrative)';

  const handleTabPress = (tab: TabName) => {
    const screenMap: Record<TabName, string> = {
      Home: 'HomeDashboard',
      Chat: 'ChatHistory',
      Memory: 'MemoryTimeline',
      Practice: 'PracticeCenter',
      Profile: 'AppSettings',
    };
    if (tab !== 'Profile') {
      navigation.navigate(screenMap[tab]);
    }
  };

  const handleClearMemory = () => {
    Alert.alert(
      'Clear Local Memory',
      'This will delete all conversations and messages. Your user account will remain intact. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              Alert.alert('Done', 'All conversations and messages have been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          },
        },
      ]
    );
  };

  const getSpeedPercentage = (speed: number) => {
    if (speed <= 0.5) return 0;
    if (speed === 1.0) return 50;
    if (speed >= 2.0) return 100;
    return 50;
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.container}>
      {/* Voice Selection Modal */}
      <Modal
        visible={isVoiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVoiceModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select AI Voice</Text>
            {VOICE_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.modalOption, voice === v && styles.modalOptionActive]}
                onPress={() => {
                  updateSettings({ voice: v });
                  setVoiceModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, voice === v && styles.modalOptionTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <TopAppBar title="Settings" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarGlow} />
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarEmoji}>{userInitial}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>Private Local Account</Text>
        </View>

        {/* Privacy & Core */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRIVACY & CORE</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingIcon}>🛡</Text>
                <Text style={styles.settingTitle}>Local AI Processing</Text>
              </View>
              <Text style={styles.settingDescription}>
                All your data stays encrypted on this device. Intelligence without the cloud.
              </Text>
            </View>
            <Switch
              value={localAI}
              onValueChange={setLocalAI}
              trackColor={{
                false: colors.surfaceContainerHighest,
                true: colors.primary,
              }}
              thumbColor={localAI ? colors.onPrimary : colors.outline}
            />
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXPERIENCE</Text>
          
          {/* AI Voice */}
          <View style={styles.experienceCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingIcon}>🗣</Text>
              <Text style={styles.settingTitle}>AI Voice</Text>
            </View>
            <TouchableOpacity 
              style={styles.dropdownContainer}
              activeOpacity={0.7}
              onPress={() => setVoiceModalVisible(true)}
            >
              <Text style={styles.dropdownText}>{voice}</Text>
              <Text style={styles.dropdownArrow}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* Speech Speed */}
          <View style={styles.experienceCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingIcon}>⚡</Text>
              <Text style={styles.settingTitle}>Speech Speed</Text>
            </View>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${getSpeedPercentage(speechSpeed)}%` },
                  ]}
                />
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${getSpeedPercentage(speechSpeed)}%` },
                  ]}
                />
              </View>
              <View style={styles.sliderLabels}>
                <TouchableOpacity onPress={() => updateSettings({ speechSpeed: 0.5 })} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                  <Text style={[styles.sliderLabel, speechSpeed === 0.5 && styles.sliderLabelActive]}>0.5X</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateSettings({ speechSpeed: 1.0 })} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                  <Text style={[styles.sliderLabel, speechSpeed === 1.0 && styles.sliderLabelActive]}>STANDARD</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateSettings({ speechSpeed: 2.0 })} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                  <Text style={[styles.sliderLabel, speechSpeed === 2.0 && styles.sliderLabelActive]}>2.0X</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Visuals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VISUALS</Text>
          <View style={styles.themeToggle}>
            <TouchableOpacity
              style={[styles.themeOption, isDark && styles.themeOptionActive]}
              onPress={() => updateSettings({ isDark: true })}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <Text style={[styles.themeText, isDark && styles.themeTextActive]}>
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, !isDark && styles.themeOptionActive]}
              onPress={() => updateSettings({ isDark: false })}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <Text style={[styles.themeText, !isDark && styles.themeTextActive]}>
                Light
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.error }]}>
            DANGER ZONE
          </Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerText}>
              Clearing local memory will reset your personalized AI context and history.
            </Text>
            <TouchableOpacity
              style={styles.clearButton}
              activeOpacity={0.7}
              onPress={handleClearMemory}
            >
              <Text style={styles.clearIcon}>🗑</Text>
              <Text style={styles.clearText}>Clear Local Memory</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CONVEXA OS V2.4.0</Text>
          <Text style={styles.footerText}>END-TO-END ENCRYPTED WORKSPACE</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab="Profile" onTabPress={handleTabPress} />
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
  // Modal Map
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.surfaceContainerHigh,
  },
  modalOptionActive: {
    backgroundColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  modalOptionTextActive: {
    color: colors.surfaceContainerLowest,
    fontWeight: '700',
  },
  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: 10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.background,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  // Sections
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    color: colors.primary,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingContent: {
    flex: 1,
    gap: 6,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
    maxWidth: 240,
  },
  // Experience
  experienceCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
    gap: 14,
  },
  dropdownContainer: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: colors.onSurface,
  },
  dropdownArrow: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  sliderContainer: {
    paddingTop: 8,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginLeft: -8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.outline,
    textTransform: 'uppercase',
  },
  sliderLabelActive: {
    color: colors.onSurface,
  },
  // Theme
  themeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  themeOptionActive: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  themeIcon: {
    fontSize: 14,
  },
  themeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  themeTextActive: {
    color: colors.onSurface,
  },
  // Danger
  dangerCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    gap: 14,
  },
  dangerText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  clearButton: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clearIcon: {
    fontSize: 16,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  // Logout
  logoutButton: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.15)',
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  // Footer
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
    opacity: 0.3,
    gap: 4,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
});
