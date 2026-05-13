import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db = null;

const getDB = async () => {
  if (db) return db;
  db = await SQLite.openDatabase({
    name: 'convexa.db',
    location: 'default',
  });
  return db;
};

// ─── Schema Setup ───────────────────────────────────────────
export const initDB = async () => {
  try {
    const database = await getDB();

    // Migration: ensure users table exists for existing installations
    await database.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        password TEXT,
        created_at TEXT
      )`
    );

    // Migration: add settings columns
    try {
      await database.executeSql("ALTER TABLE users ADD COLUMN voice TEXT DEFAULT 'Aura'");
      await database.executeSql("ALTER TABLE users ADD COLUMN speech_speed REAL DEFAULT 1.0");
      await database.executeSql("ALTER TABLE users ADD COLUMN is_dark INTEGER DEFAULT 1");
    } catch (e) {
      // Columns likely already exist, ignore error
    }

    // Conversations table
    await database.executeSql(
      `CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        created_at TEXT,
        updated_at TEXT
      )`
    );

    // Messages table with conversation_id
    await database.executeSql(
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        text TEXT,
        sender TEXT,
        timestamp TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )`
    );
    
    // Reminders table
    await database.executeSql(
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        remind_at TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT
      )`
    );

    console.log('DB initialized');
  } catch (error) {
    console.error('DB init error:', error);
    throw error;
  }
};

// ─── Conversations ──────────────────────────────────────────
export const createConversation = async (title = 'New Chat') => {
  try {
    const database = await getDB();
    const now = new Date().toISOString();
    const [result] = await database.executeSql(
      'INSERT INTO conversations (title, created_at, updated_at) VALUES (?, ?, ?)',
      [title, now, now]
    );
    console.log('Conversation created:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('Create conversation error:', error);
    throw error;
  }
};

export const getAllConversations = async () => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      'SELECT * FROM conversations ORDER BY updated_at DESC'
    );
    const conversations = [];
    for (let i = 0; i < results.rows.length; i++) {
      conversations.push(results.rows.item(i));
    }
    return conversations;
  } catch (error) {
    console.error('Get conversations error:', error);
    return [];
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const database = await getDB();
    await database.executeSql(
      'DELETE FROM messages WHERE conversation_id = ?',
      [conversationId]
    );
    await database.executeSql(
      'DELETE FROM conversations WHERE id = ?',
      [conversationId]
    );
    console.log('Conversation deleted:', conversationId);
  } catch (error) {
    console.error('Delete conversation error:', error);
    throw error;
  }
};

export const updateConversationTitle = async (conversationId, title) => {
  try {
    const database = await getDB();
    const now = new Date().toISOString();
    await database.executeSql(
      'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?',
      [title, now, conversationId]
    );
  } catch (error) {
    console.error('Update conversation title error:', error);
  }
};

// ─── Messages ───────────────────────────────────────────────
export const insertMessage = async (conversationId, text, sender) => {
  try {
    const database = await getDB();
    const timestamp = new Date().toISOString();
    await database.executeSql(
      'INSERT INTO messages (conversation_id, text, sender, timestamp) VALUES (?, ?, ?, ?)',
      [conversationId, text, sender, timestamp]
    );
    // Update conversation's updated_at
    await database.executeSql(
      'UPDATE conversations SET updated_at = ? WHERE id = ?',
      [timestamp, conversationId]
    );
    console.log('Message inserted:', { conversationId, sender });
  } catch (error) {
    console.error('Insert message error:', error);
    throw error;
  }
};

export const getMessagesByConversation = async (conversationId) => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC',
      [conversationId]
    );
    const messages = [];
    for (let i = 0; i < results.rows.length; i++) {
      messages.push(results.rows.item(i));
    }
    return messages;
  } catch (error) {
    console.error('Get messages error:', error);
    return [];
  }
};

// Get last N messages from a conversation (for AI context)
export const getRecentMessages = async (conversationId, limit = 6) => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      'SELECT * FROM (SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?) ORDER BY id ASC',
      [conversationId, limit]
    );
    const messages = [];
    for (let i = 0; i < results.rows.length; i++) {
      messages.push(results.rows.item(i));
    }
    return messages;
  } catch (error) {
    console.error('Get recent messages error:', error);
    return [];
  }
};

// Get message count for a conversation
export const getMessageCount = async (conversationId) => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
      [conversationId]
    );
    return results.rows.item(0).count;
  } catch (error) {
    return 0;
  }
};

// Legacy: get all messages (flat)
export const getAllMessages = async () => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      'SELECT * FROM messages ORDER BY id ASC'
    );
    const messages = [];
    for (let i = 0; i < results.rows.length; i++) {
      messages.push(results.rows.item(i));
    }
    return messages;
  } catch (error) {
    console.error('Get all messages error:', error);
    return [];
  }
};

// Get the previous user message (second-to-last) for improvement tracking
export const getLastUserMessage = async (conversationId) => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      `SELECT * FROM messages WHERE conversation_id = ? AND sender = 'user' ORDER BY id DESC LIMIT 1 OFFSET 1`,
      [conversationId]
    );
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  } catch (error) {
    console.error('Get last user message error:', error);
    return null;
  }
};

// ─── User Auth ──────────────────────────────────────────────
export const createUser = async (name, email = null, password = null) => {
  try {
    const database = await getDB();
    const now = new Date().toISOString();
    // Provide non-null fallbacks to satisfy NOT NULL constraints in old schemas
    const safeEmail = email ? email.toLowerCase().trim() : `local_${Date.now()}@convexa.ai`;
    const safePassword = password || 'local';

    const [result] = await database.executeSql(
      'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
      [name, safeEmail, safePassword, now]
    );
    return { id: result.insertId, name, email: safeEmail };
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
};

export const getFirstUser = async () => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      'SELECT * FROM users LIMIT 1'
    );
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  } catch (error) {
    console.error('Get first user error:', error);
    return null;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const updateUserSettings = async (userId, { voice, speechSpeed, isDark }) => {
  try {
    const database = await getDB();
    const isDarkInt = isDark ? 1 : 0;
    
    // Only update fields that are provided
    const updates = [];
    const values = [];
    
    if (voice !== undefined) {
      updates.push('voice = ?');
      values.push(voice);
    }
    if (speechSpeed !== undefined) {
      updates.push('speech_speed = ?');
      values.push(speechSpeed);
    }
    if (isDark !== undefined) {
      updates.push('is_dark = ?');
      values.push(isDarkInt);
    }
    
    if (updates.length === 0) return true;
    
    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await database.executeSql(query, values);
    return true;
  } catch (error) {
    console.error('Update user settings error:', error);
    return false;
  }
};

export const clearAllData = async () => {
  try {
    const database = await getDB();
    await database.executeSql('DELETE FROM messages');
    await database.executeSql('DELETE FROM conversations');
    await database.executeSql('DELETE FROM reminders');
    console.log('All data cleared');
    return true;
  } catch (error) {
    console.error('Clear data error:', error);
    return false;
  }
};

// ─── Reminders ──────────────────────────────────────────────
export const createReminder = async (content, remindAt) => {
  try {
    const database = await getDB();
    const now = new Date().toISOString();
    const [result] = await database.executeSql(
      'INSERT INTO reminders (content, remind_at, status, created_at) VALUES (?, ?, ?, ?)',
      [content, remindAt, 'pending', now]
    );
    console.log('Reminder created:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('Create reminder error:', error);
    throw error;
  }
};

export const getPendingReminders = async () => {
  try {
    const database = await getDB();
    const [results] = await database.executeSql(
      "SELECT * FROM reminders WHERE status = 'pending' ORDER BY remind_at ASC"
    );
    const reminders = [];
    for (let i = 0; i < results.rows.length; i++) {
      reminders.push(results.rows.item(i));
    }
    return reminders;
  } catch (error) {
    console.error('Get reminders error:', error);
    return [];
  }
};

export const markReminderDone = async (id) => {
  try {
    const database = await getDB();
    await database.executeSql(
      "UPDATE reminders SET status = 'completed' WHERE id = ?",
      [id]
    );
    console.log('Reminder marked done:', id);
    return true;
  } catch (error) {
    console.error('Update reminder error:', error);
    return false;
  }
};
