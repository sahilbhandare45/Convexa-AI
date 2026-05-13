import notifee, { 
  TimestampTrigger, 
  TriggerType, 
  AndroidImportance,
  AuthorizationStatus
} from '@notifee/react-native';

class NotificationService {
  private channelId: string = 'convexa-reminders';

  async initialize() {
    // 1. Request permissions (required for iOS and Android 13+)
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      console.log('User denied permissions');
      return false;
    }

    // 2. Create a channel (required for Android)
    await notifee.createChannel({
      id: this.channelId,
      name: 'Convexa Reminders',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
    });

    return true;
  }

  /**
   * Schedule a notification at a specific date
   * @param title Notification title
   * @param body Notification body
   * @param date Date object for when to trigger
   * @param id Optional unique ID for the notification
   */
  async scheduleNotification(title: string, body: string, date: Date, id?: string) {
    // Create a time-based trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    const notificationId = id || `reminder_${Date.now()}`;

    // Create a trigger notification
    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title,
        body,
        android: {
          channelId: this.channelId,
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.HIGH,
        },
      },
      trigger,
    );

    console.log(`[NotificationService] Scheduled notification "${title}" for ${date.toISOString()}`);
    return notificationId;
  }

  async cancelNotification(id: string) {
    await notifee.cancelNotification(id);
  }

  async cancelAll() {
    await notifee.cancelAllNotifications();
  }
}

export default new NotificationService();
