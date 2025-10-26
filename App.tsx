
import React, { useState, useEffect } from 'react';
import { ChatWidget } from './components/ChatWidget';
import { CONFIG } from './constants';
import { ChatIcon, CloseIcon } from './components/Icons';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(CONFIG.brand.darkMode);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center font-sans text-gray-800 dark:text-gray-200">
        <div className="text-center">
            <img src="https://aljeriinvestment.com/wp-content/uploads/2021/07/cropped-Aljeri-Holding-FA-E-C-01.png" alt="Al Jeri Investment Group" className="mx-auto mb-4 h-24"/>
            <h1 className="text-4xl font-bold">Al Jeri Investment Group</h1>
            <p className="mt-2 text-lg">Click the chat icon on the bottom right to talk to our Oracle Assistant.</p>
        </div>
      </div>

      {/* Chat Widget Launcher */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-brand-primary text-white p-4 rounded-full shadow-lg hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50 transition-transform transform hover:scale-110"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>

      {/* Chat Widget Panel */}
      {isOpen && <ChatWidget closeWidget={() => setIsOpen(false)} theme={theme} toggleTheme={toggleTheme} />}
    </div>
  );
};

export default App;
