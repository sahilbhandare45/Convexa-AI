import React, { useState, useRef, useEffect } from 'react';
import { View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { initDB } from '../../database/db';


export const AuthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { onboard, colors } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    console.log('[Demo] Flow: Auth Screen initialized');
    initDB().catch(console.error);
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) {
      setError('Please enter a username or name');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onboard(name.trim());
      if (result.success) {
        console.log('[Demo] Flow: User onboarded successfully -> HomeDashboard');
        navigation.reset({ index: 0, routes: [{ name: 'HomeDashboard' }] });
      } else {
        console.log('[Demo] Event: Onboarding failed -', result.error);
        Alert.alert('Onboarding Failed', result.error || 'Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <Image 
                source={require('../assets/images/app_icon.png')} 
                style={styles.logoImage} 
                resizeMode="cover"
              />
              <Text style={styles.title}>Convexa AI</Text>
              <Text style={styles.subtitle}>Your private AI companion</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WHAT SHOULD WE CALL YOU?</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Enter your name or nickname"
                  placeholderTextColor="rgba(218, 226, 253, 0.4)"
                  value={name}
                  onChangeText={(t) => { setName(t); setError(null); }}
                  autoCapitalize="words"
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.submitText}>
                  {isSubmitting ? 'Please wait...' : 'Get Started'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>END-TO-END ENCRYPTED</Text>
              <Text style={styles.footerText}>YOUR DATA STAYS ON DEVICE</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ambientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 200,
    height: 200,
    borderBottomRightRadius: 200,
    backgroundColor: 'rgba(175, 198, 255, 0.04)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 200,
    height: 200,
    borderTopLeftRadius: 200,
    backgroundColor: 'rgba(208, 188, 255, 0.04)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  content: {
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.surfaceContainerLowest,
    fontWeight: '700',
  },
  // Form
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.primary,
    opacity: 0.8,
  },
  input: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 86, 0.15)',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surfaceContainerLowest,
    letterSpacing: 0.5,
  },
  // Footer
  footer: {
    alignItems: 'center',
    gap: 4,
    opacity: 0.3,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    color: colors.onSurface,
  },
});
