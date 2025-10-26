import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Language } from '../types';
import { startLiveConversation, LiveSession } from '../services/geminiService';
import { decodeAudioData, encode } from '../utils/audioUtils';
import { MicIcon } from './Icons';

const TranscriptBubble: React.FC<{ speaker: string; text: string; language: Language; isFinal: boolean; }> = ({ speaker, text, language, isFinal }) => {
    const isUser = speaker === 'You';
    const align = isUser ? (language === 'ar' ? 'text-right' : 'text-left') : (language === 'ar' ? 'text-right' : 'text-left');
    const textColor = isUser ? 'text-brand-primary dark:text-brand-accent' : 'text-gray-900 dark:text-gray-100';
    const opacity = isFinal ? 'opacity-100' : 'opacity-60';
    
    return (
        <div className={`py-2 ${align} ${opacity} transition-opacity`}>
            <p className="font-bold text-sm text-gray-500 dark:text-gray-400">{speaker}</p>
            <p className={textColor}>{text || "..."}</p>
        </div>
    );
};

const LiveChat: React.FC<{ language: Language }> = ({ language }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [statusText, setStatusText] = useState("Click the mic to start the conversation");
    const [conversation, setConversation] = useState<{ speaker: string, text: string }[]>([]);
    const [currentUserTranscript, setCurrentUserTranscript] = useState("");
    const [currentAssistantTranscript, setCurrentAssistantTranscript] = useState("");

    const liveSessionRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    
    const currentUserTranscriptRef = useRef("");
    const currentAssistantTranscriptRef = useRef("");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, currentUserTranscript, currentAssistantTranscript]);

    const stopAllPlayback = useCallback(() => {
        audioSourcesRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Ignore errors if source already stopped
            }
        });
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const onAssistantAudio = useCallback(async (audioData: Uint8Array) => {
        if (!outputAudioContextRef.current) return;
        
        try {
            const audioBuffer = await decodeAudioData(audioData, outputAudioContextRef.current, 24000, 1);
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContextRef.current.destination);

            const currentTime = outputAudioContextRef.current.currentTime;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);

            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            
            source.onended = () => {
                audioSourcesRef.current.delete(source);
            };
            audioSourcesRef.current.add(source);

        } catch (error) {
            console.error("Error playing assistant audio:", error);
        }
    }, []);

    const handleStopSession = useCallback(() => {
        setIsSessionActive(false);
        setStatusText("Session ended. Click the mic to talk again.");
        
        liveSessionRef.current?.then(session => session.close());
        liveSessionRef.current = null;
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
        }
        inputAudioContextRef.current = null;
        
        stopAllPlayback();
        
        setConversation([]);
        setCurrentUserTranscript("");
        setCurrentAssistantTranscript("");
        currentUserTranscriptRef.current = "";
        currentAssistantTranscriptRef.current = "";
    }, [stopAllPlayback]);
    
    const handleStartSession = useCallback(async () => {
        // Cleanup previous session just in case
        handleStopSession();

        setIsSessionActive(true);
        setStatusText("Connecting...");
        
        if (!outputAudioContextRef.current) {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            liveSessionRef.current = startLiveConversation(
                language,
                (text) => { // User Transcription
                    currentUserTranscriptRef.current += text;
                    setCurrentUserTranscript(currentUserTranscriptRef.current);
                    setStatusText("Listening...");
                },
                (text) => { // Assistant Transcription
                    currentAssistantTranscriptRef.current += text;
                    setCurrentAssistantTranscript(currentAssistantTranscriptRef.current);
                    setStatusText("Assistant is speaking...");
                },
                onAssistantAudio,
                () => { // Turn Complete
                    if (currentUserTranscriptRef.current || currentAssistantTranscriptRef.current) {
                        setConversation(prev => [
                            ...prev,
                            { speaker: 'You', text: currentUserTranscriptRef.current },
                            { speaker: 'Assistant', text: currentAssistantTranscriptRef.current }
                        ]);
                    }
                    currentUserTranscriptRef.current = "";
                    currentAssistantTranscriptRef.current = "";
                    setCurrentUserTranscript("");
                    setCurrentAssistantTranscript("");
                    setStatusText("Connected. Speak now.");
                },
                stopAllPlayback // Interrupted
            );

            await liveSessionRef.current;
            setStatusText("Connected. Speak now.");

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                liveSessionRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);

        } catch (error) {
            console.error("Microphone access denied or error starting session:", error);
            setStatusText("Microphone access denied.");
            setIsSessionActive(false);
        }
    }, [language, onAssistantAudio, stopAllPlayback, handleStopSession]);

    useEffect(() => {
        return () => {
            handleStopSession();
        };
    }, [handleStopSession]);

    return (
        <div className="h-full flex flex-col items-center justify-between p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            <div className="w-full flex-grow overflow-y-auto pr-2 mb-4">
                {conversation.map((entry, index) => (
                    <TranscriptBubble key={index} speaker={entry.speaker} text={entry.text} language={language} isFinal={true} />
                ))}
                {currentUserTranscript && <TranscriptBubble speaker="You" text={currentUserTranscript} language={language} isFinal={false} />}
                {currentAssistantTranscript && <TranscriptBubble speaker="Assistant" text={currentAssistantTranscript} language={language} isFinal={false} />}
                 <div ref={messagesEndRef} />
            </div>

            <div className="w-full flex-shrink-0 text-center">
                <p className="h-6 text-sm text-gray-500 dark:text-gray-400 mb-4">{statusText}</p>
                <button
                    onClick={isSessionActive ? handleStopSession : handleStartSession}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 text-white shadow-lg ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-primary hover:bg-brand-accent'}`}
                    aria-label={isSessionActive ? 'Stop conversation' : 'Start conversation'}
                >
                    <MicIcon isRecording={isSessionActive} />
                     {isSessionActive && (
                        <span className="absolute h-full w-full rounded-full bg-red-500 animate-ping opacity-75"></span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LiveChat;
