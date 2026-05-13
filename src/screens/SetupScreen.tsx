import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useModelService } from '../services/ModelService';
import { AppColors } from '../theme';

type SetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ModelLoading'>;

interface SetupScreenProps {
  navigation: SetupScreenNavigationProp;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ navigation }) => {
  const {
    isVoiceAgentReady,
    downloadAndLoadAllModels,
    isLLMDownloading,
    isSTTDownloading,
    isTTSDownloading,
    llmDownloadProgress,
    sttDownloadProgress,
    ttsDownloadProgress,
    isLLMLoading,
    isSTTLoading,
    isTTSLoading,
    isLLMLoaded,
    isSTTLoaded,
    isTTSLoaded,
  } = useModelService();

  const [hasStartedInitialization, setHasStartedInitialization] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startSetup = async () => {
      if (!hasStartedInitialization) {
        setHasStartedInitialization(true);
        try {
          // Triggers downloading and loading
          await downloadAndLoadAllModels();
        } catch (error) {
          console.error("Failed during models setup", error);
        }
      }
    };

    if (isMounted) {
      startSetup();
    }

    return () => {
      isMounted = false;
    };
  }, [downloadAndLoadAllModels, hasStartedInitialization]);

  // Navigate to Home once everything is ready
  useEffect(() => {
    if (isVoiceAgentReady) {
      // Reset the stack to Home so user can't go back to Setup
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeDashboard' }],
      });
    }
  }, [isVoiceAgentReady, navigation]);

  const renderProgress = (
    label: string,
    isDownloading: boolean,
    progress: number,
    isLoading: boolean,
    isLoaded: boolean
  ) => {
    let status = 'Pending';
    if (isLoaded) status = 'Ready';
    else if (isLoading) status = 'Loading to Memory...';
    else if (isDownloading) status = `Downloading (${progress.toFixed(0)}%)`;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${isLoaded ? 100 : progress}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Initializing AI Models</Text>
        <Text style={styles.subtitle}>
          Getting things ready. This might take a moment on the first launch.
        </Text>

        <View style={styles.modelsContainer}>
          {renderProgress(
            'Language Model (LLM)',
            isLLMDownloading,
            llmDownloadProgress,
            isLLMLoading,
            isLLMLoaded
          )}
          {renderProgress(
            'Speech to Text (STT)',
            isSTTDownloading,
            sttDownloadProgress,
            isSTTLoading,
            isSTTLoaded
          )}
          {renderProgress(
            'Text to Speech (TTS)',
            isTTSDownloading,
            ttsDownloadProgress,
            isTTSLoading,
            isTTSLoaded
          )}
        </View>

        {!isVoiceAgentReady && (
          <ActivityIndicator
            size="large"
            color={AppColors.accentCyan}
            style={styles.spinner}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  modelsContainer: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  progressContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.accentCyan,
    borderRadius: 4,
  },
  spinner: {
    marginTop: 24,
  },
});
