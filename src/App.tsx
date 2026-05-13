import 'react-native-gesture-handler'; // Must be at the top!
import React, { useEffect } from 'react';
import { initModels, testLLM } from '../services/aiModels';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider } from './context/UserContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Suppress known React 19 + react-navigation internal error (non-breaking)
LogBox.ignoreLogs([
  'Internal React error: Expected static flag was missing',
  'Expected static flag was missing',
]);
import {
  HomeDashboardScreen,
  ConvexaChatScreen,
  ChatHistoryScreen,
  MemoryTimelineScreen,
  PracticeCenterScreen,
  AppSettingsScreen,
  ImmersiveVoiceModeScreen,
  ModelLoadingScreen,
  AuthScreen,
  SplashScreen,
} from './screens';
import { RootStackParamList } from './navigation/types';

import { useUser } from './context/UserContext';

const Stack = createStackNavigator<RootStackParamList>();

const MainApp: React.FC = () => {
  const { colors, user } = useUser();
  const isDark = user?.settings?.isDark !== false;

  useEffect(() => {
    console.log('[Demo] App initialized, loading models...');
    initModels();
    testLLM();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            cardStyle: {
              backgroundColor: colors.background,
            },
            ...TransitionPresets.SlideFromRightIOS,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="ModelLoading" component={ModelLoadingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} />
          <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
          <Stack.Screen name="ConvexaChat" component={ConvexaChatScreen} />
          <Stack.Screen name="MemoryTimeline" component={MemoryTimelineScreen} />
          <Stack.Screen name="PracticeCenter" component={PracticeCenterScreen} />
          <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
          <Stack.Screen
            name="ImmersiveVoiceMode"
            component={ImmersiveVoiceModeScreen}
            options={{
              ...TransitionPresets.ModalSlideFromBottomIOS,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <MainApp />
      </UserProvider>
    </SafeAreaProvider>
  );
};

export default App;
