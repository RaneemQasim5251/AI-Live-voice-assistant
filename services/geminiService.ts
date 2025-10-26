import { GoogleGenAI, Chat, Modality, LiveServerMessage, LiveSession } from "@google/genai";
import { SYSTEM_PROMPT, CONFIG } from "../constants";
import { Language } from "../types";
import { decode } from "../utils/audioUtils";

let ai: GoogleGenAI;
try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error) {
    console.error("Failed to initialize GoogleGenAI. Make sure API_KEY is set.", error);
    // Handle the error appropriately, maybe show a message to the user.
}


let chat: Chat | null = null;

export const startChatSession = () => {
    if (!ai) throw new Error("GoogleGenAI not initialized");
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_PROMPT,
        },
    });
};

export const getChatResponseStream = async (message: string) => {
    if (!chat) {
        startChatSession();
    }
    if (!chat) throw new Error("Chat session not initialized");

    return chat.sendMessageStream({ message });
};

export const getTextToSpeech = async (text: string, language: Language): Promise<string> => {
    if (!ai) throw new Error("GoogleGenAI not initialized");
    
    const voiceName = language === 'ar' ? CONFIG.voices.ar.tts : CONFIG.voices.en.tts;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from TTS API.");
    }
    return base64Audio;
};

export const connectLiveAudio = async (
    onTranscription: (text: string, isFinal: boolean) => void
) => {
    if (!ai) throw new Error("GoogleGenAI not initialized");
    
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Live session opened.'),
            onmessage: (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    const { text, isFinal } = message.serverContent.inputTranscription;
                    onTranscription(text, isFinal || false);
                }
            },
            onerror: (e: ErrorEvent) => console.error('Live session error:', e),
            onclose: (e: CloseEvent) => console.log('Live session closed.'),
        },
        config: {
            inputAudioTranscription: {},
        },
    });
    return sessionPromise;
};

export const startLiveConversation = async (
    language: Language,
    onUserTranscription: (text: string, isFinal: boolean) => void,
    onAssistantTranscription: (text: string) => void,
    onAssistantAudio: (audioData: Uint8Array) => void,
    onTurnComplete: () => void,
    onInterrupted: () => void,
) => {
    if (!ai) throw new Error("GoogleGenAI not initialized");

    const voiceName = language === 'ar' ? CONFIG.voices.ar.tts : CONFIG.voices.en.tts;

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Live conversation session opened.'),
            onmessage: (message: LiveServerMessage) => {
                const inputTrans = message.serverContent?.inputTranscription;
                if (inputTrans) {
                    onUserTranscription(inputTrans.text, inputTrans.isFinal || false);
                }

                const outputTrans = message.serverContent?.outputTranscription;
                if (outputTrans) {
                    onAssistantTranscription(outputTrans.text);
                }

                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio) {
                    onAssistantAudio(decode(base64Audio));
                }

                if (message.serverContent?.turnComplete) {
                    onTurnComplete();
                }

                if (message.serverContent?.interrupted) {
                    onInterrupted();
                }
            },
            onerror: (e: ErrorEvent) => console.error('Live conversation error:', e),
            onclose: (e: CloseEvent) => console.log('Live conversation closed.'),
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
            },
            systemInstruction: SYSTEM_PROMPT,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
    });
    return sessionPromise;
};

export type { LiveSession };