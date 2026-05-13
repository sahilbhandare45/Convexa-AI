import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  NativeModules,
  Platform,
  PermissionsAndroid,
  Animated,
  Clipboard,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RunAnywhere } from '@runanywhere/core';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { TopAppBar } from '../components/TopAppBar';
import { BottomNavBar, TabName } from '../components/BottomNavBar';
import { generateResponse, generateStreamResponse } from '../../services/aiModels';
import NotificationService from '../services/NotificationService';
import ReminderService from '../services/ReminderService';
import {
  initDB,
  insertMessage,
  getMessagesByConversation,
  getRecentMessages,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  getLastUserMessage,
} from '../../database/db';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  time: string;
  highlightedText?: string;
}

export const ConvexaChatScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(
    route?.params?.conversationId ?? null
  );
  const flatListRef = useRef<FlatList>(null);
  const [isPracticeMode] = useState(route?.params?.practiceMode ?? false);
  const [currentMode] = useState(route?.params?.mode || 'interview');

  // ── Stability refs ──
  const isMountedRef = useRef(true);
  const isSendingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

  const { colors } = useUser();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    if (isPracticeMode) {
      console.log('Practice mode activated');
      console.log('Mode selected:', currentMode);
    }
  }, [isPracticeMode, currentMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // Initialize notifications
  useEffect(() => {
    NotificationService.initialize();
  }, []);

  // ── Voice input state ──
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const { NativeAudioModule } = NativeModules;
  const hasTriggeredInitial = useRef(false);

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (NativeAudioModule) NativeAudioModule.cancelRecording().catch(() => {});
    };
  }, []);

  // ── Voice handlers ──
  const handleMicPress = async () => {
    if (isTranscribing || isLoading) return;
    if (isRecording) {
      await stopAndTranscribe();
    } else {
      await startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!NativeAudioModule) {
        Alert.alert('Error', 'Native audio module not available. Please rebuild the app.');
        return;
      }

      // Request mic permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Convexa needs microphone access for voice input.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Microphone permission is required for voice input.');
          return;
        }
      }

      await NativeAudioModule.startRecording();
      console.log('[Demo] Flow: Started microphone recording...');
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (error) {
      console.log('[Voice] Start recording error:', error);
      Alert.alert('Recording Error', 'Failed to start recording.');
    }
  };

  const stopAndTranscribe = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);
      setIsTranscribing(true);
      console.log('[Demo] Flow: Stopped recording, analyzing audio...');

      const result = await NativeAudioModule.stopRecording();
      const audioBase64 = result.audioBase64;

      if (!audioBase64 || result.fileSize < 1000) {
        setIsTranscribing(false);
        Alert.alert('Too Short', 'Recording was too short. Please speak longer.');
        return;
      }

      // Check STT model
      const isModelLoaded = await RunAnywhere.isSTTModelLoaded();
      if (!isModelLoaded) {
        setIsTranscribing(false);
        Alert.alert('Model Not Loaded', 'Speech recognition model not loaded. Please load it from the home screen.');
        return;
      }

      // Transcribe
      const transcribeResult = await RunAnywhere.transcribe(audioBase64, {
        sampleRate: 16000,
        language: 'en',
      });

      setIsTranscribing(false);

      if (transcribeResult.text && transcribeResult.text.trim()) {
        const finalStt = transcribeResult.text.trim();
        console.log('[Demo] Event: Audio transcribed to text ->', finalStt);
        // Auto send the STT result
        handleSend(finalStt);
      } else {
        Alert.alert('No Speech Detected', 'Could not detect any speech. Please try again.');
      }
    } catch (error) {
      console.log('[Voice] Transcribe error:', error);
      setIsRecording(false);
      setIsTranscribing(false);
      Alert.alert('Transcription Error', 'Failed to transcribe audio.');
    }
  };

  // Safe text extraction helper
  const safeText = (raw: any, fallback = 'No response'): string => {
    if (typeof raw === 'string') return raw.trim() || fallback;
    return String(raw ?? fallback).trim() || fallback;
  };

  // Load or create conversation on mount
  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      try {
        await initDB();
        let loadedCount = 0;
        if (conversationId) {
          // Load existing conversation
          const saved = await getMessagesByConversation(conversationId);
          loadedCount = saved?.length ?? 0;
          if (loadedCount > 0 && !cancelled) {
            const mapped: Message[] = saved.map((row: any) => ({
              id: String(row.id),
              type: row.sender === 'user' ? 'user' : 'ai',
              text: row.text ?? '',
              time:
                row.sender === 'user'
                  ? new Date(row.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '',
            }));
            setMessages(mapped);
            console.log('Messages loaded from DB:', loadedCount);
          }
        }
        // If in practice mode and it's a new chat, trigger first question
        if (!cancelled && isPracticeMode && loadedCount === 0 && !hasTriggeredInitial.current) {
          hasTriggeredInitial.current = true;
          console.log('Practice question triggered');
          triggerInitialInterviewQuestion();
        }
      } catch (e) {
        console.log('Failed to load messages:', e);
      }
    };
    setup();
    return () => { cancelled = true; };
  }, [conversationId]);

  const getInitialPrompt = (mode: string): string => {
    switch (mode) {
      case 'public_speaking':
        return 'You are a public speaking coach. Give a topic and ask the user to speak.';
      case 'daily_chat':
        return 'You are a friendly conversational partner. Start a natural conversation.';
      case 'interview':
      default:
        return 'You are a professional interviewer. Ask the first interview question.';
    }
  };

  const getConversationTitle = (mode: string): string => {
    switch (mode) {
      case 'public_speaking':
        return 'Practice: Public Speaking';
      case 'daily_chat':
        return 'Practice: Daily Chat';
      case 'interview':
      default:
        return 'Practice: Interview';
    }
  };

  const triggerInitialInterviewQuestion = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const convoId = await ensureConversation(getConversationTitle(currentMode));
      const prompt = getInitialPrompt(currentMode);
      console.log('Initial prompt for mode:', currentMode);
      const aiResponseText = safeText(await generateResponse(prompt, ''));

      if (!isMountedRef.current) return;

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        text: aiResponseText,
        time: '',
      };

      await insertMessage(convoId, aiResponseText, 'ai');
      if (isMountedRef.current) setMessages([aiMessage]);
    } catch (e) {
      console.log('Initial practice error:', e);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const ensureConversation = async (firstMessage: string): Promise<number> => {
    if (conversationId) return conversationId;
    // Create new conversation with first message as title
    const title = firstMessage.length > 40 ? firstMessage.substring(0, 40) + '...' : firstMessage;
    const newId = await createConversation(title);
    setConversationId(newId);
    return newId;
  };

  const handleSend = async (overrideText?: any) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : "";
    const finalInputText = textToSend || inputText;
    if (!finalInputText.trim() || isLoading) return;
    // Prevent duplicate sends from double-tap
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: finalInputText.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      // Ensure we have a conversation
      const convoId = await ensureConversation(userMessage.text);

      // Fetch context BEFORE inserting current message (avoid duplication)
      let context = '';
      try {
        const recent = await getRecentMessages(convoId, 8);
        if (recent && recent.length > 0) {
          context = recent
            .map((m: any) =>
              `${m.sender === 'user' ? 'User' : 'AI'}: ${(m.text ?? '').substring(0, 500)}`
            )
            .join('\n');
        }
      } catch (e) {
        console.log('Context fetch error:', e);
      }

      // Persist user message to SQLite (after fetching context)
      await insertMessage(convoId, userMessage.text, 'user');

      if (!isMountedRef.current) return;

      // 1) FOR PRACTICE MODE: Generate Feedback first
      if (isPracticeMode) {
        console.log('Generating feedback for mode:', currentMode);
        let feedbackPrompt: string;
        switch (currentMode) {
          case 'public_speaking':
            feedbackPrompt = `Analyze this speech: "${userMessage.text}"\n\nGive feedback on:\n1. Confidence\n2. Delivery\n3. Clarity\n4. Engagement\n\nKeep it short and actionable.`;
            break;
          case 'daily_chat':
            feedbackPrompt = `User said: "${userMessage.text}"\n\nGive light conversational feedback if needed. Keep it brief and natural.`;
            break;
          case 'interview':
          default:
            feedbackPrompt = `Analyze this answer: "${userMessage.text}"\n\nGive feedback on:\n1. Confidence\n2. Clarity\n3. Structure\n\nKeep it short and actionable.`;
            break;
        }
        
        const feedbackText = safeText(await generateResponse(feedbackPrompt, context), 'No feedback');

        if (isMountedRef.current) {
          const feedbackMsg: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            text: `📝 FEEDBACK:\n${feedbackText}`,
            time: '',
          };

          await insertMessage(convoId, `FEEDBACK: ${feedbackText}`, 'ai');
          setMessages((prev) => [...prev, feedbackMsg]);
          console.log('Feedback added');
        }

        // 1b) Improvement tracking: compare with previous user answer
        try {
          const previousUserMsg = await getLastUserMessage(convoId);
          if (previousUserMsg?.text && isMountedRef.current) {
            console.log('Improvement analysis triggered');
            const improvementPrompt = `Compare these two answers:\nPrevious: "${previousUserMsg.text.substring(0, 500)}"\nCurrent: "${userMessage.text.substring(0, 500)}"\n\nTell if the user improved, and how.`;
            const improvementText = safeText(await generateResponse(improvementPrompt, context), 'No analysis');

            if (isMountedRef.current) {
              const improvementMsg: Message = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                text: `📈 IMPROVEMENT:\n${improvementText}`,
                time: '',
              };

              await insertMessage(convoId, `IMPROVEMENT: ${improvementText}`, 'ai');
              setMessages((prev) => [...prev, improvementMsg]);
              console.log('Improvement analysis added');
            }
          }
        } catch (impErr) {
          console.log('Improvement analysis error:', impErr);
        }
      }

      if (!isMountedRef.current) return;

      // 2) Generate next AI response (mode-aware follow-up) WITH STREAMING
      let promptText = userMessage.text;
      if (isPracticeMode) {
        switch (currentMode) {
          case 'public_speaking':
            promptText = `User's speech: "${userMessage.text}"\n\nGive feedback on this speech and suggest improvement.`;
            break;
          case 'daily_chat':
            promptText = `User said: "${userMessage.text}"\n\nContinue the conversation naturally.`;
            break;
          case 'interview':
          default:
            promptText = `User's answer: "${userMessage.text}"\n\nBased on the user's answer, ask the next relevant interview question.`;
            break;
        }
      }

      // Initialize streaming message ID
      const streamingId = (Date.now() + 50).toString();
      let hasStartedStreaming = false;

      const aiResponseText = await generateStreamResponse(promptText, context, (text: string) => {
        if (isMountedRef.current) {
          // Hide loading dots as soon as we start getting real text
          if (!hasStartedStreaming && text.trim().length > 0) {
            hasStartedStreaming = true;
            setIsLoading(false);
          }

          if (hasStartedStreaming) {
            setStreamingMessage({
              id: streamingId,
              type: 'ai',
              text: text,
              time: '',
            });
            // Scroll to bottom during streaming
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }
      });

      if (!isMountedRef.current) return;

      const aiMessage: Message = {
        id: streamingId,
        type: 'ai',
        text: aiResponseText,
        time: '',
      };

      // Persist AI message to SQLite
      await insertMessage(convoId, aiResponseText, 'ai');

      if (isMountedRef.current) {
        setMessages((prev) => [...prev, aiMessage]);
        setStreamingMessage(null);
        // Auto play the AI response
        handlePlayVoice(aiResponseText);
        
        // --- REMINDER INTEGRATION ---
        // Process potential reminders in the background
        ReminderService.processPotentialReminder(finalInputText, aiResponseText).then(reminder => {
          if (reminder && isMountedRef.current) {
            console.log('[Reminder] Scheduled successfully:', reminder.content);
            const dateStr = new Date(reminder.remindAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            setReminderFeedback(`Reminder set: "${reminder.content}" for ${dateStr}`);
            setTimeout(() => {
              if (isMountedRef.current) setReminderFeedback(null);
            }, 5000);
          }
        });
      }
    } catch (e) {
      console.log('Send error:', e);
      if (isMountedRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            text: 'Something went wrong. Please try again.',
            time: '',
          },
        ]);
      }
    } finally {
      isSendingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
        scrollTimerRef.current = setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      }
    }
  };

  const handleDeleteChat = () => {
    if (!conversationId) return;
    Alert.alert('Delete Chat', 'Delete this entire conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(conversationId);
            navigation.goBack();
          } catch (e) {
            console.log('Delete failed:', e);
          }
        },
      },
    ]);
  };

  const handleTabPress = (tab: TabName) => {
    const screenMap: Record<TabName, string> = {
      Home: 'HomeDashboard',
      Chat: 'ChatHistory',
      Memory: 'MemoryTimeline',
      Practice: 'PracticeCenter',
      Profile: 'AppSettings',
    };
    if (tab !== 'Chat') {
      navigation.navigate(screenMap[tab]);
    }
  };

  // ── TTS: Play AI message as voice ──
  const handlePlayVoice = async (text: string) => {
    if (isSpeaking) {
      // Stop current playback
      try {
        if (NativeAudioModule) await NativeAudioModule.stopPlayback();
      } catch (e) {}
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      console.log('[TTS] Playing voice for message');

      const isTTSLoaded = await RunAnywhere.isTTSModelLoaded();
      if (!isTTSLoaded) {
        Alert.alert('TTS Not Loaded', 'Please load the voice model from the home screen.');
        setIsSpeaking(false);
        return;
      }

      // Clean text for TTS (remove emoji prefixes)
      const cleanText = text
        .replace(/^[📝📈🔊🎤⏳📋✕⏹🔇]+\s*(FEEDBACK|IMPROVEMENT):\s*/i, '')
        .trim();

      const ttsResult = await RunAnywhere.synthesize(cleanText);

      if (ttsResult?.audio && NativeAudioModule && isMountedRef.current) {
        // Enforce 22050Hz for Piper medium quality to fix 'blur' audio issues
        const sampleRate = 22050;
        await NativeAudioModule.playAudioBase64(
          ttsResult.audio,
          sampleRate
        );
        console.log('[TTS] Playback started');
        // Wait for approximate playback duration
        const wordCount = cleanText.split(/\s+/).length;
        const estimatedMs = Math.max(2000, wordCount * 350);
        await new Promise((resolve) => setTimeout(resolve, estimatedMs));
      }
    } catch (error) {
      console.log('[TTS] Play voice error:', error);
    } finally {
      if (isMountedRef.current) setIsSpeaking(false);
    }
  };

  // ── Copy message to clipboard ──
  const handleCopyMessage = (text: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert('Copied', 'Message copied to clipboard.');
      console.log('[Copy] Message copied');
    } catch (e) {
      console.log('[Copy] Error:', e);
    }
  };

  const renderMessage = (msg: Message) => {
    if (msg.type === 'user') {
      return (
        <View key={msg.id} style={styles.userMessageContainer}>
          <View style={styles.userMessageCol}>
            <Text style={styles.messageTime}>{msg.time}</Text>
            <View style={styles.userBubble}>
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          </View>
        </View>
      );
    }

    // AI Message
    return (
      <View key={msg.id} style={styles.aiMessageContainer}>
        <View style={styles.aiAura} />
        <View style={styles.aiMessageCol}>
          <Text style={styles.aiLabel}>CONVEXA AI</Text>
          <View style={styles.aiBubble}>
            <Text style={styles.messageText}>{msg.text}</Text>
            <View style={styles.aiActions}>
              <TouchableOpacity
                style={styles.playVoiceBtn}
                onPress={() => handlePlayVoice(msg.text)}
              >
                <Text style={styles.playVoiceIcon}>{isSpeaking ? '⏹' : '🔊'}</Text>
                <Text style={styles.playVoiceText}>
                  {isSpeaking ? 'Stop' : 'Play voice'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopyMessage(msg.text)}
              >
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {reminderFeedback && (
          <Animated.View style={styles.reminderToast}>
            <Text style={styles.reminderToastText}>⏰ {reminderFeedback}</Text>
          </Animated.View>
        )}
        <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Chat with Convexa</Text>
        {conversationId ? (
          <TouchableOpacity onPress={handleDeleteChat} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={streamingMessage ? [...messages, streamingMessage] : messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderMessage(item)}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEmoji}>🤖</Text>
            <Text style={styles.welcomeText}>
              Start a conversation with Convexa AI
            </Text>
            <Text style={styles.welcomeHint}>
              Ask anything — I'll remember our chat!
            </Text>
          </View>
        }
        ListFooterComponent={
          <>
            {isLoading && !streamingMessage && (
              <View style={styles.thinkingContainer}>
                <View style={styles.thinkingBubble}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                  <View style={[styles.dot, { backgroundColor: colors.tertiary }]} />
                </View>
              </View>
            )}
            <View style={{ height: 20 }} />
          </>
        }
      />

      {/* Recording indicator */}
      {(isRecording || isTranscribing) && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingIndicatorInner}>
            {isRecording ? (
              <>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Listening... {recordingSeconds}s
                </Text>
                <Text style={styles.recordingHint}>Tap mic to stop</Text>
              </>
            ) : (
              <Text style={styles.recordingText}>Transcribing...</Text>
            )}
          </View>
        </View>
      )}

      {/* Floating Input */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            disabled={isLoading || isTranscribing}
            activeOpacity={0.7}
          >
            {isRecording ? (
              <Animated.View
                style={[
                  styles.micRecordingBg,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.micIcon}>⏹</Text>
              </Animated.View>
            ) : (
              <Text style={[styles.micIcon, isTranscribing && { opacity: 0.4 }]}>🎤</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={isTranscribing ? 'Transcribing...' : 'Message Convexa...'}
            placeholderTextColor="rgba(218, 226, 253, 0.4)"
            value={inputText}
            onChangeText={setInputText}
            editable={!isRecording && !isTranscribing}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={isLoading || isRecording || isTranscribing}
          >
            <LinearGradient
              colors={['#afc6ff', '#d0bcff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Text style={styles.sendIcon}>▶</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

        <BottomNavBar activeTab="Chat" onTabPress={handleTabPress} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reminderToast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(175, 198, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  reminderToastText: {
    color: '#001a43',
    fontWeight: '700',
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: colors.surfaceContainer,
  },
  backBtn: {
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
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 32,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
  },
  welcomeHint: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    opacity: 0.5,
    textAlign: 'center',
  },
  // User message
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  userMessageCol: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '85%',
  },
  messageTime: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.onSurfaceVariant,
    opacity: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  userBubble: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
  },
  // AI message
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  aiAura: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.tertiaryContainer,
    opacity: 0.08,
  },
  aiMessageCol: {
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '85%',
  },
  aiLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primaryFixedDim,
    paddingHorizontal: 8,
  },
  aiBubble: {
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  aiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  playVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  playVoiceIcon: {
    fontSize: 12,
  },
  playVoiceText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  copyBtn: {
    padding: 6,
  },
  copyIcon: {
    fontSize: 12,
  },
  // Thinking dots
  thinkingContainer: {
    alignItems: 'flex-start',
  },
  thinkingBubble: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Input
  inputWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 30,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.1)',
  },
  micButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micRecordingBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 18,
  },
  // Recording indicator
  recordingIndicator: {
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingIndicatorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  recordingHint: {
    fontSize: 11,
    color: 'rgba(252, 165, 165, 0.6)',
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.onSurface,
    paddingHorizontal: 4,
  },
  sendButton: {},
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sendIcon: {
    fontSize: 16,
    color: colors.onPrimary,
  },
});
