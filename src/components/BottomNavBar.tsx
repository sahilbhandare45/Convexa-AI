import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import LinearGradient from 'react-native-linear-gradient';

export type TabName = 'Home' | 'Chat' | 'Memory' | 'Practice' | 'Profile';

interface BottomNavBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TABS: { name: TabName; icon: string }[] = [
  { name: 'Home', icon: '⌂' },
  { name: 'Chat', icon: '💬' },
  { name: 'Memory', icon: '◇' },
  { name: 'Practice', icon: '⚙' },
  { name: 'Profile', icon: '👤' },
];

const TAB_ICONS: Record<TabName, string> = {
  Home: '⌂',
  Chat: '💬',
  Memory: '◈',
  Practice: '🧠',
  Profile: '👤',
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabButton, isActive && styles.activeTabButton]}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            {isActive ? (
              <LinearGradient
                colors={['#afc6ff', '#d0bcff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeGradient}
              >
                <Text style={styles.activeIcon}>
                  {getIconChar(tab.name)}
                </Text>
              </LinearGradient>
            ) : (
              <Text style={styles.inactiveIcon}>
                {getIconChar(tab.name)}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

function getIconChar(name: TabName): string {
  switch (name) {
    case 'Home': return '⌂';
    case 'Chat': return '▪';
    case 'Memory': return '◆';
    case 'Practice': return '⚙';
    case 'Profile': return '●';
  }
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 16,
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  tabButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabButton: {
    width: 56,
    height: 56,
  },
  activeGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  activeIcon: {
    fontSize: 22,
    color: colors.onPrimary,
  },
  inactiveIcon: {
    fontSize: 22,
    color: colors.onSurfaceVariant,
  },
});
