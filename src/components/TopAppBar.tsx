import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';

interface TopAppBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  showBackButton,
  onBackPress,
}) => {
  const { colors, user } = useUser();
  const navigation = useNavigation<any>();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  
  const handleAvatarPress = () => {
    navigation.navigate('AppSettings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : (
          <Image 
            source={require('../assets/images/app_icon.png')} 
            style={styles.appIconImage} 
            resizeMode="cover"
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={handleAvatarPress}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userInitial || '?'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    backgroundColor: colors.surfaceContainer,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIconImage: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.2)',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
});
