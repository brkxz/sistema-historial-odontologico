// ============================================================
// AIContext - Provider global para el Asistente IA
// Maneja estado del chat, configuración y contexto
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { sendMessage, parseVoiceCommand, checkAIStatus } from '../services/aiService';

const AIContext = createContext(null);

export function AIProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  // Verificar estado de la IA al cargar
  useEffect(() => {
    checkAIStatus().then(configured => setApiKeyConfigured(configured));
  }, []);

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
        errorMsg = '⚙️ El servicio de IA no está configurado. Contacta al administrador del sistema.';
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
