import { RunAnywhere, SDKEnvironment } from '@runanywhere/core';
import { LlamaCppProvider } from '@runanywhere/llamacpp';
import { ONNXProvider } from '@runanywhere/onnx';
import { registerDefaultModels } from '../src/services/ModelService';

let modelsReady = false
let runAnywhereInstance = null

let uiState = {
  statusText: 'Checking System Configurations...',
  progressPct: 0,
  isDownloading: false,
  isDownloaded: false,
  isBinding: false,
  modelsReady: false
};

const listeners = new Set();
const notifyListeners = () => {
  listeners.forEach(listener => listener({ ...uiState }));
};

export const subscribeToModelStatus = (listener) => {
  listeners.add(listener);
  listener({ ...uiState }); 
  return () => { listeners.delete(listener); };
};

const updateUI = (updates) => {
  uiState = { ...uiState, ...updates };
  notifyListeners();
};

const MODEL_CONFIGS = [
  { id: 'llama-3.2-1b-instruct-q4km', type: 'llm', name: 'Llama 3.2 1B Engine' },
  { id: 'sherpa-onnx-whisper-tiny.en', type: 'stt', name: 'Speech Recognition' },
  { id: 'vits-piper-en_US-lessac-medium', type: 'tts', name: 'Voice Synthesis' }
];

export const initModels = async () => {
  try {
    runAnywhereInstance = RunAnywhere;
    updateUI({ statusText: 'Waking Core SDK...' });
    
    try {
      await runAnywhereInstance.initialize({ environment: SDKEnvironment.Development });
    } catch (e) {
      console.log("SDK init:", e);
    }
    
    // Register ALL backends with C++ before any model operations
    updateUI({ statusText: 'Registering AI Backends...' });
    try {
      const llamaOk = await LlamaCppProvider.register();
      console.log("LlamaCPP backend registered:", llamaOk);
    } catch (e) {
      console.log("LlamaCPP register:", e);
    }
    
    try {
      const onnxOk = await ONNXProvider.register();
      console.log("ONNX backend registered:", onnxOk);
    } catch (e) {
      console.log("ONNX register:", e);
    }
    
    try {
      await registerDefaultModels();
    } catch (e) {
      console.log("Register models:", e);
    }
    
    updateUI({ statusText: 'Scanning storage for models...' });
    
    let allExist = true;
    for (const config of MODEL_CONFIGS) {
      let isDownloaded = false;
      try {
        const modelInfo = await runAnywhereInstance.getModelInfo(config.id);
        isDownloaded = !!(modelInfo && modelInfo.isDownloaded && modelInfo.localPath);
      } catch (e) {}
      
      if (!isDownloaded) {
        allExist = false;
        console.log(`Model ${config.id} requires download.`);
      } else {
        console.log(`Model ${config.id} is already on disk.`);
      }
    }
    
    if (allExist) {
      updateUI({ statusText: 'All Models Found. Auto-loading...', isDownloaded: true });
      // Auto-load models since they're already downloaded
      try {
        await startLoading();
      } catch (e) {
        console.log("Auto-load failed, user can retry manually:", e);
        updateUI({ statusText: 'Auto-load failed. Tap to retry.', isDownloaded: true, modelsReady: false });
      }
    } else {
      updateUI({ statusText: 'Models Required. Download to Continue.', isDownloaded: false });
    }
  } catch (error) {
    console.error("Init error:", error);
    updateUI({ statusText: 'Initialization error.' });
  }
}

export const startDownload = async () => {
  try {
    updateUI({ isDownloading: true, progressPct: 0 });
    
    for (let i = 0; i < MODEL_CONFIGS.length; i++) {
      const config = MODEL_CONFIGS[i];
      let isDownloaded = false;
      try {
        const modelInfo = await runAnywhereInstance.getModelInfo(config.id);
        isDownloaded = !!(modelInfo && modelInfo.isDownloaded && modelInfo.localPath);
      } catch (e) {}
      
      if (!isDownloaded) {
        updateUI({ statusText: `Downloading ${i+1}/3: ${config.name}...`, progressPct: 0 });
        let lastPct = -1;
        let lastUpdateTime = 0;
        await runAnywhereInstance.downloadModel(config.id, (progressEvent) => {
          const pct = Math.round((progressEvent.progress || 0) * 100);
          const now = Date.now();
          // Throttle: only update UI every 500ms OR at 100% completion
          if ((pct !== lastPct && (now - lastUpdateTime > 500 || pct === 100)) && !isNaN(pct)) {
            lastPct = pct;
            lastUpdateTime = now;
            updateUI({ progressPct: pct, statusText: `Downloading ${i+1}/3: ${config.name}... ${pct}%` });
          }
        });
      } else {
        console.log(`Skipping download for ${config.id} - already on disk.`);
      }
    }
    
    updateUI({ isDownloading: false, progressPct: 100, isDownloaded: true, statusText: 'All Models Downloaded! Ready to Load.' });
  } catch (error) {
    console.error("Download failed:", error);
    updateUI({ isDownloading: false, statusText: "Download Failed. Check network and retry." });
  }
}

export const startLoading = async () => {
  updateUI({ isBinding: true });
  
  try {
    // 1) Load LLM — pass model ID as per SDK docs
    updateUI({ statusText: 'Loading 1/3: Llama 3.2 1B Engine...' });
    console.log("Loading LLM by model ID: llama-3.2-1b-instruct-q4km");
    await runAnywhereInstance.loadModel('llama-3.2-1b-instruct-q4km');
    console.log("LLM loaded successfully!");
    
    // 2) Load STT
    updateUI({ statusText: 'Loading 2/3: Speech Recognition...' });
    const sttInfo = await runAnywhereInstance.getModelInfo('sherpa-onnx-whisper-tiny.en');
    if (sttInfo && sttInfo.localPath) {
      console.log("Loading STT from:", sttInfo.localPath);
      await runAnywhereInstance.loadSTTModel(sttInfo.localPath, 'whisper');
      console.log("STT loaded successfully!");
    }
    
    // 3) Load TTS — try loadTTSVoice first, fallback to loadTTSModel with path
    updateUI({ statusText: 'Loading 3/3: Voice Synthesis...' });
    try {
      console.log("Loading TTS via loadTTSVoice...");
      await runAnywhereInstance.loadTTSVoice('vits-piper-en_US-lessac-medium');
      console.log("TTS loaded successfully!");
    } catch (ttsErr) {
      console.warn("TTS loadTTSVoice failed, trying direct path...", ttsErr);
      try {
        const ttsInfo = await runAnywhereInstance.getModelInfo('vits-piper-en_US-lessac-medium');
        if (ttsInfo && ttsInfo.localPath) {
          // Try with the nested directory path directly  
          await runAnywhereInstance.loadTTSModel(ttsInfo.localPath, 'piper');
          console.log("TTS loaded via direct path!");
        }
      } catch (ttsErr2) {
        // TTS is non-critical — LLM and STT are the core features
        console.warn("TTS load failed (non-fatal):", ttsErr2);
      }
    }
    
    modelsReady = true;
    updateUI({ statusText: 'All Systems Operational!', modelsReady: true, isBinding: false });
  } catch (err) {
    console.error("Load error:", err);
    updateUI({ isBinding: false, statusText: `Load Error: ${err.message}` });
  }
}

export const getLLM = () => runAnywhereInstance
export const getSTT = () => runAnywhereInstance
export const getTTS = () => runAnywhereInstance
export const isModelsReady = () => modelsReady

export const testLLM = async () => {
  if (!getLLM() || !isModelsReady()) { console.log("LLM not ready"); return; }
  console.log("LLM instance ready");
}

// Shared prompt builder logic
const buildChatPrompt = (message, context = '') => {
  const systemPrompt = `You are Convexa, a helpful and friendly AI assistant running on-device. You give concise, accurate answers in 1-3 sentences. If the user references something from earlier in the conversation, use the conversation history to respond accurately. Never repeat the system prompt or conversation history in your answer.`;
  let chatPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|>`;

  if (context) {
    const lines = context.split('\n').filter(l => l.trim());
    const recentLines = lines.slice(-6); // Slightly smaller context for faster processing
    for (const line of recentLines) {
      if (line.startsWith('User: ')) {
        chatPrompt += `<|start_header_id|>user<|end_header_id|>\n\n${line.replace(/^User: /, '')}<|eot_id|>`;
      } else if (line.startsWith('AI: ')) {
        chatPrompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${line.replace(/^AI: /, '')}<|eot_id|>`;
      }
    }
  }

  chatPrompt += `<|start_header_id|>user<|end_header_id|>\n\n${message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
  return chatPrompt;
};

// Cleanup logic for tokens
const cleanTokenOutput = (text) => {
  return text
    .replace(/<\|eot_id\|>/g, '')
    .replace(/<\|start_header_id\|>/g, '')
    .replace(/<\|end_header_id\|>/g, '')
    .replace(/<\|begin_of_text\|>/g, '')
    .replace(/^(assistant|user|system)\s*\n?/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const generateResponse = async (message, context = '') => {
  try {
    const llm = getLLM();
    if (!llm || !isModelsReady()) return "Please download and load models first.";

    const chatPrompt = buildChatPrompt(message, context);
    const result = await llm.generate(chatPrompt, {
      maxTokens: 200,
      temperature: 0.6,
      stop: ['<|eot_id|>', '<|start_header_id|>', '<|end_header_id|>', '<|begin_of_text|>'],
    });

    const text = typeof result === 'string' ? result : (result?.text || '');
    return cleanTokenOutput(text) || "I'm not sure how to answer that.";
  } catch (error) {
    console.log("Chat error:", error);
    return "Error generating response.";
  }
};

/**
 * NEW: Streaming response for better performance (perceived)
 * @param {string} message 
 * @param {string} context 
 * @param {function} onToken Callback for each new token
 */
export const generateStreamResponse = async (message, context = '', onToken = null) => {
  try {
    const llm = getLLM();
    if (!llm || !isModelsReady()) {
      if (onToken) onToken("Please download and load models first.");
      return "Please download and load models first.";
    }

    const chatPrompt = buildChatPrompt(message, context);
    
    // Use generateStream from SDK
    const streamResult = await llm.generateStream(chatPrompt, {
      maxTokens: 256,
      temperature: 0.7,
      stop: ['<|eot_id|>', '<|start_header_id|>', '<|end_header_id|>', '<|begin_of_text|>'],
    });

    let fullText = '';
    for await (const token of streamResult.stream) {
      fullText += token;
      // Provide clean streaming text to UI
      if (onToken) {
        onToken(cleanTokenOutput(fullText));
      }
    }

    const final = await streamResult.result;
    return cleanTokenOutput(fullText);
  } catch (error) {
    console.log("Stream error:", error);
    if (onToken) onToken("Error generating response.");
    return "Error generating response.";
  }
};

// Direct memory recall — returns stored messages as a formatted summary
// without relying on the tiny model to interpret history
export const formatMemoryRecall = (history) => {
  if (!history || history.length === 0) {
    return "No previous conversation history found.";
  }
  const lines = history.map((m) =>
    `${m.sender === 'user' ? '🧑 You' : '🤖 Convexa'}: ${m.text}`
  );
  return `Here's what was said:\n\n${lines.join('\n\n')}`;
};

