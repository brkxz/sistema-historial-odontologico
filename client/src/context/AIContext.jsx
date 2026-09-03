// ============================================================
// AIContext - Provider global para el Asistente IA
// Maneja estado del chat, configuración y contexto
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const pendingActionRef = useRef(null);

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
      const recentMessages = allMessages.slice(-10);

      const result = await sendMessage(recentMessages, {
        currentPage: currentPage || context.currentPage,
        currentPatient: currentPatient || context.currentPatient,
        doctorName: context.doctorName,
      });

      // result = { text, action }
      const assistantMsg = { role: 'assistant', content: result.text, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);

      // Ejecutar acción si la IA lo indicó
      if (result.action?.type === 'navigate') {
        setTimeout(() => navigate(result.action.route), 400);
      }

      return result.text;
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
  }, [messages, currentPage, currentPatient, navigate]);

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
   * Agregar mensajes locales sin llamar a la IA (para comandos de navegación)
   */
  const addLocalMessages = useCallback((userText, assistantText) => {
    const ts = Date.now();
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userText, timestamp: ts },
      { role: 'assistant', content: assistantText, timestamp: ts + 1 },
    ]);
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
      addLocalMessages,
      
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
