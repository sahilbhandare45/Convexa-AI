export type RootStackParamList = {
  Splash: undefined;
  ModelLoading: undefined;
  Auth: undefined;
  // Convexa screens
  HomeDashboard: undefined;
  ChatHistory: undefined;
  ConvexaChat: {
    conversationId?: number | null;
    practiceMode?: boolean;
    mode?: 'interview' | 'public_speaking' | 'daily_chat';
  };
  MemoryTimeline: undefined;
  PracticeCenter: undefined;
  AppSettings: undefined;
  ImmersiveVoiceMode: undefined;
};
