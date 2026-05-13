import { createReminder } from '../../database/db';
import NotificationService from './NotificationService';
import { generateResponse } from '../../services/aiModels';

class ReminderService {
  /**
   * Main entry point to check if a message should trigger a reminder
   * @param userMessage The text the user just sent
   * @param aiResponse The AI's response (may contain acknowledgement)
   */
  async processPotentialReminder(userMessage: string, aiResponse: string) {
    // 1. Quick check: does the message contain keywords?
    const keywords = ['remind', 'memorize', 'remember', 'reminder', 'forget', 'task', 'tomorrow', 'date', 'at', 'on'];
    const hasKeyword = keywords.some(k => userMessage.toLowerCase().includes(k));
    
    if (!hasKeyword) return null;

    console.log('[ReminderService] Potential reminder detected in message:', userMessage);

    // 2. Use LLM to extract JSON data
    const extractionPrompt = `
      Extract a reminder from this conversation:
      User: "${userMessage}"
      AI: "${aiResponse}"
      Current Time: ${new Date().toLocaleString()}

      If the user wants a reminder, return { "isReminder": true, "content": "subject", "remindAt": "ISO_TIMESTAMP" }.
      Otherwise return { "isReminder": false }.
      Output JSON only. No other text.
    `;

    try {
      const result = await generateResponse(extractionPrompt);
      console.log('[ReminderService] Extraction result:', result);
      
      // Clean result (remove backticks or extra text if any)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.isReminder && data.content && data.remindAt) {
          const remindDate = new Date(data.remindAt);
          
          // Verify date is in the future
          if (remindDate.getTime() > Date.now()) {
            // 3. Save to DB
            const dbId = await createReminder(data.content, data.remindAt);
            
            // 4. Schedule Notification
            await NotificationService.scheduleNotification(
              'Convexa Reminder',
              data.content,
              remindDate,
              `reminder_${dbId}`
            );
            
            return { dbId, ...data };
          } else {
            console.warn('[ReminderService] Extracted date is in the past:', data.remindAt);
          }
        }
      }
    } catch (err) {
      console.error('[ReminderService] Error processing reminder:', err);
    }
    
    return null;
  }
}

export default new ReminderService();
