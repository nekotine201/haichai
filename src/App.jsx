import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
// --- FIREBASE CONFIG ---
// Firebase apiKey trong config client KHÔNG phải secret. AI provider key mới là secret, nên app chỉ lưu AI key trong localStorage của máy người dùng.
const firebaseConfig = {
  apiKey: "AIzaSyCYMWWDxzs6U0Q-N9Eqa-fM6fEP9DYiGwY",
  authDomain: "haichai-script-studio.firebaseapp.com",
  databaseURL: "https://haichai-script-studio-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "haichai-script-studio",
  storageBucket: "haichai-script-studio.firebasestorage.app",
  messagingSenderId: "409195333074",
  appId: "1:409195333074:web:05b167ddd5da157899b40b"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const ALLOWED_EMAIL_DOMAINS = ['haichai.vn', 'starspits.vn', 'starspirits.vn'];

const getEmailDomain = (email = '') =>
  email.toLowerCase().split('@').pop() || '';

const isAllowedCompanyEmail = (email = '') =>
  ALLOWED_EMAIL_DOMAINS.includes(getEmailDomain(email));

const getAppDataRef = () => doc(db, 'workspaces', 'haichai-script-studio');

// --- TYPES & INTERFACES (Conceptual) ---
// Script: { id, title, category, topic, angle, mainMessage, hookOptions, selectedHook, selectedHookReason, duration, scenes, ending, caption, textOnScreen, hashtags, notes, status, duplicateRiskScore, createdAt, updatedAt }
// Topic: { id, category, topicName, angle, hookType, suggestedHook, mainMessage, whyItCanWork, avoidRepeating, duplicateRiskScore, selected }

// --- ICONS (Inline SVGs for standalone compatibility) ---
const IconSparkles = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
const IconFileText = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
);
const IconBook = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);
const IconSettings = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconSearch = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const IconCheck = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconPrinter = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);
const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);
const IconPlus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const IconMenu = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// --- CONSTANTS & MOCK DATA ---
const DEFAULT_CONTENT_BIBLE = `[HAICHAI CONTENT BIBLE
Bộ quy chuẩn nội dung cho TikTok nhân hiệu & kênh thương hiệu
1. Vai trò của bộ tài liệu này...
(Vui lòng dán toàn bộ Content Bible thật vào đây khi sử dụng)]`;

const INITIAL_SCRIPTS = [
  {
    id: 's1',
    title: 'Cửa hàng đẹp chưa chắc bán tốt',
    category: 'Sai lầm / bài học người chủ',
    topic: 'Mặt bằng',
    angle: 'Quan điểm ngược về chọn mặt bằng',
    mainMessage: 'Vị trí phù hợp quy trình quan trọng hơn vẻ hào nhoáng.',
    hookOptions: [
      'Cửa hàng đẹp chưa chắc đã bán tốt.',
      'Tôi từng vứt đi 200 triệu tiền cọc mặt bằng chỉ vì thấy nó quá đẹp.',
      'Đi xem mặt bằng, tôi không nhìn chỗ đông người đầu tiên.',
      'Mặt bằng đẹp là cái bẫy lớn nhất khi mở chuỗi.',
      'Thử chọn một góc ngã tư sầm uất, bạn sẽ khóc khi làm kho.',
    ],
    selectedHook:
      'Cửa hàng đẹp chưa chắc đã bán tốt. Sau vài lần đi xem mặt bằng cho Haichai, tôi mới nhận ra có một thứ quan trọng hơn vị trí.',
    selectedHookReason:
      'Đánh trúng tâm lý thích mặt bằng đẹp, có mâu thuẫn nhẹ và hứa hẹn bài học thật.',
    duration: '60s',
    scenes: [
      {
        name: 'Cảnh 1: Đang đứng trước một mặt bằng đang sửa',
        content:
          'Nhiều người nghĩ mở chuỗi thì cứ tìm ngã tư, mặt tiền rộng là thắng. Tôi cũng từng nghĩ thế.',
        visualSuggestion: 'Cầm bản vẽ, chỉ tay vào không gian',
      },
      {
        name: 'Cảnh 2: Đi vào khu vực kho hẹp',
        content:
          'Nhưng ra làm thật mới thấy, cửa hàng đẹp mà không có chỗ làm kho, không có đường cho xe tải nhỏ vào giao hàng thì vận hành cực kỳ khổ.',
        visualSuggestion: 'Quay góc hẹp, vẻ mặt nhăn nhó',
      },
      {
        name: 'Cảnh 3: Đứng ở quầy thu ngân',
        content:
          'Với ngành này, mặt bằng phù hợp với quy trình kiểm soát quan trọng hơn một cái mặt tiền hào nhoáng.',
        visualSuggestion: 'Gõ tay lên bàn, nói dứt khoát',
      },
    ],
    ending:
      'Mở rộng không khó bằng giữ tiêu chuẩn khi mở rộng. Bắt đầu từ cái mặt bằng.',
    caption:
      'Bài học xương máu khi đi tìm nhà cho Haichai. #haichai #kinhdoanh #mochuoi',
    textOnScreen: 'Cửa hàng đẹp chưa chắc đã bán tốt',
    hashtags: '#haichai, #kinhdoanh',
    notes: '',
    status: 'approved',
    duplicateRiskScore: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const CATEGORIES = [
  'Góc khuất / quan điểm ngược',
  'Sai lầm / bài học người chủ',
  'Hậu trường thật',
  'Sản phẩm / niềm tin / giấy tờ',
];

const TOPIC_COUNT_OPTIONS = [5, 10, 20, 30];

const TOPIC_DISTRIBUTIONS = {
  5: {
    'Góc khuất / quan điểm ngược': 2,
    'Sai lầm / bài học người chủ': 1,
    'Hậu trường thật': 1,
    'Sản phẩm / niềm tin / giấy tờ': 1,
  },
  10: {
    'Góc khuất / quan điểm ngược': 5,
    'Sai lầm / bài học người chủ': 2,
    'Hậu trường thật': 2,
    'Sản phẩm / niềm tin / giấy tờ': 1,
  },
  20: {
    'Góc khuất / quan điểm ngược': 9,
    'Sai lầm / bài học người chủ': 5,
    'Hậu trường thật': 4,
    'Sản phẩm / niềm tin / giấy tờ': 2,
  },
  30: {
    'Góc khuất / quan điểm ngược': 14,
    'Sai lầm / bài học người chủ': 7,
    'Hậu trường thật': 6,
    'Sản phẩm / niềm tin / giấy tờ': 3,
  },
};

const getTopicDistributionLines = (count) => {
  const distribution = TOPIC_DISTRIBUTIONS[count] || TOPIC_DISTRIBUTIONS[30];
  return Object.entries(distribution)
    .map(([category, quantity]) => `- ${quantity} chủ đề: ${category}`)
    .join('\n');
};

const getTopicDistributionSummary = (count) => {
  const distribution = TOPIC_DISTRIBUTIONS[count] || TOPIC_DISTRIBUTIONS[30];
  return Object.entries(distribution)
    .map(([category, quantity]) => `${quantity} ${category}`)
    .join(' · ');
};

const EMPTY_MANUAL_SCRIPT = {
  title: '',
  category: CATEGORIES[0],
  topic: '',
  mainMessage: '',
  selectedHook: '',
  selectedHookReason: 'Thêm thủ công',
  scenes: [{ name: 'Cảnh 1', content: '', visualSuggestion: '' }],
  ending: '',
  textOnScreen: '',
  caption: '',
  notes: '',
};


// Firestore có thể trả về snapshot cũ ngay sau khi user tick chọn chủ đề.
// Giữ trạng thái selected hiện tại trên máy để checkbox không bị tự hủy tick.
const mergeTopicsPreservingLocalSelection = (incomingTopics = [], currentTopics = []) => {
  const localSelectionById = new Map(
    currentTopics.map((topic) => [topic.id, Boolean(topic.selected)])
  );

  return incomingTopics.map((topic) => {
    if (!localSelectionById.has(topic.id)) {
      return { ...topic, selected: Boolean(topic.selected) };
    }

    return {
      ...topic,
      selected: localSelectionById.get(topic.id),
    };
  });
};

// Firestore cũng có thể trả snapshot cũ ngay sau khi AI vừa tạo draft.
// Nếu ghi đè thẳng bằng snapshot cũ, app báo tạo thành công nhưng tab Draft lại trống.
const mergeDraftScriptsPreservingLocal = (incomingDrafts = [], currentDrafts = []) => {
  const draftsById = new Map();

  incomingDrafts.forEach((draft) => {
    if (draft?.id) draftsById.set(draft.id, draft);
  });

  currentDrafts.forEach((draft) => {
    if (draft?.id && !draftsById.has(draft.id)) {
      draftsById.set(draft.id, draft);
    }
  });

  return Array.from(draftsById.values());
};

// Chặn snapshot Firestore cũ ghi đè draft vừa tạo.
// Thường xảy ra khi có một lượt sync cũ đang bay trên mạng, sau đó trả về muộn.
const DRAFT_CLOUD_GUARD_MS = 30000;

// --- REAL AI FUNCTIONS (MULTI-PROVIDER API) ---
const AI_PROVIDERS = {
  gemini: {
    label: 'Gemini',
    keyLabel: 'Gemini API Key',
    placeholder: 'AIza...',
    maxOutputTokens: 32768,
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ],
  },
  openai: {
    label: 'ChatGPT / OpenAI',
    keyLabel: 'OpenAI API Key',
    placeholder: 'sk-...',
    maxOutputTokens: 16000,
    models: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o'],
  },
  groq: {
    label: 'Groq',
    keyLabel: 'Groq API Key',
    placeholder: 'gsk_...',
    maxOutputTokens: 8000,
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ],
  },
  openrouter: {
    label: 'OpenRouter',
    keyLabel: 'OpenRouter API Key',
    placeholder: 'sk-or-v1-...',
    maxOutputTokens: 12000,
    models: [
      'openai/gpt-4.1-mini',
      'google/gemini-2.5-flash',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
    ],
  },
  grok: {
    label: 'Grok / xAI',
    keyLabel: 'xAI API Key',
    placeholder: 'xai-...',
    maxOutputTokens: 4096,
    models: [
      'grok-3-mini-fast',
      'grok-4.5',
      'grok-4.3',
      'grok-4.20-0309-non-reasoning',
      'grok-4.20-0309-reasoning',
      'grok-4.20-multi-agent-0309',
      'grok-build-0.1',
      'grok-2-1212',
      'grok-beta',
    ],
  },
};

const DEFAULT_AI_PROVIDER = 'gemini';
const AI_TIMEOUT_MS = 120000; // Tăng lên 120s giúp giảm lỗi timeout khi hệ thống AI quá tải hoặc viết kịch bản dài
const SCRIPT_BATCH_SIZE = 5;

const getAiProviderConfig = (provider) =>
  AI_PROVIDERS[provider] || AI_PROVIDERS[DEFAULT_AI_PROVIDER];

const getDefaultAiModel = (provider) =>
  getAiProviderConfig(provider).models[0];

const getAiKeyStorageKey = (provider) => `haichai_ai_${provider}_api_key`;
const getAiModelStorageKey = (provider) => `haichai_ai_${provider}_model`;
const getAiBaseUrlStorageKey = (provider) => `haichai_ai_${provider}_base_url`;

const normalizeApiKey = (value = '', provider = DEFAULT_AI_PROVIDER) => {
  let key = String(value || '').trim();
  const envNamesByProvider = {
    gemini: [
      'GEMINI_API_KEY',
      'GOOGLE_API_KEY',
      'VITE_GEMINI_API_KEY',
      'REACT_APP_GEMINI_API_KEY',
    ],
    openai: [
      'OPENAI_API_KEY',
      'CHATGPT_API_KEY',
      'VITE_OPENAI_API_KEY',
      'REACT_APP_OPENAI_API_KEY',
    ],
    groq: ['GROQ_API_KEY', 'VITE_GROQ_API_KEY', 'REACT_APP_GROQ_API_KEY'],
    openrouter: [
      'OPENROUTER_API_KEY',
      'VITE_OPENROUTER_API_KEY',
      'REACT_APP_OPENROUTER_API_KEY',
    ],
    grok: ['XAI_API_KEY', 'GROK_API_KEY', 'VITE_XAI_API_KEY', 'VITE_GROK_API_KEY'],
  };

  const envNames = envNamesByProvider[provider] || [];
  if (envNames.length > 0) {
    const assignmentMatch = key.match(
      new RegExp(`(?:${envNames.join('|')})\\s*=\\s*['"]?([^'"\\s]+)`, 'i')
    );
    if (assignmentMatch?.[1]) key = assignmentMatch[1];
  }

  const rawPatterns = {
    gemini: /AIza[0-9A-Za-z_-]{20,}/,
    openai: /sk-[0-9A-Za-z_-]{20,}/,
    groq: /gsk_[0-9A-Za-z_-]{20,}/,
    openrouter: /sk-or-v1-[0-9A-Za-z_-]{20,}/,
    grok: /(?:xai|sk)-[0-9A-Za-z_-]{20,}/,
  };

  const rawKeyMatch = key.match(rawPatterns[provider]);
  if (rawKeyMatch?.[0]) key = rawKeyMatch[0];

  return key.replace(/^['"]|['"]$/g, '').trim();
};

const getStoredAIConfig = () => {
  if (typeof window === 'undefined') {
    return {
      provider: DEFAULT_AI_PROVIDER,
      apiKey: '',
      model: getDefaultAiModel(DEFAULT_AI_PROVIDER),
      baseUrl: '',
    };
  }

  const provider =
    localStorage.getItem('haichai_ai_provider') || DEFAULT_AI_PROVIDER;
  const safeProvider = AI_PROVIDERS[provider] ? provider : DEFAULT_AI_PROVIDER;
  const legacyGeminiKey = localStorage.getItem('gemini_api_key') || '';
  const storedKey =
    localStorage.getItem(getAiKeyStorageKey(safeProvider)) ||
    (safeProvider === 'gemini' ? legacyGeminiKey : '');
  const storedModel =
    localStorage.getItem(getAiModelStorageKey(safeProvider)) ||
    getDefaultAiModel(safeProvider);
  const storedBaseUrl =
    localStorage.getItem(getAiBaseUrlStorageKey(safeProvider)) || '';

  return {
    provider: safeProvider,
    apiKey: normalizeApiKey(storedKey, safeProvider),
    model: storedModel.trim() || getDefaultAiModel(safeProvider),
    baseUrl: storedBaseUrl.trim(),
  };
};

// Gemini và vài provider OpenAI-compatible chỉ nhận một tập con JSON Schema.
// Hàm này giữ cấu trúc field nhưng bỏ các phần dễ gây lỗi hoặc làm prompt dài.
const sanitizeAISchema = (schema, insideProperties = false) => {
  if (Array.isArray(schema)) return schema.map((item) => sanitizeAISchema(item));
  if (!schema || typeof schema !== 'object') return schema;

  if (insideProperties) {
    const cleanedProperties = {};
    Object.entries(schema).forEach(([propertyName, propertySchema]) => {
      cleanedProperties[propertyName] = sanitizeAISchema(propertySchema);
    });
    return cleanedProperties;
  }

  const allowedKeys = new Set([
    'type',
    'format',
    'items',
    'properties',
    'required',
    'enum',
    'nullable',
    'propertyOrdering',
    'minimum',
    'maximum',
    'minItems',
    'maxItems',
  ]);

  const cleaned = {};
  Object.entries(schema).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) return;
    cleaned[key] = key === 'properties'
      ? sanitizeAISchema(value, true)
      : sanitizeAISchema(value);
  });

  return cleaned;
};

const getAIResponseText = (provider, result) => {
  if (provider === 'gemini') {
    const candidate = result?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts
      .map((part) => part?.text || '')
      .join('\n')
      .trim();

    if (text) return text;

    const finishReason = candidate?.finishReason || 'UNKNOWN';
    const blockReason = result?.promptFeedback?.blockReason;
    throw new Error(
      `AI có phản hồi nhưng không có nội dung text. finishReason=${finishReason}${
        blockReason ? `, blockReason=${blockReason}` : ''
      }.`
    );
  }

  const content = result?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    const text = content
      .map((part) => part?.text || '')
      .join('\n')
      .trim();
    if (text) return text;
  }

  if (typeof content === 'string' && content.trim()) return content.trim();

  const finishReason = result?.choices?.[0]?.finish_reason || 'UNKNOWN';
  throw new Error(
    `AI có phản hồi nhưng không có nội dung text. finishReason=${finishReason}.`
  );
};

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = AI_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        `AI không phản hồi sau ${Math.round(
          timeoutMs / 1000
        )} giây. Hãy test key/model ở Cài đặt & Dữ liệu trước khi tạo hàng loạt.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const normalizeAIError = (provider, status, message) => {
  const label = getAiProviderConfig(provider).label;
  const lowerMessage = String(message || '').toLowerCase();

  if (
    lowerMessage.includes('api key not valid') ||
    lowerMessage.includes('api_key_invalid') ||
    lowerMessage.includes('invalid api key')
  ) {
    return `${label} API Key không hợp lệ (${status}). Hãy kiểm tra lại key ở Cài đặt & Dữ liệu.`;
  }

  if (
    lowerMessage.includes('referer') ||
    lowerMessage.includes('http referrer') ||
    lowerMessage.includes('ip address') ||
    lowerMessage.includes('application restrictions')
  ) {
    return `${label} API Key đang bị giới hạn domain/IP (${status}). Hãy thêm đúng domain web đang chạy hoặc tạo key mới.`;
  }

  if (status === 400)
    return `${label} báo request chưa hợp lệ (${status}): ${
      message || 'Kiểm tra model/schema/prompt.'
    }`;
  if (status === 401 || status === 403)
    return `${label} API Key sai, bị chặn, hoặc chưa được cấp quyền (${status}).`;
  if (status === 404)
    return `Model không tồn tại hoặc key chưa có quyền dùng model này trên ${label} (${status}).`;
  if (status === 429)
    return `${label} đang bị rate limit. Đợi 30–60 giây rồi thử lại, hoặc chọn model/provider khác.`;
  if (status >= 500)
    return `${label} đang lỗi máy chủ (${status}). Thử lại sau hoặc đổi provider/model.`;

  return message || `Lỗi ${label} (${status})`;
};

const isTransientAIError = (status) => [408, 409, 429, 500, 502, 503, 504].includes(status);

const extractJsonFromText = (text) => {
  if (!text)
    throw new Error(
      'AI trả về dữ liệu rỗng. Có thể prompt quá dài hoặc response bị chặn.'
    );

  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
};

const getSchemaInstruction = (schema) => {
  if (!schema) return '';
  const cleanSchema = sanitizeAISchema(schema);
  return `

QUY TẮC TRẢ VỀ BẮT BUỘC:
- Chỉ trả về JSON hợp lệ, không markdown, không giải thích thêm.
- Không bọc trong \`\`\`json.
- JSON phải parse được bằng JSON.parse().
- JSON phải bám schema này:
${JSON.stringify(cleanSchema)}`;
};

const buildAIRequest = ({
  provider,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  schema,
  useJsonMode = true,
  baseUrl = '',
  temperature = 0.7,
}) => {
  const fullUserPrompt = `${userPrompt}${getSchemaInstruction(schema)}`;

  if (provider === 'gemini' && !baseUrl) {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              role: 'user',
              parts: [{ text: fullUserPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: getAiProviderConfig(provider).maxOutputTokens,
            temperature: temperature,
          },
        }),
      },
    };
  }

  const endpoints = {
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    grok: 'https://api.x.ai/v1/chat/completions',
  };

  let endpoint = endpoints[provider];
  if (baseUrl) {
    endpoint = baseUrl.trim();
    if (!endpoint.endsWith('/chat/completions')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === 'openrouter' && typeof window !== 'undefined') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Haichai Script Studio';
  }

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: fullUserPrompt },
    ],
    temperature: temperature,
    max_tokens: getAiProviderConfig(provider).maxOutputTokens,
  };

  if (useJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  return {
    url: endpoint,
    options: {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
  };
};

const callAIWithRetry = async (
  systemPrompt,
  userPrompt,
  schema,
  retries = 2,
  temperature = 0.7
) => {
  const { provider, apiKey, model, baseUrl } = getStoredAIConfig();
  const label = getAiProviderConfig(provider).label;

  if (!apiKey) {
    throw new Error(
      `Bạn chưa nhập ${getAiProviderConfig(provider).keyLabel}. Vào “Cài đặt & Dữ liệu” để nhập key trước.`
    );
  }

  if (!model) {
    throw new Error('Bạn chưa chọn model AI ở Cài đặt & Dữ liệu.');
  }

  let lastError;
  let useJsonMode = true;

  for (let i = 0; i < retries; i++) {
    try {
      const { url, options } = buildAIRequest({
        provider,
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        schema,
        useJsonMode,
        baseUrl,
        temperature,
      });

      let response;
      if (provider !== 'gemini' || baseUrl) {
        // Route through local Express server proxy to avoid CORS/Failed to fetch
        const proxyUrl = '/api/ai-proxy';
        const proxyOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            options: {
              method: options.method,
              headers: options.headers,
              body: options.body,
            },
          }),
        };
        response = await fetchWithTimeout(proxyUrl, proxyOptions);
      } else {
        response = await fetchWithTimeout(url, options);
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const rawMessage = errData?.error?.message || errData?.message || '';
        const err = new Error(normalizeAIError(provider, response.status, rawMessage));
        err.status = response.status;
        err.rawMessage = rawMessage;
        throw err;
      }

      const result = await response.json();
      const responseText = getAIResponseText(provider, result);
      return extractJsonFromText(responseText);
    } catch (error) {
      lastError = error;
      console.error(`${label} ${model} failed:`, error);

      if (
        useJsonMode &&
        provider !== 'gemini' &&
        error.status === 400
      ) {
        useJsonMode = false;
        continue;
      }

      if ([401, 403, 404].includes(error.status)) throw error;
      if (!isTransientAIError(error.status) || i === retries - 1) break;

      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }

  throw lastError || new Error(`Không gọi được ${label}.`);
};

const generateTopicsFromAI = async (bible, currentScripts, topicCount = 30, topicFocusPrompt = '') => {
  const safeTopicCount = TOPIC_COUNT_OPTIONS.includes(Number(topicCount))
    ? Number(topicCount)
    : 30;
  const distributionLines = getTopicDistributionLines(safeTopicCount);

  const systemPrompt = `Bạn là Content Strategist xuất sắc cho kênh TikTok nhân hiệu Haichai.
Dựa trên Content Bible và thư viện kịch bản cũ, hãy tạo ra CHÍNH XÁC ${safeTopicCount} chủ đề mới theo đúng tỉ lệ sau:
${distributionLines}

TUYỆT ĐỐI QUAN TRỌNG ĐỂ ĐẢM BẢO CHẤT LƯỢNG VÀ TRÁNH TRÙNG LẶP Ý TƯỞNG:
1. ĐA DẠNG HÓA GÓC NHÌN (CỰC KỲ QUAN TRỌNG): Các chủ đề được tạo ra phải vô cùng phong phú, tuyệt đối không được na ná hay lặp đi lặp lại một ý tưởng cũ. Hãy khai thác từ nhiều lăng kính độc đáo khác nhau:
   - Góc nhìn tâm lý học hành vi / Thói quen người tiêu dùng.
   - Góc nhìn sai lầm vận hành thực tế / Bài học xương máu mất tiền tỷ của người chủ.
   - Góc nhìn quản trị nhân sự / Tuyển dụng / Lòng trung thành của nhân sự mở chuỗi.
   - Góc nhìn phân tích tài chính / Tối ưu chi phí / Dự phòng dòng tiền.
   - Góc nhìn bóc trần sự thật ngầm hiểu (Insights) mà ít ai dám nói trong ngành.
   - Góc nhìn hậu trường chuẩn bị, giấy tờ kiểm định chất lượng, quy trình khép kín tạo dựng niềm tin.
2. BIẾN HÓA CẤU TRÚC NGỮ PHÁP TIÊU ĐỀ: Tuyệt đối không dùng lặp đi lặp lại các cụm từ mở đầu sáo rỗng như "Sai lầm khi...", "Sự thật về...", "Tại sao bạn...". Hãy biến hóa linh hoạt cấu trúc câu, ví dụ: "Mua danh ba vạn...", "Đừng vội mở quán nếu chưa biết...", "3 câu hỏi cắt đuôi môi giới mặt bằng...", "Công thức tính điểm hòa vốn Haichai...", v.v.
3. KHÔNG TRÙNG LẶP Ý TƯỞNG GIỮA CÁC CHỦ ĐỀ: Mỗi chủ đề trong danh sách ${safeTopicCount} chủ đề phải là một từ khóa hoàn toàn khác nhau, góc tiếp cận độc lập, không sinh ra nhiều chủ đề na ná nhau cùng nói về một khía cạnh.
4. QUY TẮC PHẢN HỒI:
   - Chỉ trả về JSON thuần, không markdown, không giải thích.
   - Không bọc JSON trong \`\`\`json.
   - JSON phải parse được bằng JSON.parse().
   - BẮT BUỘC mảng topics có đúng ${safeTopicCount} items.
   - Không trùng với các chủ đề đã có trong thư viện kịch bản cũ.
   - Không biến nội dung thành quảng cáo rượu, không cổ vũ uống rượu.
   - Ưu tiên hook hấp dẫn, bất ngờ, gây tò mò cực lớn hoặc khơi gợi nỗi đau/mong muốn thật của người xem.
   - duplicateRiskScore là điểm đánh giá từ 0-100 về khả năng trùng lặp ý tưởng với thư viện cũ (càng thấp càng an toàn).`;

  const oldTopics = currentScripts.map((s) => s.topic).filter(Boolean);

  let focusInstruction = '';
  if (topicFocusPrompt && topicFocusPrompt.trim()) {
    focusInstruction = `\n\nYÊU CẦU ĐỊNH HƯỚNG TỪ NGƯỜI DÙNG (CỰC KỲ ƯU TIÊN): Hãy đặc biệt ưu tiên sáng tạo các chủ đề xoay quanh định hướng, từ khóa hoặc ý tưởng sau: "${topicFocusPrompt.trim()}". Hãy khai thác thật sâu, thật đa dạng từ khóa này dưới nhiều nhóm nội dung quy định ở trên nhưng vẫn giữ vững phong cách của Haichai Content Bible.`;
  }

  const userPrompt = `Content Bible:\n${bible}\n\nThư viện kịch bản cũ cần tránh trùng:\n${JSON.stringify(
    oldTopics
  )}\n\nHãy tạo ĐẦY ĐỦ ${safeTopicCount} chủ đề ngay bây giờ theo đúng tỉ lệ:\n${distributionLines}${focusInstruction}\n\nCHỈ TRẢ VỀ JSON THUẦN THEO FORMAT SAU:
{
  "topics": [
    {
      "category": "Góc khuất / quan điểm ngược",
      "topicName": "...",
      "angle": "...",
      "hookType": "...",
      "suggestedHook": "...",
      "mainMessage": "...",
      "whyItCanWork": "...",
      "avoidRepeating": "...",
      "duplicateRiskScore": 0
    }
  ]
}

BẮT BUỘC:
- topics phải có đúng ${safeTopicCount} items.
- Mỗi item phải có đủ các field: category, topicName, angle, hookType, suggestedHook, mainMessage, whyItCanWork, avoidRepeating, duplicateRiskScore.
- category chỉ được nằm trong 4 nhóm nội dung đã nêu ở trên.
- duplicateRiskScore phải là số nguyên từ 0 đến 100.`;

  // TỐI ƯU TỐC ĐỘ VÀ SÁNG TẠO:
  // Truyền temperature = 0.85 để kích thích sự phong phú và khác biệt tối đa của các chủ đề.
  const result = await callAIWithRetry(systemPrompt, userPrompt, null, 1, 0.85);
  const rawTopics = Array.isArray(result?.topics) ? result.topics : [];

  if (rawTopics.length === 0) {
    throw new Error(
      'AI đã kết nối được nhưng không trả về mảng topics. Hãy thử lại, đổi model hoặc rút gọn Content Bible.'
    );
  }

  return rawTopics.slice(0, safeTopicCount).map((t, index) => ({
    id: `top_${Date.now()}_${index}`,
    ...t,
    selected: false,
  }));
};

const generateScriptsBatchFromAI = async (topics, bible, currentScripts, targetDuration = '60-75s') => {
  const systemPrompt = `Bạn là Script Writer kiêm Content Editor cho kênh TikTok nhân hiệu Haichai.
Nhiệm vụ của bạn là viết kịch bản chi tiết cho CÁC chủ đề được cung cấp. Bắt buộc bám Content Bible và thư viện cũ để tránh trùng lặp.

Yêu cầu về ĐỘ DÀI VÀ SỐ CẢNH (RẤT QUAN TRỌNG):
\${
  targetDuration === '30-45s'
    ? \`- Bạn ĐANG viết kịch bản thời lượng NGẮN (30–45 giây).
- Số lượng cảnh (scenes) tối ưu: từ 3 đến 4 cảnh.
- Tổng số từ phát âm (phần lời thoại/nội dung nói) cho cả kịch bản: khoảng 90 đến 120 từ. Mỗi cảnh chỉ nên có từ 1-2 câu ngắn gọn, súc tích.\`
    : targetDuration === '90-120s'
    ? \`- Bạn ĐANG viết kịch bản thời lượng DÀI (90–120 giây).
- Số lượng cảnh (scenes) tối ưu: từ 7 đến 10 cảnh chi tiết.
- Tổng số từ phát âm (phần lời thoại/nội dung nói) cho cả kịch bản: PHẢI từ 250 đến 350 từ để đảm bảo độ dài khi nói đạt 90-120 giây.
- Mỗi cảnh (scenes) phải được viết cực kỳ chi tiết, nhiều lời thoại giải thích sâu sắc, phân tích rõ ràng, không viết qua loa hay quá ngắn gọn.\`
    : \`- Bạn ĐANG viết kịch bản thời lượng TRUNG BÌNH (60–75 giây).
- Số lượng cảnh (scenes) tối ưu: từ 5 đến 6 cảnh.
- Tổng số từ phát âm (phần lời thoại/nội dung nói) cho cả kịch bản: khoảng 170 đến 220 từ. Các cảnh phân tích vừa đủ, chuyển cảnh tự nhiên.\`
}

Yêu cầu CHUNG cho mỗi kịch bản:
- Giọng thật, tỉnh, có trải nghiệm, không quảng cáo, không kêu gọi mua hàng, không cổ vũ uống rượu.
- Mỗi video chỉ có một thông điệp chính.
- Tạo 5 phương án hook, chọn 1 hook tốt nhất và giải thích.
- duplicateRiskScore là mức độ rủi ro trùng lặp với thư viện cũ (0-100).

TUYỆT ĐỐI QUAN TRỌNG: Đầu vào có bao nhiêu chủ đề, bạn PHẢI trả về mảng 'scripts' chứa đúng bấy nhiêu kịch bản.`;

  const userPrompt = `Content Bible:\n${bible}\n\nThư viện cũ:\n${JSON.stringify(
    currentScripts.map((s) => ({ title: s.title, topic: s.topic }))
  )}\n\nDANH SÁCH CHỦ ĐỀ CẦN VIẾT (${topics.length} chủ đề):\n${JSON.stringify(
    topics
  )}\n\nHãy viết kịch bản cho TẤT CẢ các chủ đề trên.`;

  const schema = {
    type: 'OBJECT',
    properties: {
      scripts: {
        type: 'ARRAY',
        description: `Mảng này BẮT BUỘC phải chứa đúng ${topics.length} kịch bản tương ứng với đầu vào.`,
        items: {
          type: 'OBJECT',
          properties: {
            topicId: {
              type: 'STRING',
              description: 'Mã ID của chủ đề tương ứng ở đầu vào',
            },
            title: { type: 'STRING' },
            mainMessage: { type: 'STRING' },
            hookOptions: { type: 'ARRAY', items: { type: 'STRING' } },
            selectedHook: { type: 'STRING' },
            selectedHookReason: { type: 'STRING' },
            duration: { 
              type: 'STRING',
              description: `Thời lượng kịch bản. Điền chính xác "${targetDuration === '30-45s' ? '30–45s' : targetDuration === '90-120s' ? '90–120s' : '60–75s'}"`
            },
            scenes: {
              type: 'ARRAY',
              description: targetDuration === '30-45s' 
                ? 'Mảng gồm 3-4 cảnh ngắn gọn. Tổng số từ của toàn bộ các cảnh cộng lại là khoảng 90-120 từ.'
                : targetDuration === '90-120s'
                ? 'Mảng gồm 7-10 cảnh chi tiết. Bắt buộc phải viết các đoạn thoại cực kỳ dài và phân tích sâu sắc cho mỗi cảnh. Tổng số từ của toàn bộ các cảnh cộng lại bắt buộc phải đạt từ 250 đến 350 từ để đủ thời lượng 90-120s.'
                : 'Mảng gồm 5-6 cảnh. Tổng số từ của toàn bộ các cảnh cộng lại là khoảng 170-220 từ.',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING', description: 'Tên cảnh (ví dụ: Cảnh 1, Cảnh 2...)' },
                  content: { 
                    type: 'STRING', 
                    description: targetDuration === '90-120s'
                      ? 'Nội dung nói / Lời thoại chi tiết của nhân vật trong cảnh này. Hãy viết dài, chi tiết, từ 3-4 câu phân tích rõ ràng và sâu sắc.'
                      : 'Nội dung nói / Lời thoại của nhân vật trong cảnh này.'
                  },
                  visualSuggestion: { type: 'STRING', description: 'Gợi ý hình ảnh, hành động của nhân vật' },
                },
              },
            },
            ending: { type: 'STRING' },
            caption: { type: 'STRING' },
            textOnScreen: { type: 'STRING' },
            hashtags: { type: 'STRING' },
            notes: { type: 'STRING' },
            duplicateRiskScore: { type: 'INTEGER' },
          },
        },
      },
    },
    required: ['scripts'],
  };

  const result = await callAIWithRetry(systemPrompt, userPrompt, schema);
  const generatedScripts = Array.isArray(result?.scripts) ? result.scripts : [];

  if (generatedScripts.length === 0) {
    throw new Error(
      'AI đã kết nối được nhưng không trả về mảng scripts cho cụm kịch bản này.'
    );
  }

  // Map dữ liệu AI trả về với Topic ban đầu và đảm bảo không thiếu field UI cần hiển thị.
  return generatedScripts.map((rawScript) => {
    const originalTopic =
      topics.find((t) => t.id === rawScript.topicId) || topics[0];

    const hookOptions = Array.isArray(rawScript.hookOptions)
      ? rawScript.hookOptions.filter(Boolean)
      : [];
    const scenes =
      Array.isArray(rawScript.scenes) && rawScript.scenes.length > 0
        ? rawScript.scenes.map((scene, index) => ({
            name: scene?.name || `Cảnh ${index + 1}`,
            content: scene?.content || '',
            visualSuggestion: scene?.visualSuggestion || '',
          }))
        : [{ name: 'Cảnh 1', content: '', visualSuggestion: '' }];

    return {
      id: `scr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topicId: rawScript.topicId || originalTopic.id,
      title: rawScript.title || originalTopic.topicName || 'Kịch bản chưa có tiêu đề',
      category: originalTopic.category || CATEGORIES[0],
      topic: originalTopic.topicName || '',
      angle: originalTopic.angle || '',
      mainMessage:
        rawScript.mainMessage || originalTopic.mainMessage || '',
      hookOptions,
      selectedHook:
        rawScript.selectedHook || hookOptions[0] || originalTopic.suggestedHook || '',
      selectedHookReason: rawScript.selectedHookReason || '',
      duration: rawScript.duration || (
        targetDuration === '30-45s' ? '30–45s' :
        targetDuration === '90-120s' ? '90–120s' : '60–75s'
      ),
      scenes,
      ending: rawScript.ending || '',
      caption: rawScript.caption || '',
      textOnScreen: rawScript.textOnScreen || rawScript.title || originalTopic.topicName || '',
      hashtags: rawScript.hashtags || '',
      notes: rawScript.notes || '',
      duplicateRiskScore: Number.isFinite(Number(rawScript.duplicateRiskScore))
        ? Number(rawScript.duplicateRiskScore)
        : Number(originalTopic.duplicateRiskScore) || 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bible, setBible] = useState(DEFAULT_CONTENT_BIBLE);
  const [scripts, setScripts] = useState([]);
  const [viewingScript, setViewingScript] = useState(null);

  // Library State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  // Topic Gen State
  const [generatedTopics, setGeneratedTopics] = useState([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [topicCount, setTopicCount] = useState(30);
  const [topicFocusPrompt, setTopicFocusPrompt] = useState('');
  const [customTopicText, setCustomTopicText] = useState('');
  const [customTopicCategory, setCustomTopicCategory] = useState(CATEGORIES[0]);
  const [isGeneratingCustomScript, setIsGeneratingCustomScript] =
    useState(false);

  // Script Gen State
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [draftScripts, setDraftScripts] = useState([]);
  const [draftSortOrder, setDraftSortOrder] = useState('newest'); // 'newest' hoặc 'oldest'
  const [generationStatus, setGenerationStatus] = useState('');
  const [scriptTargetDuration, setScriptTargetDuration] = useState('60-75s');

  // Manual Add State
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualScript, setManualScript] = useState(EMPTY_MANUAL_SCRIPT);

  // Custom Modal UI State
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null,
  });

  const showAlert = (title, message) =>
    setModal({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  const showConfirm = (title, message, onConfirm) =>
    setModal({ isOpen: true, type: 'confirm', title, message, onConfirm });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  // Firebase Auth + Firestore Sync State
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Chưa đăng nhập Firebase');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const latestDataRef = useRef({
    bible: DEFAULT_CONTENT_BIBLE,
    scripts: [],
    draftScripts: [],
    generatedTopics: [],
  });
  const syncingFromCloudRef = useRef(false);
  const pendingDraftIdsRef = useRef(new Set());
  const lastDraftLocalChangeAtRef = useRef(0);

  // AI key chỉ lưu ở máy người dùng, không đẩy lên Firestore.
  const [aiProvider, setAiProvider] = useState(DEFAULT_AI_PROVIDER);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState(getDefaultAiModel(DEFAULT_AI_PROVIDER));
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiKeyStatus, setAiKeyStatus] = useState('');
  const [isTestingAiKey, setIsTestingAiKey] = useState(false);

  const handleSignInWithGoogle = async () => {
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email || '';

      if (!isAllowedCompanyEmail(email)) {
        await signOut(auth);
        setCurrentUser(null);
        setAuthError(
          `Email ${
            email || 'này'
          } không được phép. Chỉ cho phép @haichai.vn, @starspits.vn hoặc @starspirits.vn.`
        );
        return;
      }

      localStorage.removeItem('haichai_offline_mode');
      setCurrentUser(result.user);
    } catch (error) {
      console.error('Firebase sign-in error:', error);
      let errMsg = error.message || 'Không đăng nhập được bằng Google.';
      if (error.code === 'auth/unauthorized-domain' || String(error.message).includes('unauthorized-domain')) {
        const currentDomain = window.location.hostname;
        errMsg = (
          <div>
            <p className="font-semibold mb-1">Lỗi tên miền chưa được cấp quyền (unauthorized-domain):</p>
            <p className="mb-2">Tên miền hiện tại <code className="bg-red-100 px-1 py-0.5 rounded text-xs font-mono">{currentDomain}</code> chưa được thêm vào danh sách Authorized Domains của dự án Firebase.</p>
            <p className="mb-2 text-xs">Vui lòng mở Firebase Console, vào mục <strong>Authentication &gt; Settings &gt; Authorized domains</strong> và thêm tên miền trên để có thể đồng bộ.</p>
            <p className="text-xs font-medium text-slate-800">Bạn có thể bấm nút "Sử dụng Ngoại tuyến (Offline Mode)" bên dưới để tiếp tục trải nghiệm toàn bộ tính năng kịch bản mà không cần đăng nhập!</p>
          </div>
        );
      }
      setAuthError(errMsg);
    }
  };

  const handleSignInOffline = () => {
    setAuthError('');
    const offlineUser = {
      email: 'offline-user@starspirits.vn',
      displayName: 'Khách (Offline Mode)',
      uid: 'offline_user',
      isOffline: true,
    };
    localStorage.setItem('haichai_offline_mode', 'true');
    setCurrentUser(offlineUser);
    setSyncStatus('Chế độ ngoại tuyến (Không đồng bộ Cloud)');
    setCloudReady(false);
  };

  const handleSignOut = async () => {
    localStorage.removeItem('haichai_offline_mode');
    await signOut(auth);
    setCurrentUser(null);
    setCloudReady(false);
    setSyncStatus('Đã đăng xuất Firebase');
  };

  const handleProviderChange = (provider) => {
    const safeProvider = AI_PROVIDERS[provider] ? provider : DEFAULT_AI_PROVIDER;
    const savedKey =
      localStorage.getItem(getAiKeyStorageKey(safeProvider)) ||
      (safeProvider === 'gemini' ? localStorage.getItem('gemini_api_key') || '' : '');
    const savedModel =
      localStorage.getItem(getAiModelStorageKey(safeProvider)) ||
      getDefaultAiModel(safeProvider);
    const savedBaseUrl =
      localStorage.getItem(getAiBaseUrlStorageKey(safeProvider)) || '';

    localStorage.setItem('haichai_ai_provider', safeProvider);
    setAiProvider(safeProvider);
    setAiApiKey(savedKey);
    setAiModel(savedModel);
    setAiBaseUrl(savedBaseUrl);
    setAiKeyStatus('');
  };

  const handleSaveAiKey = () => {
    const key = normalizeApiKey(aiApiKey, aiProvider);
    const model = aiModel.trim() || getDefaultAiModel(aiProvider);
    const baseUrl = aiBaseUrl.trim();

    localStorage.setItem('haichai_ai_provider', aiProvider);
    localStorage.setItem(getAiModelStorageKey(aiProvider), model);
    localStorage.setItem(getAiBaseUrlStorageKey(aiProvider), baseUrl);

    if (!key) {
      localStorage.removeItem(getAiKeyStorageKey(aiProvider));
      if (aiProvider === 'gemini') localStorage.removeItem('gemini_api_key');
      setAiApiKey('');
      setAiModel(model);
      setAiBaseUrl(baseUrl);
      setAiKeyStatus(`Đã xoá ${getAiProviderConfig(aiProvider).keyLabel} trên máy này.`);
      return;
    }

    localStorage.setItem(getAiKeyStorageKey(aiProvider), key);
    if (aiProvider === 'gemini') localStorage.setItem('gemini_api_key', key);
    setAiApiKey(key);
    setAiModel(model);
    setAiBaseUrl(baseUrl);
    setAiKeyStatus(`Đã lưu ${getAiProviderConfig(aiProvider).keyLabel}, model ${model}${baseUrl ? ` và Custom API Base URL: ${baseUrl}` : ''}.`);
  };

  const handleTestAiKey = async () => {
    const key = normalizeApiKey(aiApiKey, aiProvider);
    const model = aiModel.trim() || getDefaultAiModel(aiProvider);
    const baseUrl = aiBaseUrl.trim();

    if (!key) {
      setAiKeyStatus('Bạn chưa nhập key để test.');
      return;
    }

    localStorage.setItem('haichai_ai_provider', aiProvider);
    localStorage.setItem(getAiKeyStorageKey(aiProvider), key);
    localStorage.setItem(getAiModelStorageKey(aiProvider), model);
    localStorage.setItem(getAiBaseUrlStorageKey(aiProvider), baseUrl);
    if (aiProvider === 'gemini') localStorage.setItem('gemini_api_key', key);

    setAiApiKey(key);
    setAiModel(model);
    setAiBaseUrl(baseUrl);
    setIsTestingAiKey(true);
    setAiKeyStatus(`Đang test ${getAiProviderConfig(aiProvider).label} / ${model}...`);

    try {
      const result = await callAIWithRetry(
        'Bạn là hệ thống kiểm tra kết nối. Chỉ trả JSON hợp lệ.',
        'Trả về {"ok":true,"message":"AI connected"}',
        {
          type: 'OBJECT',
          properties: {
            ok: { type: 'BOOLEAN' },
            message: { type: 'STRING' },
          },
          required: ['ok', 'message'],
        },
        1
      );

      if (result?.ok) {
        setAiKeyStatus(`${getAiProviderConfig(aiProvider).label} API Key và model dùng được.`);
      } else {
        setAiKeyStatus(
          'AI có phản hồi nhưng JSON không đúng format mong đợi.'
        );
      }
    } catch (error) {
      console.error('AI key test error:', error);
      setAiKeyStatus(error.message || 'Không test được AI API Key/model.');
    } finally {
      setIsTestingAiKey(false);
    }
  };

  // Load local backup trước để không mất dữ liệu khi chưa đăng nhập hoặc mất mạng.
  useEffect(() => {
    try {
      const savedBible = localStorage.getItem('haichai_bible');
      if (savedBible) setBible(savedBible);

      const savedScripts = localStorage.getItem('haichai_scripts');
      if (savedScripts) {
        setScripts(JSON.parse(savedScripts));
      } else {
        setScripts(INITIAL_SCRIPTS);
      }

      const savedDrafts = localStorage.getItem('haichai_drafts');
      if (savedDrafts) setDraftScripts(JSON.parse(savedDrafts));

      const savedTopics = localStorage.getItem('haichai_generated_topics');
      if (savedTopics) setGeneratedTopics(JSON.parse(savedTopics));

      const savedAIConfig = getStoredAIConfig();
      setAiProvider(savedAIConfig.provider);
      setAiApiKey(savedAIConfig.apiKey);
      setAiModel(savedAIConfig.model);
      setAiBaseUrl(savedAIConfig.baseUrl || '');
    } catch (error) {
      console.error('LocalStorage load error:', error);
      setScripts(INITIAL_SCRIPTS);
    } finally {
      setIsLocalLoaded(true);
    }
  }, []);

  // Lắng nghe trạng thái đăng nhập Firebase (TẠM THỜI TẮT LOGIN ĐỂ DEBUG).
  // Lắng nghe trạng thái đăng nhập Firebase
  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email || '';
        if (isAllowedCompanyEmail(email)) {
          setCurrentUser(user);
          localStorage.removeItem('haichai_offline_mode');
          setSyncStatus('Đã kết nối Firebase');
        } else {
          await signOut(auth);
          setCurrentUser(null);
          setAuthError(
            `Email ${email || 'này'} không được phép. Chỉ cho phép @haichai.vn, @starspits.vn hoặc @starspirits.vn.`
          );
        }
      } else {
        const isOffline = localStorage.getItem('haichai_offline_mode') === 'true';
        if (isOffline) {
          setCurrentUser({
            email: 'offline-user@starspirits.vn',
            displayName: 'Khách (Offline Mode)',
            uid: 'offline_user',
            isOffline: true,
          });
          setSyncStatus('Chế độ ngoại tuyến (Không đồng bộ Cloud)');
        } else {
          setCurrentUser(null);
          setSyncStatus('Chưa đăng nhập Firebase');
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Giữ dữ liệu mới nhất trong ref để lần đầu tạo document Firestore không bị stale state.
  useEffect(() => {
    latestDataRef.current = { bible, scripts, draftScripts, generatedTopics };
  }, [bible, scripts, draftScripts, generatedTopics]);

  // Luôn lưu một bản backup local. Nguồn chính vẫn là Firestore sau khi đăng nhập.
  useEffect(() => {
    if (!isLocalLoaded) return;

    localStorage.setItem('haichai_bible', bible);
    localStorage.setItem('haichai_scripts', JSON.stringify(scripts));
    localStorage.setItem('haichai_drafts', JSON.stringify(draftScripts));
    localStorage.setItem(
      'haichai_generated_topics',
      JSON.stringify(generatedTopics)
    );
  }, [isLocalLoaded, bible, scripts, draftScripts, generatedTopics]);

  // Tải dữ liệu từ Firestore sau khi đăng nhập Google bằng email công ty.
  useEffect(() => {
    if (!currentUser || !isLocalLoaded || currentUser.isOffline) return;

    setSyncStatus('Đang kết nối Firestore...');
    setCloudReady(false);

    const ref = getAppDataRef();
    const unsubscribe = onSnapshot(
      ref,
      async (snapshot) => {
        syncingFromCloudRef.current = true;

        try {
          if (snapshot.exists()) {
            const data = snapshot.data();

            if (typeof data.bible === 'string') setBible(data.bible);
            if (Array.isArray(data.scripts)) setScripts(data.scripts);
            if (Array.isArray(data.draftScripts)) {
              const incomingDrafts = data.draftScripts;
              const incomingDraftIds = new Set(
                incomingDrafts.map((draft) => draft?.id).filter(Boolean)
              );
              const pendingDraftIds = Array.from(pendingDraftIdsRef.current);
              const isMissingPendingDraft = pendingDraftIds.some(
                (id) => !incomingDraftIds.has(id)
              );
              const isRecentLocalDraftChange =
                Date.now() - lastDraftLocalChangeAtRef.current <
                DRAFT_CLOUD_GUARD_MS;

              if (isMissingPendingDraft && isRecentLocalDraftChange) {
                setSyncStatus(
                  'Đang giữ draft vừa tạo, bỏ qua snapshot Firestore cũ'
                );
              } else {
                if (!isMissingPendingDraft) pendingDraftIdsRef.current.clear();
                setDraftScripts((currentDrafts) =>
                  mergeDraftScriptsPreservingLocal(
                    incomingDrafts,
                    currentDrafts
                  )
                );
              }
            }
            if (Array.isArray(data.generatedTopics)) {
              setGeneratedTopics((currentTopics) =>
                mergeTopicsPreservingLocalSelection(
                  data.generatedTopics,
                  currentTopics
                )
              );
            }

            setSyncStatus('Đã tải dữ liệu từ Firestore');
          } else {
            await setDoc(
              ref,
              {
                ...latestDataRef.current,
                ownerEmail: currentUser.email || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            setSyncStatus('Đã tạo dữ liệu Firestore từ dữ liệu local hiện tại');
          }

          setLastSyncedAt(new Date());
          setCloudReady(true);
        } finally {
          setTimeout(() => {
            syncingFromCloudRef.current = false;
          }, 0);
        }
      },
      (error) => {
        console.error('Firestore listen error:', error);
        setSyncStatus(`Lỗi Firestore: ${error.message}`);
        setCloudReady(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isLocalLoaded]);

  // Tự động sync mọi thay đổi lên Firestore, có debounce để không ghi liên tục từng ký tự.
  useEffect(() => {
    if (!currentUser || !cloudReady || syncingFromCloudRef.current || currentUser.isOffline) return;

    setSyncStatus('Đang chờ đồng bộ...');
    const timeout = setTimeout(async () => {
      try {
        const latestData = latestDataRef.current;
        await setDoc(
          getAppDataRef(),
          {
            ...latestData,
            ownerEmail: currentUser.email || '',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        setSyncStatus('Đã đồng bộ Firestore');
        setLastSyncedAt(new Date());
      } catch (error) {
        console.error('Firestore save error:', error);
        setSyncStatus(`Lỗi lưu Firestore: ${error.message}`);
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [currentUser, cloudReady, bible, scripts, draftScripts, generatedTopics]);

  const saveScriptsToStorage = (newScripts) => {
    setScripts(newScripts);
  };

  const saveDraftScriptsToStorage = async (newDraftScripts) => {
    const safeDraftScripts = Array.isArray(newDraftScripts)
      ? newDraftScripts
      : [];

    lastDraftLocalChangeAtRef.current = Date.now();
    safeDraftScripts.forEach((draft) => {
      if (draft?.id) pendingDraftIdsRef.current.add(draft.id);
    });

    setDraftScripts(safeDraftScripts);
    localStorage.setItem('haichai_drafts', JSON.stringify(safeDraftScripts));
    latestDataRef.current = {
      ...latestDataRef.current,
      draftScripts: safeDraftScripts,
    };

    if (!currentUser || !cloudReady || currentUser.isOffline) return;

    try {
      const latestData = {
        ...latestDataRef.current,
        draftScripts: safeDraftScripts,
      };

      await setDoc(
        getAppDataRef(),
        {
          ...latestData,
          ownerEmail: currentUser.email || '',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSyncStatus('Đã đồng bộ draft lên Firestore');
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Firestore draft save error:', error);
      setSyncStatus(`Lỗi lưu draft Firestore: ${error.message}`);
    }
  };

  const handleBibleChange = (e) => {
    setBible(e.target.value);
  };

  const handleSaveManualScript = () => {
    if (!manualScript.title.trim()) {
      return showAlert('Lỗi', 'Vui lòng nhập tiêu đề kịch bản!');
    }

    const newScript = {
      ...manualScript,
      id: `s_man_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'approved',
      duplicateRiskScore: 0, // Kịch bản thủ công mặc định rủi ro = 0
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveScriptsToStorage([newScript, ...scripts]);
    setIsAddingManual(false);
    setManualScript(EMPTY_MANUAL_SCRIPT);
    showAlert('Thành công', 'Đã thêm kịch bản thủ công vào thư viện!');
  };

  const updateManualScene = (index, field, value) => {
    const newScenes = [...manualScript.scenes];
    newScenes[index][field] = value;
    setManualScript({ ...manualScript, scenes: newScenes });
  };

  const addManualScene = () => {
    setManualScript({
      ...manualScript,
      scenes: [
        ...manualScript.scenes,
        {
          name: `Cảnh ${manualScript.scenes.length + 1}`,
          content: '',
          visualSuggestion: '',
        },
      ],
    });
  };

  const removeManualScene = (index) => {
    const newScenes = manualScript.scenes.filter((_, i) => i !== index);
    setManualScript({ ...manualScript, scenes: newScenes });
  };

  // --- ACTIONS ---
  const handleGenerateTopics = async () => {
    const { apiKey, provider } = getStoredAIConfig();
    if (!apiKey) {
      setActiveTab('settings');
      return showAlert(
        'Thiếu AI API Key',
        `Vào Cài đặt & Dữ liệu, chọn ${getAiProviderConfig(provider).label}, nhập API Key và model rồi bấm “Lưu cấu hình AI” trước khi tạo.`
      );
    }

    setIsGeneratingTopics(true);
    try {
      const topics = await generateTopicsFromAI(bible, scripts, topicCount, topicFocusPrompt);
      if (topics && topics.length > 0) {
        setGeneratedTopics(topics);
      } else {
        showAlert(
          'Lỗi AI',
          'AI kết nối được nhưng trả về 0 chủ đề. Hãy thử lại, đổi model hoặc rút gọn Content Bible.'
        );
      }
    } catch (error) {
      console.error('Topic generation error:', error);
      showAlert('Lỗi AI', error.message || 'Không tạo được chủ đề.');
    } finally {
      setIsGeneratingTopics(false);
    }
  };


  const handleGenerateCustomTopicScript = async () => {
    const topicText = customTopicText.trim();

    if (!topicText) {
      return showAlert(
        'Thiếu chủ đề phát sinh',
        'Vui lòng nhập chủ đề thực tế cần tạo kịch bản.'
      );
    }

    const { apiKey, provider } = getStoredAIConfig();
    if (!apiKey) {
      setActiveTab('settings');
      return showAlert(
        'Thiếu AI API Key',
        `Vào Cài đặt & Dữ liệu, chọn ${getAiProviderConfig(provider).label}, nhập API Key và model rồi bấm “Lưu cấu hình AI” trước khi tạo.`
      );
    }

    const customTopic = {
      id: `custom_top_${Date.now()}`,
      category: customTopicCategory,
      topicName: topicText,
      angle: `Chủ đề phát sinh thực tế: ${topicText}`,
      hookType: 'Chủ đề phát sinh thực tế',
      suggestedHook: '',
      mainMessage:
        'AI tự xác định thông điệp chính dựa trên chủ đề phát sinh và Content Bible.',
      whyItCanWork:
        'Chủ đề đến từ tình huống thực tế nên có tính thời sự và chất liệu thật.',
      avoidRepeating:
        'Tránh lặp lại hook, góc nhìn và thông điệp đã có trong thư viện kịch bản cũ.',
      duplicateRiskScore: 0,
      selected: true,
    };

    setIsGeneratingCustomScript(true);
    setGenerationStatus('Đang tạo kịch bản từ chủ đề phát sinh...');

    try {
      const newScripts = await generateScriptsBatchFromAI(
        [customTopic],
        bible,
        scripts,
        scriptTargetDuration
      );

      if (newScripts && newScripts.length > 0) {
        const currentDrafts = Array.isArray(latestDataRef.current.draftScripts)
          ? latestDataRef.current.draftScripts
          : draftScripts;
        await saveDraftScriptsToStorage([...currentDrafts, ...newScripts]);
        setCustomTopicText('');
        setActiveTab('generate-scripts');
        showAlert(
          'Thành công',
          'Đã tạo 1 kịch bản từ chủ đề phát sinh và đưa vào Kịch bản Draft.'
        );
      } else {
        showAlert(
          'Lỗi AI',
          'AI kết nối được nhưng chưa trả về kịch bản cho chủ đề phát sinh.'
        );
      }
    } catch (error) {
      console.error('Custom topic script generation error:', error);
      showAlert(
        'Lỗi AI',
        error.message || 'Không tạo được kịch bản từ chủ đề phát sinh.'
      );
    } finally {
      setIsGeneratingCustomScript(false);
      setGenerationStatus('');
    }
  };

  const toggleTopicSelection = (id) => {
    setGeneratedTopics((topics) =>
      topics.map((t) =>
        t.id === id ? { ...t, selected: !Boolean(t.selected) } : t
      )
    );
  };

  const handleGenerateDetailedScripts = async () => {
    const selected = generatedTopics.filter((t) => t.selected);
    if (selected.length === 0)
      return showAlert('Thông báo', 'Vui lòng chọn ít nhất 1 chủ đề!');

    const { apiKey, provider } = getStoredAIConfig();
    if (!apiKey) {
      setActiveTab('settings');
      return showAlert(
        'Thiếu AI API Key',
        `Vào Cài đặt & Dữ liệu, chọn ${getAiProviderConfig(provider).label}, nhập API Key và model rồi bấm “Lưu cấu hình AI” trước khi tạo.`
      );
    }

    setActiveTab('generate-scripts');
    setIsGeneratingScripts(true);
    setGenerationStatus('Bắt đầu khởi tạo dữ liệu...');

    let generatedCount = 0;
    const errors = [];

    try {
      for (let i = 0; i < selected.length; i += SCRIPT_BATCH_SIZE) {
        const chunk = selected.slice(i, i + SCRIPT_BATCH_SIZE);
        const chunkNumber = Math.floor(i / SCRIPT_BATCH_SIZE) + 1;
        const totalChunks = Math.ceil(selected.length / SCRIPT_BATCH_SIZE);

        setGenerationStatus(
          `Đang xử lý cụm ${chunkNumber}/${totalChunks} (gồm ${chunk.length} kịch bản)...`
        );

        try {
          const newScripts = await generateScriptsBatchFromAI(
            chunk,
            bible,
            scripts,
            scriptTargetDuration
          );

          if (newScripts && newScripts.length > 0) {
            const currentDrafts = Array.isArray(latestDataRef.current.draftScripts)
              ? latestDataRef.current.draftScripts
              : draftScripts;
            generatedCount += newScripts.length;
            await saveDraftScriptsToStorage([...currentDrafts, ...newScripts]);
          } else {
            errors.push(`Cụm ${chunkNumber}: AI không trả về kịch bản.`);
          }
        } catch (error) {
          console.error(`Lỗi tạo cụm kịch bản số ${chunkNumber}:`, error);
          errors.push(`Cụm ${chunkNumber}: ${error.message || 'Lỗi không xác định'}`);
        }
      }
    } finally {
      setIsGeneratingScripts(false);
      setGenerationStatus('');
    }

    if (generatedCount === 0) {
      showAlert(
        'Lỗi',
        errors[0] || 'Có lỗi kết nối khi tạo kịch bản, vui lòng thử lại!'
      );
    } else if (generatedCount < selected.length) {
      showAlert(
        'Thông báo',
        `Đã tạo thành công ${generatedCount}/${selected.length} kịch bản. Một số cụm bị lỗi: ${errors.slice(0, 2).join(' | ')}`
      );
    } else {
      showAlert('Thành công', `Đã tạo thành công ${generatedCount} kịch bản!`);
    }
  };

  const handleSaveDraftToLibrary = (draftId) => {
    const draftToSave = draftScripts.find((d) => d.id === draftId);
    if (draftToSave) {
      const newScript = { ...draftToSave, status: 'approved' };
      saveScriptsToStorage([...scripts, newScript]);

      setDraftScripts((drafts) => {
        const newDrafts = drafts.filter((d) => d.id !== draftId);
        return newDrafts;
      });
      showAlert('Thành công', 'Đã lưu vào thư viện!');
    }
  };

  const handleDeleteScript = (id) => {
    showConfirm('Xác nhận xóa', 'Bạn có chắc muốn xóa kịch bản này?', () => {
      saveScriptsToStorage(scripts.filter((s) => s.id !== id));
    });
  };

  const handleDeleteDraft = (id) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa kịch bản nháp này?',
      () => {
        setDraftScripts((drafts) => {
          const newDrafts = drafts.filter((d) => d.id !== id);
          localStorage.setItem('haichai_drafts', JSON.stringify(newDrafts));
          return newDrafts;
        });
      }
    );
  };

  const handleExportPDF = (script) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showAlert(
        'Lỗi Pop-up',
        'Vui lòng cho phép trình duyệt mở tab mới (Pop-up) để in kịch bản.'
      );
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>${script.title} - Haichai Script</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          h1 { font-size: 24px; border-bottom: 2px solid #1f2937; padding-bottom: 10px; margin-bottom: 24px; text-transform: uppercase; }
          .meta-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e7eb; }
          .meta-item { margin-bottom: 10px; }
          .meta-item:last-child { margin-bottom: 0; }
          .meta-label { font-weight: 700; color: #4b5563; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
          .meta-value { font-size: 15px; color: #111827; }
          .hook-box { background: #eef2ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin-bottom: 30px; }
          h2 { font-size: 18px; margin-top: 30px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;}
          .scene { margin-bottom: 20px; page-break-inside: avoid; }
          .scene-title { font-weight: 700; font-size: 15px; color: #111827; margin-bottom: 6px; }
          .scene-content { margin: 0 0 8px 0; font-size: 15px; }
          .scene-visual { color: #4f46e5; font-style: italic; font-size: 14px; margin: 0; background: #f8fafc; padding: 6px 10px; border-radius: 4px; display: inline-block; }
          .footer-note { margin-top: 50px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          .danger-note { color: #b91c1c; background: #fef2f2; padding: 12px; border-radius: 6px; border: 1px solid #fecaca; }
          @media print {
            body { padding: 0; margin: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <h1>${script.title}</h1>
        
        <div class="meta-box">
          <div class="meta-item">
            <span class="meta-label">Nhóm nội dung</span>
            <span class="meta-value">${script.category}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Thông điệp chính</span>
            <span class="meta-value">${script.mainMessage}</span>
          </div>
        </div>

        <div class="hook-box">
          <span class="meta-label" style="color: #4f46e5;">Hook</span>
          <span class="meta-value" style="font-weight: 500; font-size: 16px;">"${
            script.selectedHook
          }"</span>
        </div>

        <h2>KỊCH BẢN CHI TIẾT (SHOOTING SCRIPT)</h2>
        ${
          script.scenes
            ? script.scenes
                .map(
                  (s) => `
          <div class="scene">
            <div class="scene-title">${s.name}</div>
            <p class="scene-content">${s.content}</p>
            <p class="scene-visual">🎥 Góc máy/Hành động: ${s.visualSuggestion}</p>
          </div>
        `
                )
                .join('\n')
            : '<p>Chưa có phân cảnh.</p>'
        }

        <div class="scene" style="margin-top: 24px; border-top: 1px dashed #ccc; padding-top: 16px;">
          <div class="scene-title">CÂU KẾT</div>
          <p class="scene-content" style="font-weight: 500;">"${
            script.ending
          }"</p>
        </div>

        <h2>HẬU KỲ & ĐĂNG TẢI</h2>
        <div class="meta-item" style="margin-bottom: 16px;">
          <span class="meta-label">Text On Screen (Chữ trên màn hình)</span>
          <span class="meta-value">${script.textOnScreen}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Caption</span>
          <span class="meta-value" style="white-space: pre-wrap;">${
            script.caption
          }</span>
        </div>

        ${
          script.notes
            ? `
        <h2 style="color: #b91c1c; border-bottom-color: #fecaca;">LƯU Ý AN TOÀN</h2>
        <div class="danger-note">${script.notes}</div>
        `
            : ''
        }

        <div class="footer-note">Tạo bởi Haichai Script Studio - Xuất ngày ${new Date().toLocaleDateString(
          'vi-VN'
        )}</div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- SUB-COMPONENTS ---
  const renderModal = () => {
    if (!modal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            {modal.title}
          </h3>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            {modal.message}
          </p>
          <div className="flex justify-end gap-3">
            {modal.type === 'confirm' && (
              <button
                onClick={closeModal}
                className="px-5 py-2 text-[#0d71ba] hover:bg-slate-100 rounded-lg font-medium transition"
              >
                Hủy
              </button>
            )}
            <button
              onClick={() => {
                if (modal.onConfirm) modal.onConfirm();
                closeModal();
              }}
              className="px-5 py-2 bg-[#0d71ba] hover:opacity-90 text-white rounded-lg font-medium transition shadow-sm"
            >
              {modal.type === 'confirm' ? 'Xác nhận' : 'Đóng'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className={`w-64 text-white flex flex-col h-screen fixed top-0 left-0 bg-[#0d2440] z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 flex items-center justify-between">
        {/* Placeholder if image fails to load */}
        <img
          src="https://tascusfood.com/haichailogo.png"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://placehold.co/150x50/0d2440/FFF?text=HAICHAI+STUDIO';
          }}
          alt="Haichai Script Studio"
          className="h-14 md:h-18 w-auto object-contain"
        />
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close menu"
        >
          <IconClose />
        </button>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {[
          { id: 'library', icon: <IconBook />, label: 'Thư viện kịch bản' },
          {
            id: 'generate-topics',
            icon: <IconSparkles />,
            label: 'Tạo chủ đề',
          },
          {
            id: 'generate-scripts',
            icon: <IconFileText />,
            label: 'Kịch bản Draft',
          },
          { id: 'bible', icon: <IconFileText />, label: 'Content Bible' },
          {
            id: 'settings',
            icon: <IconSettings />,
            label: 'Cài đặt & Dữ liệu',
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id
                ? 'bg-[#819396] text-white shadow-md'
                : 'text-slate-400 hover:bg-[#bf0e0e] hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 text-xs text-slate-300 border-t border-slate-700">
        <div className="font-medium text-white/80">MVP v1.1 - Firebase</div>
        <div className="mt-1 truncate">
          {currentUser?.email || 'Chưa đăng nhập'}
        </div>
        <div className="mt-1 text-slate-400">{syncStatus}</div>
      </div>
    </div>
  );

  const renderLibrary = () => {
    const filteredScripts = scripts.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCat === 'All' || s.category === filterCat;
      return matchSearch && matchCat;
    });

    return (
      <>
        <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Thư viện Kịch bản ({scripts.length})
          </h2>
          <button
            className="w-full sm:w-auto bg-[#0d71ba] hover:opacity-90 text-white px-4 py-2.5 rounded-lg shadow-sm text-sm font-semibold transition flex items-center justify-center gap-2"
            onClick={() => {
              setManualScript(EMPTY_MANUAL_SCRIPT);
              setIsAddingManual(true);
            }}
          >
            <IconPlus /> Thêm thủ công
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <IconSearch />
            </div>
            <input
              type="text"
              placeholder="Tìm tên kịch bản, chủ đề..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="All">Tất cả nhóm nội dung</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Version */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Nhóm nội dung</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Trùng lặp</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScripts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">
                    Chưa có kịch bản nào.
                  </td>
                </tr>
              ) : (
                filteredScripts.map((script) => (
                  <tr
                    key={script.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {script.title}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                        {script.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          script.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {script.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          script.duplicateRiskScore > 70
                            ? 'bg-red-100 text-red-700'
                            : script.duplicateRiskScore > 40
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        Score: {script.duplicateRiskScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewingScript(script)}
                        className="text-[#0d71ba] hover:opacity-70 font-semibold text-sm mr-4 transition cursor-pointer"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => handleExportPDF(script)}
                        className="text-[#0d71ba] hover:opacity-70 font-semibold text-sm mr-4 transition cursor-pointer"
                        title="In/Xuất PDF"
                      >
                        In/PDF
                      </button>
                      <button
                        onClick={() => handleDeleteScript(script.id)}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm transition cursor-pointer"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Version */}
        <div className="block md:hidden space-y-4">
          {filteredScripts.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500">
              Chưa có kịch bản nào.
            </div>
          ) : (
            filteredScripts.map((script) => (
              <div
                key={script.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">
                    {script.title}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase ${
                      script.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {script.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                    {script.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      script.duplicateRiskScore > 70
                        ? 'bg-red-100 text-red-700'
                        : script.duplicateRiskScore > 40
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    Risk: {script.duplicateRiskScore}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setViewingScript(script)}
                    className="text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0d71ba] py-2 rounded-lg font-bold text-xs transition"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => handleExportPDF(script)}
                    className="text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0d71ba] py-2 rounded-lg font-bold text-xs transition"
                  >
                    In/PDF
                  </button>
                  <button
                    onClick={() => handleDeleteScript(script.id)}
                    className="text-center bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 py-2 rounded-lg font-bold text-xs transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Modal Thêm Kịch Bản Thủ Công */}
      {isAddingManual && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 z-[60]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">
                  Thêm kịch bản thủ công
                </h3>
                <button
                  onClick={() => setIsAddingManual(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-white flex-1 space-y-6 text-sm">
                {/* Hàng 1: Tiêu đề & Nhóm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Tiêu đề kịch bản (*)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="VD: Sai lầm khi chọn mặt bằng"
                      value={manualScript.title}
                      onChange={(e) =>
                        setManualScript({
                          ...manualScript,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Nhóm nội dung
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={manualScript.category}
                      onChange={(e) =>
                        setManualScript({
                          ...manualScript,
                          category: e.target.value,
                        })
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hàng 2: Chủ đề & Main Message */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Từ khóa Chủ đề
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="VD: Mặt bằng, Quản lý kho..."
                      value={manualScript.topic}
                      onChange={(e) =>
                        setManualScript({
                          ...manualScript,
                          topic: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Thông điệp chính
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Tóm tắt 1 câu thông điệp video"
                      value={manualScript.mainMessage}
                      onChange={(e) =>
                        setManualScript({
                          ...manualScript,
                          mainMessage: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Hook */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-[#0d71ba]">
                    Câu Hook (Mở đầu)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-[#0d71ba] bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[60px]"
                    placeholder="Câu nói đầu tiên thu hút người xem..."
                    value={manualScript.selectedHook}
                    onChange={(e) =>
                      setManualScript({
                        ...manualScript,
                        selectedHook: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Scenes */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Các phân cảnh chi tiết
                    </label>
                    <button
                      onClick={addManualScene}
                      className="text-xs bg-[#0d71ba] text-white hover:opacity-90 px-3 py-1 rounded font-medium flex items-center gap-1 transition"
                    >
                      <IconPlus /> Thêm cảnh
                    </button>
                  </div>

                  <div className="space-y-4">
                    {manualScript.scenes.map((scene, index) => (
                      <div
                        key={index}
                        className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group"
                      >
                        <div className="flex justify-between mb-2">
                          <input
                            type="text"
                            className="font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-700 text-sm w-32 outline-none"
                            value={scene.name}
                            onChange={(e) =>
                              updateManualScene(index, 'name', e.target.value)
                            }
                            placeholder="Tên cảnh..."
                          />
                          {manualScript.scenes.length > 1 && (
                            <button
                              onClick={() => removeManualScene(index)}
                              className="text-[#0d71ba] hover:opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa cảnh"
                            >
                              <IconTrash />
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[60px] text-sm"
                            placeholder="Lời thoại (Voice / Nói trực tiếp)..."
                            value={scene.content}
                            onChange={(e) =>
                              updateManualScene(
                                index,
                                'content',
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-600 italic"
                            placeholder="Góc máy / Hành động..."
                            value={scene.visualSuggestion}
                            onChange={(e) =>
                              updateManualScene(
                                index,
                                'visualSuggestion',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Câu kết */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Câu Kết (Call to Action / Chốt vấn đề)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[60px]"
                    placeholder="Câu nói chốt lại vấn đề cuối video..."
                    value={manualScript.ending}
                    onChange={(e) =>
                      setManualScript({
                        ...manualScript,
                        ending: e.target.value,
                      })
                    }
                  />
                </div>

                <hr className="border-slate-100" />

                {/* Hậu kỳ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Text on screen (Chữ nổi trên màn hình)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      placeholder="Tiêu đề to dán trên video..."
                      value={manualScript.textOnScreen}
                      onChange={(e) =>
                        setManualScript({
                          ...manualScript,
                          textOnScreen: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Caption bài đăng (Kèm Hashtag)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px] bg-white"
                      placeholder="Mô tả dưới bài đăng..."
                      value={manualScript.caption}
                      onChange={(e) =>
                        setManualScript({
                          ...manualScript,
                          caption: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-2">
                      Ghi chú an toàn (Nếu có)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[80px] bg-red-50"
                      placeholder="Các từ ngữ cần tránh, lưu ý đạo cụ..."
                      value={manualScript.notes}
                      onChange={(e) =>
                        setManualScript({
                          ...manualScript,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => setIsAddingManual(false)}
                  className="px-5 py-2 text-[#0d71ba] hover:bg-slate-200 rounded-lg font-medium transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveManualScript}
                  className="px-5 py-2 bg-[#0d71ba] hover:opacity-90 text-white rounded-lg font-medium transition shadow-sm flex items-center gap-2"
                >
                  <IconCheck /> Lưu Kịch Bản
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderTopicGenerator = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Tạo Chủ đề theo Content Bible
      </h2>

      {/* Generate Section */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              Tạo chủ đề mới
            </h3>
            <p className="text-sm text-slate-500">
              Tạo {topicCount} chủ đề theo đúng Content Bible, tự chia tỉ lệ nội dung tương ứng.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tỉ lệ hiện tại: {getTopicDistributionSummary(topicCount)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Định hướng / Từ khóa tập trung (Tùy chọn)
            </label>
            <input
              type="text"
              value={topicFocusPrompt}
              onChange={(e) => setTopicFocusPrompt(e.target.value)}
              disabled={isGeneratingTopics}
              placeholder="Ví dụ: tuyển dụng nhân sự, xử lý phốt, câu chuyện nhượng quyền, tâm lý khách hàng..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Số lượng
              </label>
              <select
                value={topicCount}
                onChange={(e) => setTopicCount(Number(e.target.value))}
                disabled={isGeneratingTopics}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {TOPIC_COUNT_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count} chủ đề
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateTopics}
              disabled={isGeneratingTopics}
              className="px-5 py-2.5 rounded-lg font-bold transition shadow-sm flex items-center justify-center gap-2 bg-[#0d71ba] hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap h-[42px]"
            >
              {isGeneratingTopics ? 'Đang tạo...' : `Tạo chủ đề`}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Real-life Topic Section */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
        <div className="flex justify-between items-start gap-6 mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              Tạo 1 kịch bản từ chủ đề phát sinh
            </h3>
            <p className="text-sm text-slate-500">
              Dùng khi vừa có tình huống thực tế, sự kiện ở cửa hàng, câu chuyện đi thị trường hoặc insight mới. AI vẫn bám Content Bible và tránh trùng thư viện cũ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Nhóm nội dung
            </label>
            <select
              value={customTopicCategory}
              onChange={(e) => setCustomTopicCategory(e.target.value)}
              disabled={isGeneratingCustomScript}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Độ dài kịch bản
            </label>
            <select
              value={scriptTargetDuration}
              onChange={(e) => setScriptTargetDuration(e.target.value)}
              disabled={isGeneratingCustomScript}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="30-45s">Ngắn (30–45s)</option>
              <option value="60-75s">Trung bình (60–75s)</option>
              <option value="90-120s">Dài (90–120s)</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Chủ đề phát sinh thực tế
            </label>
            <textarea
              value={customTopicText}
              onChange={(e) => setCustomTopicText(e.target.value)}
              disabled={isGeneratingCustomScript}
              rows={2}
              placeholder="Ví dụ: Hôm nay đi khảo sát mặt bằng VinWestPoint, phát hiện khách hỏi nhiều về giấy tờ..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none bg-slate-50"
            />
          </div>

          <button
            onClick={handleGenerateCustomTopicScript}
            disabled={isGeneratingCustomScript || !customTopicText.trim()}
            className={`w-full lg:col-span-1 px-5 py-2.5 rounded-lg font-bold text-sm h-[42px] transition shadow-sm ${
              isGeneratingCustomScript || !customTopicText.trim()
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#0d71ba] hover:opacity-90 text-white'
            }`}
          >
            {isGeneratingCustomScript ? 'Đang tạo...' : 'Tạo kịch bản phát sinh'}
          </button>
        </div>
      </div>

      {generatedTopics.length > 0 && (
        <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-indigo-50 p-3.5 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center text-sm">
            <span className="font-bold text-indigo-800 text-center sm:text-left">
              Đã chọn: {generatedTopics.filter((t) => t.selected).length} chủ đề
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Độ dài:</span>
                <select
                  value={scriptTargetDuration}
                  onChange={(e) => setScriptTargetDuration(e.target.value)}
                  disabled={isGeneratingScripts}
                  className="bg-transparent border-none text-xs font-semibold focus:ring-0 focus:outline-none text-slate-700 cursor-pointer"
                >
                  <option value="30-45s">Ngắn (30–45s)</option>
                  <option value="60-75s">Trung bình (60–75s)</option>
                  <option value="90-120s">Dài (90–120s)</option>
                </select>
              </div>
              <button
                onClick={handleGenerateDetailedScripts}
                disabled={isGeneratingScripts}
                className="bg-[#0d71ba] text-white px-4 py-2.5 rounded-lg hover:opacity-90 font-bold text-sm shadow-sm transition disabled:opacity-50"
              >
                Tạo kịch bản cho chủ đề đã chọn →
              </button>
            </div>
          </div>

          {/* Desktop Version */}
          <div className="hidden md:block max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">Chọn</th>
                  <th className="px-4 py-3">Nhóm nội dung</th>
                  <th className="px-4 py-3">Chủ đề & Góc nhìn</th>
                  <th className="px-4 py-3 w-24">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedTopics.map((topic) => (
                  <tr
                    key={topic.id}
                    className={`hover:bg-indigo-50/70 cursor-pointer transition-colors ${
                      topic.selected ? 'bg-indigo-50/50' : ''
                    }`}
                    onClick={() => toggleTopicSelection(topic.id)}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(topic.selected)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleTopicSelection(topic.id);
                        }}
                        className="w-4 h-4 text-[#0d71ba] rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                        {topic.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900 text-sm">
                        {topic.topicName}
                      </p>
                      <p className="text-slate-500 mt-1 line-clamp-2 text-xs leading-relaxed">
                        {topic.angle}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          topic.duplicateRiskScore > 70
                            ? 'bg-red-100 text-red-700'
                            : topic.duplicateRiskScore > 40
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {topic.duplicateRiskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Version */}
          <div className="block md:hidden max-h-[500px] overflow-y-auto p-3 space-y-3 bg-slate-50">
            {generatedTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => toggleTopicSelection(topic.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                  topic.selected
                    ? 'bg-indigo-50/90 border-indigo-300 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={Boolean(topic.selected)}
                    readOnly
                    className="w-5 h-5 text-[#0d71ba] rounded border-slate-300 focus:ring-indigo-500 pointer-events-none"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {topic.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        topic.duplicateRiskScore > 70
                          ? 'bg-red-100 text-red-700'
                          : topic.duplicateRiskScore > 40
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      Risk: {topic.duplicateRiskScore}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {topic.topicName}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      {topic.angle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const formatVietnameseDate = (isoString) => {
    if (!isoString) return 'Chưa rõ';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Chưa rõ';
      
      const timeStr = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return `${timeStr} ngày ${dateStr}`;
    } catch (e) {
      return 'Chưa rõ';
    }
  };

  const renderScriptGenerator = () => {
    // Sắp xếp thứ tự đánh số kịch bản cố định theo trình tự thời gian tạo tăng dần (cũ nhất -> mới nhất)
    const chronologicalDrafts = [...draftScripts].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );

    // Sắp xếp danh sách hiển thị theo lựa chọn của người dùng
    const sortedDrafts = [...draftScripts].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return draftSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return (
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Kịch bản Draft chưa lưu
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Danh sách kịch bản nháp do AI tạo hoặc nhập vào, sẵn sàng phê duyệt lưu vào Thư viện.
            </p>
          </div>

          {draftScripts.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>📅</span> Sắp xếp:
              </span>
              <select
                value={draftSortOrder}
                onChange={(e) => setDraftSortOrder(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
              </select>
            </div>
          )}
        </div>

        {draftScripts.length === 0 && !isGeneratingScripts ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200 text-slate-500">
            Không có kịch bản Draft nào. Hãy sang tab "Tạo chủ đề" để chọn và tạo.
          </div>
        ) : (
          <div className="space-y-3">
            {draftScripts.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex items-center gap-2 mb-2">
                <span className="text-sm">💡</span>
                <span>Bấm trực tiếp vào dòng kịch bản nháp để mở popup xem chi tiết đầy đủ phân cảnh và tải/in PDF.</span>
              </div>
            )}
            {sortedDrafts.map((script) => {
              // Tìm số thứ tự kịch bản theo thứ tự thời gian tạo thực tế (đảm bảo số thứ tự cố định bất kể lọc sắp xếp hiển thị)
              const draftNum = chronologicalDrafts.findIndex((d) => d.id === script.id) + 1;
              return (
                <div
                  key={script.id}
                  onClick={() => setViewingScript(script)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#0d71ba]/60 hover:bg-slate-50/50 cursor-pointer transition-all animate-fade-in"
                  title="Click để xem chi tiết kịch bản"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-800 leading-snug">
                      #{draftNum} - {script.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold">
                        {script.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          script.duplicateRiskScore > 70
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : script.duplicateRiskScore > 40
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Risk: {script.duplicateRiskScore}
                      </span>
                      <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                        <span>🕒</span> {formatVietnameseDate(script.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full mt-3 md:mt-0 md:flex md:w-auto md:items-center md:gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveDraftToLibrary(script.id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm h-[42px] cursor-pointer"
                    >
                      <IconCheck /> Duyệt Lưu
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDraft(script.id);
                      }}
                      className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-3 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm h-[42px] cursor-pointer"
                      title="Xóa nháp này"
                    >
                      <IconTrash /> Xóa nháp
                    </button>
                  </div>
                </div>
              );
            })}

            {isGeneratingScripts && (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 border-dashed">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">
                  AI đang xử lý kịch bản dựa trên Content Bible...
                </p>
                <p className="text-sm text-indigo-600 font-medium mt-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                  {generationStatus}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBible = () => (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Content Bible</h2>
        <p className="text-slate-500 text-sm mt-1">
          AI sẽ đọc bộ quy chuẩn này mỗi khi tạo kịch bản để đảm bảo đúng định
          vị thương hiệu Haichai.
        </p>
      </div>
      <textarea
        className="flex-1 w-full p-6 border border-slate-300 rounded-xl shadow-inner focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm resize-none bg-slate-50 text-slate-800 leading-relaxed"
        value={bible}
        onChange={handleBibleChange}
        spellCheck="false"
      />
    </div>
  );

  const renderSettings = () => {
    const providerConfig = getAiProviderConfig(aiProvider);
    const providerModels = providerConfig ? providerConfig.models : [];
    const isCustomModel = !providerModels.includes(aiModel);

    const handleExport = () => {
      const backup = {
        bible,
        scripts,
        draftScripts,
        generatedTopics,
        exportedAt: new Date().toISOString(),
        ownerEmail: currentUser?.email || '',
      };

      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute(
        'download',
        'haichai_script_studio_backup.json'
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    };

    return (
      <div className="animate-fade-in max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Cài đặt & Dữ liệu
        </h2>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h3 className="text-lg font-bold mb-4">Đăng nhập Firebase</h3>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>Tài khoản:</strong>{' '}
              {currentUser?.email || 'Chưa đăng nhập'}
            </p>
            <p>
              <strong>Domain được phép:</strong> @haichai.vn, @starspits.vn, @starspirits.vn
            </p>
            <p>
              <strong>Đồng bộ:</strong> {syncStatus}
            </p>
            {lastSyncedAt && (
              <p>
                <strong>Lần sync gần nhất:</strong>{' '}
                {lastSyncedAt.toLocaleString('vi-VN')}
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="bg-[#0d71ba] text-white px-4 py-2 rounded-lg font-medium text-sm transition hover:opacity-90 shadow-sm"
              >
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={handleSignInWithGoogle}
                className="bg-[#0d71ba] text-white px-4 py-2 rounded-lg font-medium text-sm transition hover:opacity-90 shadow-sm"
              >
                Đăng nhập Google công ty
              </button>
            )}

            <button
              onClick={handleExport}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-sm"
            >
              Export Backup JSON
            </button>
          </div>

          {authError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {authError}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h3 className="text-lg font-bold mb-4">AI Provider & API Key</h3>
          <p className="text-sm text-slate-500 mb-4">
            Chọn nhà cung cấp AI, nhập key và model muốn dùng. Key chỉ lưu trên
            trình duyệt của máy đang dùng, không đẩy key lên Firestore.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chọn provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              >
                {Object.entries(AI_PROVIDERS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chọn model
              </label>
              <select
                value={isCustomModel ? 'custom' : aiModel}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setAiModel('');
                  } else {
                    setAiModel(val);
                  }
                  setAiKeyStatus('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium text-slate-800"
              >
                {providerModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
                <option value="custom">-- Nhập model tùy chỉnh --</option>
              </select>
            </div>
          </div>

          {isCustomModel && (
            <div className="mb-4 animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nhập model tùy chỉnh
              </label>
              <input
                type="text"
                autoComplete="off"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
                placeholder="Nhập chính xác mã model (ví dụ: grok-3-mini-fast...)"
                value={aiModel}
                onChange={(e) => {
                  setAiModel(e.target.value);
                  setAiKeyStatus('');
                }}
              />
            </div>
          )}

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {getAiProviderConfig(aiProvider).keyLabel}
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
            placeholder={getAiProviderConfig(aiProvider).placeholder}
            value={aiApiKey}
            onChange={(e) => {
              setAiApiKey(e.target.value);
              setAiKeyStatus('');
            }}
          />

          <div className="mt-4 mb-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Custom API Base URL (Tùy chọn bên thứ ba / proxy)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
              placeholder="Ví dụ: https://llmgate.app/v1 (Để trống nếu dùng mặc định)"
              value={aiBaseUrl}
              onChange={(e) => {
                setAiBaseUrl(e.target.value);
                setAiKeyStatus('');
              }}
            />
            <p className="text-slate-400 text-xs mt-1">
              Điền URL này nếu bạn dùng proxy trung gian (như LLMGate, One-API) tương thích OpenAI/Grok.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleSaveAiKey}
              className="bg-[#0d71ba] text-white px-4 py-2 rounded-lg font-medium text-sm transition hover:opacity-90 shadow-sm"
            >
              Lưu cấu hình AI
            </button>
            <button
              onClick={handleTestAiKey}
              disabled={isTestingAiKey}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {isTestingAiKey ? 'Đang test...' : 'Test Key & Model'}
            </button>
            <button
              onClick={() => {
                setAiApiKey('');
                setAiBaseUrl('');
                localStorage.removeItem(getAiKeyStorageKey(aiProvider));
                localStorage.removeItem(getAiBaseUrlStorageKey(aiProvider));
                if (aiProvider === 'gemini') localStorage.removeItem('gemini_api_key');
                setAiKeyStatus(`Đã xoá ${getAiProviderConfig(aiProvider).keyLabel} và Custom Base URL trên máy này.`);
              }}
              className="bg-white border border-red-200 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-medium text-sm"
            >
              Xoá Key
            </button>
          </div>

          {aiKeyStatus && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm border ${
                aiKeyStatus.includes('dùng được') ||
                aiKeyStatus.includes('Đã lưu')
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {aiKeyStatus}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4">Dữ liệu đang lưu ở đâu?</h3>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              • <strong>Firestore:</strong> lưu chung Content Bible, thư viện
              kịch bản, draft và danh sách chủ đề đã tạo cho team Haichai.
            </p>
            <p>
              • <strong>Local backup:</strong> vẫn giữ một bản cache trong trình
              duyệt để tránh mất dữ liệu khi mạng lỗi.
            </p>
            <p>
              • <strong>AI API Key:</strong> chỉ lưu trên máy người dùng,
              không sync lên cloud.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderLoginScreen = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="mb-6">
          <img
            src="https://tascusfood.com/haichailogo.png"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://placehold.co/180x60/0d2440/FFF?text=HAICHAI+STUDIO';
            }}
            alt="Haichai Script Studio"
            className="h-16 w-auto object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900">
            Haichai Script Studio
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Đăng nhập bằng Google Workspace công ty để sử dụng thư viện kịch bản
            và đồng bộ Firestore.
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 mb-5">
          Chỉ cho phép email có đuôi <strong>@haichai.vn</strong> hoặc{' '}
          <strong>@starspits.vn</strong> hoặc <strong>@starspirits.vn</strong>.
        </div>

        {authError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-5">
            {authError}
          </div>
        )}

        <button
          onClick={handleSignInWithGoogle}
          className="w-full bg-[#0d71ba] hover:opacity-90 text-white px-5 py-3 rounded-lg font-semibold transition shadow-sm mb-3"
        >
          Đăng nhập bằng Google công ty
        </button>

        <button
          onClick={handleSignInOffline}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-lg font-semibold transition border border-slate-300"
        >
          Sử dụng Ngoại tuyến (Offline Mode)
        </button>
      </div>
      {renderModal()}
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-600">
        Đang kiểm tra đăng nhập Firebase...
      </div>
    );
  }

  if (!currentUser) {
    return renderLoginScreen();
  }

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d2440] text-white fixed top-0 left-0 right-0 z-40 shadow-md h-16">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-lg transition"
          aria-label="Open menu"
        >
          <IconMenu />
        </button>
        <img
          src="https://tascusfood.com/haichailogo.png"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://placehold.co/150x50/0d2440/FFF?text=HAICHAI+STUDIO';
          }}
          alt="Haichai Script Studio"
          className="h-9 w-auto object-contain"
        />
        <div className="w-10"></div> {/* Cân đối cho nút burger bên trái */}
      </header>

      {/* Backdrop cho Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-45 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {renderSidebar()}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 md:ml-64 h-screen overflow-y-auto">
        {activeTab === 'library' && renderLibrary()}
        {activeTab === 'generate-topics' && renderTopicGenerator()}
        {activeTab === 'generate-scripts' && renderScriptGenerator()}
        {activeTab === 'bible' && renderBible()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Global UI Components  */}
      {renderModal()}

      {/* Modal Xem Kịch Bản Toàn Cục */}
      {viewingScript && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 md:p-8 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate mr-3">
                {viewingScript.title}
              </h3>
              <div className="flex gap-2 sm:gap-4 items-center shrink-0">
                <button
                  onClick={() => handleExportPDF(viewingScript)}
                  className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm"
                >
                  <IconPrinter /> <span className="hidden sm:inline">In kịch bản</span>
                </button>
                <button
                  onClick={() => setViewingScript(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-2xl leading-none px-2 py-1 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 text-sm">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">
                    Thông điệp chính
                  </h4>
                  <p className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg italic">
                    {viewingScript.mainMessage}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">
                    Hook Được Chọn
                  </h4>
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                    <p className="text-lg font-medium text-indigo-900">
                      "{viewingScript.selectedHook}"
                    </p>
                    <p className="text-indigo-600 mt-2 text-xs">
                      Lý do: {viewingScript.selectedHookReason}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">
                    Các Cảnh Quay
                  </h4>
                  <div className="space-y-4">
                    {viewingScript.scenes?.map((scene, i) => (
                      <div
                        key={i}
                        className="border-l-2 border-indigo-200 pl-4 py-1"
                      >
                        <p className="font-bold text-slate-700">
                          {scene.name}
                        </p>
                        <p className="text-slate-800 mt-1 whitespace-pre-line">
                          {scene.content}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          🎥 {scene.visualSuggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">
                    Câu Kết
                  </h4>
                  <p className="text-slate-800 font-medium">
                    "{viewingScript.ending}"
                  </p>
                </div>
              </div>
              <div className="space-y-6 bg-slate-50 p-4 rounded-lg border border-slate-100 h-fit">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 uppercase text-xs">
                    Text on Screen
                  </h4>
                  <p className="text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {viewingScript.textOnScreen}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 uppercase text-xs">
                    Caption
                  </h4>
                  <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 whitespace-pre-line">
                    {viewingScript.caption}
                  </p>
                </div>
                {viewingScript.notes && (
                  <div>
                    <h4 className="font-bold text-red-800 mb-1 uppercase text-xs">
                      Checklist An Toàn
                    </h4>
                    <p className="text-red-700 bg-red-50 p-2 rounded border border-red-200">
                      {viewingScript.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles for simple anmations & CSS Reset */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        #root { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; text-align: left !important; }
        body { margin: 0; padding: 0; background-color: #f8fafc; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `,
        }}
      />
    </div>
  );
}