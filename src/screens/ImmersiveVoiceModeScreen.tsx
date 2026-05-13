import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  NativeModules,
  Platform,
  PermissionsAndroid,
  Alert,
  Animated, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere } from '@runanywhere/core';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { generateResponse, generateStreamResponse } from '../../services/aiModels';

const { width, height } = Dimensions.get('window');
const { NativeAudioModule } = NativeModules;

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export const ImmersiveVoiceModeScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [statusText, setStatusText] = useState("Tap the orb to begin");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');

  const isMountedRef = useRef(true);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orbScaleAnim = useRef(new Animated.Value(1)).current;

  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  // Pulse animation for listening state
  useEffect(() => {
    if (voiceState === 'listening') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else if (voiceState === 'speaking') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScaleAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(orbScaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
      orbScaleAnim.setValue(1);
    }
  }, [voiceState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (NativeAudioModule) {
        NativeAudioModule.cancelRecording().catch(() => {});
        NativeAudioModule.stopPlayback().catch(() => {});
      }
    };
  }, []);

  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Convexa needs microphone access for voice conversation.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startListening = async () => {
    if (!NativeAudioModule) {
      Alert.alert('Error', 'Native audio module not available.');
      return;
    }

    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone permission is required.');
      return;
    }

    try {
      await NativeAudioModule.startRecording();
      if (!isMountedRef.current) return;

      setVoiceState('listening');
      setStatusText("I'm listening...");
      setRecordingSeconds(0);
      setLastTranscript('');

      recordingTimerRef.current = setInterval(() => {
        if (isMountedRef.current) setRecordingSeconds((s) => s + 1);
      }, 1000);

      console.log('[Voice] Recording started');
    } catch (error) {
      console.log('[Voice] Start recording error:', error);
      if (isMountedRef.current) {
        setVoiceState('idle');
        setStatusText('Tap the orb to begin');
      }
    }
  };

  const stopAndProcess = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (!isMountedRef.current) return;
    setVoiceState('processing');
    setStatusText('Processing...');

    try {
      const result = await NativeAudioModule.stopRecording();
      const audioBase64 = result.audioBase64;

      if (!audioBase64 || result.fileSize < 1000) {
        if (isMountedRef.current) {
          setStatusText('Too short. Tap to try again.');
          setVoiceState('idle');
        }
        return;
      }

      // STT
      if (!isMountedRef.current) return;
      setStatusText('Transcribing...');
      console.log('[Voice] Transcribing audio...');

      const isModelLoaded = await RunAnywhere.isSTTModelLoaded();
      if (!isModelLoaded) {
        if (isMountedRef.current) {
          setStatusText('Speech model not loaded.');
          setVoiceState('idle');
          Alert.alert('Model Required', 'Please load the speech model from the home screen.');
        }
        return;
      }

      const transcribeResult = await RunAnywhere.transcribe(audioBase64, {
        sampleRate: 16000,
        language: 'en',
      });

      const transcript = transcribeResult?.text?.trim() || '';
      console.log('[Voice] Transcript:', transcript);

      if (!transcript) {
        if (isMountedRef.current) {
          setStatusText('No speech detected. Tap to try again.');
          setVoiceState('idle');
        }
        return;
      }

      if (!isMountedRef.current) return;
      setLastTranscript(transcript);
      setStatusText('Thinking...');

      // LLM with STREAMING for faster TTS
      console.log('[Voice] Generating AI response with streaming...');
      let fullResponse = '';
      let firstSentencePlayed = false;
      const sentenceRegex = /[.!?]+/;

      await generateStreamResponse(transcript, '', async (text: string) => {
        if (!isMountedRef.current) return;
        
        fullResponse = text;
        setLastResponse(fullResponse);

        // TRIGGER TTS FOR FIRST SENTENCE
        if (!isMuted && !firstSentencePlayed) {
          const match = text.match(sentenceRegex);
          if (match && match.index !== undefined) {
            const firstSentence = text.substring(0, match.index + match[0].length).trim();
            if (firstSentence.length > 5) { // Ensure it's a real sentence
              firstSentencePlayed = true;
              console.log('[Voice] First sentence ready for TTS:', firstSentence);
              
              setVoiceState('speaking');
              setStatusText('Speaking...');
              
              try {
                const isTTSLoaded = await RunAnywhere.isTTSModelLoaded();
                if (isTTSLoaded) {
                  const ttsResult = await RunAnywhere.synthesize(firstSentence);
                  if (ttsResult?.audio && NativeAudioModule && isMountedRef.current) {
                    await NativeAudioModule.playAudioBase64(
                      ttsResult.audio,
                      22050
                    );
                  }
                }
              } catch (ttsErr) {
                console.log('[Voice] Initial TTS error:', ttsErr);
              }
            }
          }
        }
      });

      console.log('[Voice] Full AI response complete');

      // If the response was very short and didn't trigger sentences, play it all now
      if (!isMuted && !firstSentencePlayed && fullResponse) {
        console.log('[Voice] Playing full (short) response');
        setStatusText('Speaking...');
        setVoiceState('speaking');
        try {
          const isTTSLoaded = await RunAnywhere.isTTSModelLoaded();
          if (isTTSLoaded) {
            const ttsResult = await RunAnywhere.synthesize(fullResponse);
            if (ttsResult?.audio && NativeAudioModule && isMountedRef.current) {
              await NativeAudioModule.playAudioBase64(
                ttsResult.audio,
                22050
              );
              // Wait for approximate playback duration for short text
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (ttsErr) {
          console.log('[Voice] Final catch-all TTS error:', ttsErr);
        }
      } else if (firstSentencePlayed) {
        // Wait for the rest of the generated text if needed, 
        // but for now we just finish when it's done.
        // In a more advanced version, we'd queue sentences.
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Auto-restart
      if (isMountedRef.current) {
        setStatusText('Tap the orb to continue');
        setVoiceState('idle');
      }
    } catch (error) {
      console.log('[Voice] Pipeline error:', error);
      if (isMountedRef.current) {
        setStatusText('Something went wrong. Tap to retry.');
        setVoiceState('idle');
      }
    }
  };

  const handleOrbPress = async () => {
    if (voiceState === 'listening') {
      await stopAndProcess();
    } else if (voiceState === 'idle') {
      await startListening();
    }
    // Ignore taps during processing/speaking
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
  };

  const handleStopSpeaking = async () => {
    try {
      if (NativeAudioModule) {
        await NativeAudioModule.stopPlayback();
      }
    } catch (e) {}
    if (isMountedRef.current) {
      setVoiceState('idle');
      setStatusText('Tap the orb to continue');
    }
  };

  const getSecureText = () => {
    switch (voiceState) {
      case 'listening': return 'ON-DEVICE VOICE PROCESSING';
      case 'processing': return 'SECURE AI PROCESSING';
      case 'speaking': return 'AI VOICE RESPONSE';
      default: return 'SECURE AI VOICE PROCESSING';
    }
  };

  // Dynamic waveform based on state
  const getWaveformBars = () => {
    if (voiceState === 'listening') {
      return [
        { h: 20, o: 0.6 }, { h: 32, o: 0.7 }, { h: 44, o: 0.8 },
        { h: 56, o: 0.9 }, { h: 36, o: 0.8 }, { h: 64, o: 1.0 },
        { h: 52, o: 0.9 }, { h: 44, o: 0.8 }, { h: 56, o: 0.9 },
        { h: 32, o: 0.7 }, { h: 20, o: 0.6 },
      ];
    } else if (voiceState === 'speaking') {
      return [
        { h: 24, o: 0.7 }, { h: 36, o: 0.8 }, { h: 48, o: 0.9 },
        { h: 60, o: 1.0 }, { h: 40, o: 0.85 }, { h: 56, o: 0.95 },
        { h: 48, o: 0.9 }, { h: 36, o: 0.8 }, { h: 48, o: 0.85 },
        { h: 28, o: 0.7 }, { h: 16, o: 0.6 },
      ];
    }
    return [
      { h: 8, o: 0.3 }, { h: 12, o: 0.3 }, { h: 16, o: 0.4 },
      { h: 20, o: 0.4 }, { h: 14, o: 0.35 }, { h: 22, o: 0.5 },
      { h: 18, o: 0.4 }, { h: 14, o: 0.35 }, { h: 18, o: 0.4 },
      { h: 12, o: 0.3 }, { h: 8, o: 0.3 },
    ];
  };

  const waveformBars = getWaveformBars();

  return (
    <SafeAreaView style={styles.container}>
      {/* Background ambient lights */}
      <View style={styles.ambientTopLeft} />
      <View style={styles.ambientBottomRight} />

      {/* Close Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Central Area */}
      <View style={styles.centerArea}>
        {/* Background Aura */}
        <Animated.View style={[styles.bgAura, {
          opacity: voiceState === 'listening' ? 0.12 : voiceState === 'speaking' ? 0.1 : 0.06,
        }]} />

        {/* AI Orb — Tappable */}
        <TouchableOpacity
          onPress={handleOrbPress}
          activeOpacity={0.8}
          disabled={voiceState === 'processing' || voiceState === 'speaking'}
        >
          <View style={styles.orbContainer}>
            <Animated.View style={[styles.orbGlow, {
              transform: [{ scale: voiceState === 'listening' ? pulseAnim : 1 }],
              opacity: voiceState === 'listening' ? 0.12 : 0.05,
            }]} />
            <Animated.View style={[styles.orb, {
              transform: [{ scale: voiceState === 'speaking' ? orbScaleAnim : 1 }],
            }]}>
              <View style={styles.orbShimmer} />
              <View style={styles.orbHighlight} />
              {voiceState === 'listening' && (
                <View style={styles.orbRecordingIndicator}>
                  <Text style={styles.orbRecordingText}>
                    {recordingSeconds}s
                  </Text>
                </View>
              )}
              {voiceState === 'processing' && (
                <View style={styles.orbProcessingIndicator}>
                  <Text style={styles.orbProcessingText}>⏳</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Transcript / Response preview */}
        {lastTranscript ? (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>YOU SAID</Text>
            <Text style={styles.transcriptText} numberOfLines={2}>{lastTranscript}</Text>
          </View>
        ) : null}

        {/* Text */}
        <View style={styles.textOverlay}>
          <Text style={styles.listeningText}>{statusText}</Text>
          <Text style={styles.secureText}>{getSecureText()}</Text>
        </View>
      </View>

      {/* Footer: Waveform + Controls */}
      <View style={styles.footer}>
        {/* Waveform */}
        <View style={styles.waveformContainer}>
          {waveformBars.map((bar, idx) => {
            const isCenter = idx === 5;
            return isCenter ? (
              <LinearGradient
                key={idx}
                colors={[colors.secondary, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.waveformBar, { height: bar.h }]}
              />
            ) : (
              <View
                key={idx}
                style={[
                  styles.waveformBar,
                  {
                    height: bar.h,
                    opacity: bar.o,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            activeOpacity={0.7}
            onPress={handleMuteToggle}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={voiceState === 'speaking' ? handleStopSpeaking : undefined}
          >
            <Text style={styles.controlIcon}>
              {voiceState === 'speaking' ? '⏹' : '🔊'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    justifyContent: 'space-between',
  },
  ambientTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.4,
    height: 200,
    borderBottomRightRadius: 200,
    backgroundColor: 'rgba(175, 198, 255, 0.03)',
  },
  ambientBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: width * 0.4,
    height: 200,
    borderTopLeftRadius: 200,
    backgroundColor: 'rgba(208, 188, 255, 0.03)',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingTop: 48,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(45, 52, 73, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.onSurface,
    fontWeight: '600',
  },
  // Center
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  bgAura: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.tertiaryContainer,
  },
  orbContainer: {
    position: 'relative',
  },
  orbGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 160,
    backgroundColor: colors.primary,
  },
  orb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#a694d0',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#afc6ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  orbShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(175, 198, 255, 0.15)',
    borderRadius: 110,
  },
  orbHighlight: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  orbRecordingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbRecordingText: {
    fontSize: 32,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  orbProcessingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbProcessingText: {
    fontSize: 48,
  },
  transcriptContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 4,
  },
  transcriptLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
    opacity: 0.6,
  },
  transcriptText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  textOverlay: {
    alignItems: 'center',
    gap: 6,
  },
  listeningText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  secureText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 3,
    color: colors.primary,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 48,
    gap: 28,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    height: 60,
  },
  waveformBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(45, 52, 73, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
  },
  controlIcon: {
    fontSize: 22,
    color: colors.onSurface,
  },
  controlDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(73, 68, 86, 0.2)',
  },
});
