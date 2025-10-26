
import { Language } from './types';

export const CONFIG = {
  brand: {
    company: "Al Jeri Investment Group",
    site: "https://aljeriinvestment.com/",
    primaryColor: "#0A3D62",
    accentColor: "#18A999",
    darkMode: "auto",
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
    fallbackLanguage: "en",
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
    actionChips: ["Phase 2 modules", "Use Oracle feature", "Open ticket"],
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
    welcome: "Hi there! I’m your Al Jeri assistant. How can I help you today?",
    textChat: "Text Chat",
    liveChat: "Live Chat",
    inputPlaceholder: "Type a message...",
    liveChatTitle: "Talk to a Human",
    liveChatDesc: "Our agents are available to help you. Please fill out the form below to start.",
    nameLabel: "Name",
    emailLabel: "Email / Employee ID",
    reasonLabel: "Reason for chat",
    startChatButton: "Start Live Chat",
    queueMessage: "You’re in the queue. Estimated wait: ~2–4 minutes.",
  },
  ar: {
    welcome: "يا هلا والله! أنا مساعدك في الجري. وش تبين/تبي ننجز اليوم؟ 😊",
    textChat: "محادثة نصية",
    liveChat: "محادثة مباشرة",
    inputPlaceholder: "اكتب رسالة...",
    liveChatTitle: "تحدث مع موظف",
    liveChatDesc: "موظفينا متاحين لمساعدتك. يرجى تعبئة النموذج أدناه للبدء.",
    nameLabel: "الاسم",
    emailLabel: "البريد الإلكتروني / رقم الموظف",
    reasonLabel: "سبب المحادثة",
    startChatButton: "ابدأ المحادثة المباشرة",
    queueMessage: "أنت في قائمة الانتظار. الوقت التقريبي للانتظار: ٢-٤ دقائق.",
  }
};
