import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';

import { subscribeToModelStatus, startDownload, startLoading } from '../../services/aiModels';

export const ModelLoadingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [uiState, setUiState] = useState({
    statusText: 'Initializing ecosystem...',
    progressPct: 0,
    isDownloading: false,
    isDownloaded: false,
    isBinding: false,
    modelsReady: false
  });
  const { isLoggedIn, isLoading: isUserLoading, colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    const unsubscribe = subscribeToModelStatus((newState: any) => {
      setUiState((prev) => ({ ...prev, ...newState }));
    });
    return unsubscribe;
  }, []);



  useEffect(() => {
    if (uiState.modelsReady && !isUserLoading) {
      setTimeout(() => {
        navigation.replace(isLoggedIn ? 'HomeDashboard' : 'Auth');
      }, 600);
    }
  }, [uiState.modelsReady, navigation, isLoggedIn, isUserLoading]);

  const renderActionButton = () => {
    if (uiState.isDownloading) {
      return (
        <View style={styles.actionButtonContainer}>
          <ActivityIndicator color="#d0bcff" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonTextDisabled}>Downloading Models... {uiState.progressPct}%</Text>
        </View>
      );
    }

    if (uiState.isBinding) {
      return (
        <View style={styles.actionButtonContainer}>
          <ActivityIndicator color="#d0bcff" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonTextDisabled}>Loading to Memory...</Text>
        </View>
      );
    }

    if (!uiState.isDownloaded) {
      return (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <TouchableOpacity style={styles.actionButton} onPress={() => startDownload()}>
            <LinearGradient
              colors={['#afc6ff', '#d0bcff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Download Models</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.sizeInfoText}>Total Size: ~450MB</Text>
        </View>
      );
    }

    if (uiState.isDownloaded && !uiState.modelsReady) {
      return (
        <TouchableOpacity style={styles.actionButton} onPress={() => startLoading()}>
          <LinearGradient
            colors={['rgba(175, 198, 255, 0.4)', 'rgba(208, 188, 255, 0.4)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>Boot AI Engine</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const progressPercentage = `${uiState.progressPct}%`;
  const uiWidth = uiState.modelsReady || uiState.isBinding || uiState.isDownloaded ? '100%' : (uiState.progressPct > 0 ? progressPercentage : '5%');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/app_icon.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Convexa AI</Text>
        <Text style={styles.subtitle}>
          Private, secure, on-device intelligence.
        </Text>

        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            To operate entirely offline with full privacy, the core AI models must first be securely downloaded to your device storage for use.
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>System Status</Text>
            <Text style={styles.statusText}>{uiState.statusText}</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={['#afc6ff', '#d0bcff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: uiWidth as any }]}
            />
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          {renderActionButton()}
        </View>

      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(175, 198, 255, 0.2)',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 20,
  },
  descriptionBox: {
    backgroundColor: 'rgba(208, 188, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.1)',
    marginBottom: 40,
    width: '100%',
  },
  descriptionText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressSection: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 40,
  },
  labelRow: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 8
  },
  statusText: {
    fontSize: 13,
    color: colors.secondary,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    height: 80,
  },
  actionButton: {
    width: '80%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#d0bcff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '80%',
    backgroundColor: 'rgba(208, 188, 255, 0.05)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.15)',
  },
  actionButtonTextDisabled: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a0a0b0',
  },
  sizeInfoText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(208, 188, 255, 0.6)',
  }
});
