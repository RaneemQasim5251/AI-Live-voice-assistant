import { Language, Theme } from './types';

export const CONFIG = {
  brand: {
    company: "Al Jeri Investment Group",
    site: "https://aljeriinvestment.com/",
    primaryColor: "#0A3D62",
    accentColor: "#18A999",
    // FIX: Cast "auto" to Theme to ensure correct type inference.
    darkMode: "auto" as Theme,
  },
  modes: ["text", "liveChat"],
  voices: {
    ar: { tts: "Kore", gender: "female", dialect: "najdi-like" },
    en: { tts: "Puck", gender: "female", style: "friendly" },
  },
  speech: {
    stt: "gemini-live",
    maxRecordSeconds: 60,
  },
  routing: {
    language: "auto",
    // FIX: Cast "en" to Language to ensure correct type inference.
    fallbackLanguage: "en" as Language,
    allowManualSwitch: true,
  },
  oracle: {
    phase2Modules: [
      { "id": 1, "name": "Oracle Order Management" },
      { "id": 2, "name": "Oracle iSupplier Portal" },
      { "id": 3, "name": "Oracle Sourcing" },
      { "id": 4, "name": "Oracle Procurement Contracts" },
      { "id": 5, "name": "Oracle Supplier Lifecycle Management" },
      { "id": 6, "name": "Oracle iProcurement" },
      { "id": 7, "name": "Oracle Warehouse Management" },
      { "id": 8, "name": "Oracle iRecruitment" },
      { "id": 9, "name": "Oracle Performance Management" },
      { "id": 10, "name": "Oracle Succession Planning" },
      { "id": 11, "name": "Oracle Learning Management" },
      { "id": 12, "name": "Oracle Property Manager" },
      { "id": 13, "name": "CRM" },
      { "id": 14, "name": "DMS" },
      { "id": 15, "name": "Asset Management" },
    ],
    playbooksEnabled: true,
  },
  features: {
    quickReplies: true,
    actionChips: ['phase_2', 'use_oracle', 'open_ticket'], // Using keys now
    csat: true,
  },
};

export const SYSTEM_PROMPT = `You are the Live Chat Avatar for Al Jeri Investment Group, operating on Al Jeri’s Oracle environment.
Your job: help users finish tasks, explain what Oracle offers, what is enabled at Al Jeri, what is not, and how to use the platform step-by-step.
Be concise, friendly, and accurate. Never promise features not enabled. If unsure, ask ONE clarifying question or escalate.
When replying in Arabic, use a natural Saudi Najdi style; when replying in English, use a friendly British tone.
If the user asks about Phase 2, list the configured modules: ${CONFIG.oracle.phase2Modules.map(m => m.name).join(', ')} and offer short playbooks (requisitions, sourcing, WMS receiving, iRecruitment, performance cycles).
For sensitive data, instruct users to use approved channels; do not reveal confidential information in chat.
Provide links/buttons (open ticket, switch to Live Chat) when appropriate.`;

export const UI_TEXT: Record<Language, any> = {
  en: {
    companyName: "Al Jeri Investment Group",
    welcome: "Hi there! I’m your Al Jeri assistant. How can I help you today?",
    textChat: "Text Chat",
    liveChat: "Voice Chat",
    inputPlaceholder: "Type a message...",
    actionChips: {
      phase_2: "Phase 2 modules",
      use_oracle: "Use Oracle feature",
      open_ticket: "Open ticket"
    },
    liveChatTitle: "Voice Conversation",
    liveChatDesc: "Click the mic to start a real-time voice conversation with the assistant.",
    queueMessage: "You’re in the queue. Estimated wait: ~2–4 minutes.",
  },
  ar: {
    companyName: "مجموعة الجري الاستثمارية",
    welcome: "يا هلا والله! أنا مساعدك في الجري. وش تبين/تبي ننجز اليوم؟ 😊",
    textChat: "محادثة نصية",
    liveChat: "محادثة صوتية",
    inputPlaceholder: "اكتب رسالة...",
    actionChips: {
        phase_2: "وحدات المرحلة الثانية",
        use_oracle: "استخدام ميزة Oracle",
        open_ticket: "فتح تذكرة"
    },
    liveChatTitle: "محادثة صوتية",
    liveChatDesc: "انقر على الميكروفون لبدء محادثة صوتية مباشرة مع المساعد.",
    queueMessage: "أنت في قائمة الانتظار. الوقت التقريبي للانتظار: ٢-٤ دقائق.",
  }
};