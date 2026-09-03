// ============================================================
// AIContext - Provider global para el Asistente IA
// Maneja estado del chat, configuración y contexto
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import { sendMessage, parseVoiceCommand } from '../services/aiService';

const AIContext = createContext(null);

export function AIProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(
    !!(localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY)
  );

  /**
   * Enviar un mensaje al asistente IA
   */
  const sendChat = useCallback(async (userMessage, context = {}) => {
    const newUserMsg = { role: 'user', content: userMessage, timestamp: Date.now() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsThinking(true);

    try {
      const allMessages = [...messages, newUserMsg];
      // Solo enviar las últimas 10 mensajes para mantener contexto manejable
      const recentMessages = allMessages.slice(-10);

      const response = await sendMessage(recentMessages, {
        currentPage: currentPage || context.currentPage,
        currentPatient: currentPatient || context.currentPatient,
        doctorName: context.doctorName,
      });

      const assistantMsg = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      return response;
    } catch (error) {
      let errorMsg;
      if (error.message === 'API_KEY_MISSING') {
        errorMsg = '⚙️ Necesitas configurar tu API Key de Google Gemini para usar el asistente IA. Haz clic en el ícono ⚙️ arriba para configurarla.';
      } else if (error.message === 'API_KEY_INVALID') {
        errorMsg = '❌ La API Key no es válida. Verifica que sea correcta en la configuración.';
      } else {
        errorMsg = `⚠️ Error: ${error.message}. Intenta de nuevo.`;
      }
      
      const errorResponse = { role: 'assistant', content: errorMsg, timestamp: Date.now(), isError: true };
      setMessages(prev => [...prev, errorResponse]);
      return errorMsg;
    } finally {
      setIsThinking(false);
    }
  }, [messages, currentPage, currentPatient]);

  /**
   * Procesar un comando de voz
   */
  const processVoiceCommand = useCallback((transcript) => {
    return parseVoiceCommand(transcript);
  }, []);

  /**
   * Limpiar historial de chat
   */
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Toggle panel abierto/cerrado
   */
  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Configurar API key
   */
  const setApiKey = useCallback((key) => {
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      setApiKeyConfigured(true);
    } else {
      localStorage.removeItem('gemini_api_key');
      setApiKeyConfigured(false);
    }
  }, []);

  return (
    <AIContext.Provider value={{
      // Estado del panel
      isOpen,
      setIsOpen,
      togglePanel,
      
      // Chat
      messages,
      isThinking,
      sendChat,
      clearChat,
      
      // Contexto
      currentPatient,
      setCurrentPatient,
      currentPage,
      setCurrentPage,
      
      // TTS
      ttsEnabled,
      setTtsEnabled,
      
      // Config
      apiKeyConfigured,
      setApiKey,
      
      // Voz
      processVoiceCommand,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

export default AIContext;
