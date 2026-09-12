import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchHistoryService } from '../../firebase/service';
import { useTranslation } from 'react-i18next';

const SearchBar = ({ placeholder, onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await searchHistoryService.getSearchHistory();
        setSuggestions(history.map(item => item.query));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    };
    loadHistory();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchHistoryService.addSearch(query.trim());
      setSuggestions(prev => {
        const filtered = prev.filter(s => s !== query.trim());
        return [query.trim(), ...filtered].slice(0, 20);
      });
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    }
  };

  const handleClearHistory = async () => {
    try {
      await searchHistoryService.clearSearchHistory();
      setSuggestions([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError(t('voice_search_not_supported'));
      setTimeout(() => setVoiceError(''), 3000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = t('switch_to_arabic') === 'التغيير إلى العربية' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      if (onSearch) {
        onSearch(transcript);
      } else {
        navigate(`/search?q=${encodeURIComponent(transcript)}`);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceError(t('voice_search_error'));
      setTimeout(() => setVoiceError(''), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || t('search_placeholder')}
          className="w-full px-4 py-3 pr-10 pl-20 border border-black rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
        />
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={isListening ? stopVoiceSearch : startVoiceSearch}
            className={`p-2 rounded-full transition-colors ${
              isListening ? 'text-red-600 bg-red-50' : 'text-black hover:text-gray-600'
            }`}
            aria-label={t('voice_search')}
            title={t('voice_search')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button
            type="submit"
            className="p-2 text-black hover:text-gray-600"
            aria-label={t('search_placeholder')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 text-sm font-medium">{t('voice_search_listening')}</p>
        </div>
      )}

      {voiceError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-gray-100 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600 text-sm">{voiceError}</p>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{t('recent_searches')}</span>
            <button
              onClick={handleClearHistory}
              className="text-xs text-red-600 hover:text-red-800"
            >
              {t('clear_search_history')}
            </button>
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-black text-sm border-b border-gray-100 last:border-b-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {showSuggestions && query.trim() && suggestions.length === 0 && !isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-lg shadow-lg z-50 p-4">
          <p className="text-gray-500 text-sm text-center">{t('no_results')}</p>
        </div>
      )}
    </div>
  );
};

export { SearchBar };
