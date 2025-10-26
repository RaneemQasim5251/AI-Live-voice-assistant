
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Language } from '../types';
import { getChatResponseStream, getTextToSpeech, connectLiveAudio } from '../services/geminiService';
import { UI_TEXT, CONFIG } from '../constants';
import { MicIcon, SendIcon, PlayIcon, StopIcon } from './Icons';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';
import { LiveSession } from '@google/genai';

// Helper component for a single message bubble
const MessageBubble: React.FC<{ message: Message; onPlayAudio: (messageId: string, text: string) => void }> = ({ message, onPlayAudio }) => {
    const isUser = message.sender === 'user';
    const direction = isUser ? 'justify-end' : 'justify-start';
    const colors = isUser
        ? 'bg-brand-primary text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';

    return (
        <div className={`flex ${direction} mb-3`}>
            <div className={`p-3 rounded-2xl max-w-xs md:max-w-md ${colors} flex items-center space-x-2`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.sender === 'assistant' && message.text && (
                     <button onClick={() => onPlayAudio(message.id, message.text)} className="flex-shrink-0 text-brand-accent dark:text-teal-400 hover:text-opacity-80">
                         {message.isPlaying ? <StopIcon /> : <PlayIcon />}
                    </button>
                )}
            </div>
        </div>
    );
};


const TextChat: React.FC<{ language: Language }> = ({ language }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const liveSessionRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const T = UI_TEXT[language];

  useEffect(() => {
    setMessages([{ id: uuidv4(), text: T.welcome, sender: 'assistant', timestamp: new Date() }]);
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [language, T.welcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setMessages(prev => prev.map(m => ({ ...m, isPlaying: false })));
  }, []);

  const playAudio = useCallback(async (messageId: string, text: string) => {
    stopAudio();
    const currentMessage = messages.find(m => m.id === messageId);
    if (currentMessage?.isPlaying) return;

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPlaying: true } : m));
    
    try {
        const base64Audio = await getTextToSpeech(text, language);
        const audioData = decode(base64Audio);
        if (!audioContextRef.current) return;
        
        const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPlaying: false } : m));
            audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
    } catch (error) {
        console.error("Error playing audio:", error);
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPlaying: false } : m));
    }
  }, [language, stopAudio, messages]);
  
  const handleSend = async () => {
    if (input.trim() === '') return;
    const userMessage: Message = { id: uuidv4(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const assistantMessageId = uuidv4();
    setMessages(prev => [...prev, { id: assistantMessageId, text: '', sender: 'assistant', timestamp: new Date() }]);

    try {
        const stream = await getChatResponseStream(input);
        let fullResponse = '';
        for await (const chunk of stream) {
            fullResponse += chunk.text;
            setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, text: fullResponse } : msg));
        }
    } catch (error) {
        console.error("Error getting chat response:", error);
        setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, text: "Sorry, I encountered an error." } : msg));
    } finally {
        setIsTyping(false);
    }
  };

  const handleMicToggle = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.then(session => session.close());
        liveSessionRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setIsRecording(true);
        
        const sttAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = sttAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = sttAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = scriptProcessor;

        liveSessionRef.current = connectLiveAudio((text, isFinal) => {
            setInput(prev => prev + text);
        });
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
            };
            if(liveSessionRef.current) {
              liveSessionRef.current.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            }
        };

        source.connect(scriptProcessor);
        scriptProcessor.connect(sttAudioContext.destination);

      } catch (error) {
        console.error("Microphone access denied:", error);
        alert("Microphone access is required for speech-to-text.");
      }
    }
  }, [isRecording]);


  return (
    <div className="h-full flex flex-col p-4 bg-white dark:bg-gray-800">
      <div className="flex-grow overflow-y-auto pr-2">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} onPlayAudio={playAudio} />)}
        {isTyping && (
           <div className="flex justify-start mb-3">
               <div className="p-3 rounded-2xl bg-gray-200 dark:bg-gray-700">
                   <div className="flex items-center space-x-1">
                       <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                   </div>
               </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 pt-4">
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder={T.inputPlaceholder}
            rows={1}
            className="flex-grow bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 resize-none max-h-24"
          />
          <button onClick={handleMicToggle} className="p-2 text-gray-500 dark:text-gray-400 hover:text-brand-accent dark:hover:text-teal-400">
            <MicIcon isRecording={isRecording} />
          </button>
          <button onClick={handleSend} className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent disabled:opacity-50" disabled={!input.trim() || isTyping}>
            <SendIcon />
          </button>
        </div>
        <div className="flex space-x-2 mt-2">
            {CONFIG.features.actionChips.map(chip => (
                <button 
                  key={chip} 
                  onClick={() => setInput(chip)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                    {chip}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TextChat;
