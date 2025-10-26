import React, { useState, useEffect } from 'react';
import { Mode, Language, Theme } from '../types';
import { CONFIG, UI_TEXT } from '../constants';
import TextChat from './TextChat';
import LiveChat from './LiveChat';
import { MoonIcon, SunIcon, CloseIcon, RobotIcon } from './Icons';

interface ChatWidgetProps {
  closeWidget: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ closeWidget, theme, toggleTheme }) => {
  const [mode, setMode] = useState<Mode>('text');
  const [language, setLanguage] = useState<Language>(CONFIG.routing.fallbackLanguage);

  useEffect(() => {
    // Basic language detection
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'ar') {
      setLanguage('ar');
    }
  }, []);

  const T = UI_TEXT[language];
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      dir={direction}
      className={`fixed bottom-20 right-5 w-[90vw] max-w-md h-[70vh] max-h-[600px] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-transform transform origin-bottom-right font-sans ${language === 'ar' ? 'font-arabic' : 'font-sans'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className={`flex items-center space-x-3 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <RobotIcon className={`h-8 w-8 text-brand-primary dark:text-white ${language === 'ar' ? 'transform scale-x-[-1]' : ''}`} />
            <h2 className={`text-lg font-bold text-gray-800 dark:text-white ${language === 'ar' ? 'font-arabic' : 'font-sans'}`}>{T.companyName}</h2>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={toggleTheme} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <select
                value={language}
                // FIX: Cast the event target value to Language to match the state setter's expected type.
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-gray-600 dark:text-gray-300 font-semibold rounded-md p-1 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
                <option value="en">EN</option>
                <option value="ar">AR</option>
            </select>
            <button onClick={closeWidget} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <CloseIcon />
            </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-900 flex-shrink-0">
        <button
          onClick={() => setMode('text')}
          className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'text' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          {T.textChat}
        </button>
        <button
          onClick={() => setMode('liveChat')}
          className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'liveChat' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          {T.liveChat}
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-hidden">
        {mode === 'text' && <TextChat language={language} />}
        {mode === 'liveChat' && <LiveChat language={language} />}
      </div>
    </div>
  );
};