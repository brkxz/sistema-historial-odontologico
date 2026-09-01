// ============================================================
// AIAssistant - Componente Principal del Asistente IA
// Chat flotante con voz bidireccional
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../../context/AIContext';
import { useVoice } from '../../hooks/useVoice';
import { validateApiKey } from '../../services/aiService';
import {
  X, Send, Mic, MicOff, Volume2, VolumeX,
  Settings, Trash2, Sparkles, Bot, ChevronRight
} from 'lucide-react';

const QUICK_PROMPTS = [
  '💊 Receta post-extracción',
  '🦷 Tratamiento para caries profunda',
  '📋 Redactar observaciones clínicas',
  '⚕️ Contraindicaciones amoxicilina',
  '🔍 ¿Cómo registro una atención?',
  '📊 Diferencias entre resinas',
];

export default function AIAssistant() {
  const {
    isOpen, setIsOpen, togglePanel,
    messages, isThinking, sendChat, clearChat,
    currentPatient, ttsEnabled, setTtsEnabled,
    apiKeyConfigured, setApiKey, processVoiceCommand,
  } = useAI();

  const {
    isListening, isSpeaking, interimTranscript, voiceSupported,
    ttsSupported, startListening, stopListening, speak, stopSpeaking,
  } = useVoice();

  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [validatingKey, setValidatingKey] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  // Focus input cuando se abre el panel
  useEffect(() => {
    if (isOpen && !showSettings && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen, showSettings]);

  /**
   * Enviar mensaje
   */
  const handleSend = useCallback(async (text) => {
    const msg = text || inputText.trim();
    if (!msg || isThinking) return;

    setInputText('');

    // Procesar como comando de voz
    const command = processVoiceCommand(msg);

    if (command.type === 'navigate') {
      navigate(command.route);
      await sendChat(`Quiero ir a ${command.label}`);
      return;
    }

    if (command.type === 'search_dni') {
      navigate(`/buscar`);
      await sendChat(`Buscar paciente con DNI ${command.dni}`);
      return;
    }

    // Chat normal con IA
    const response = await sendChat(msg);

    // TTS: hablar la respuesta si está activado
    if (ttsEnabled && response && !response.startsWith('⚙️') && !response.startsWith('❌')) {
      speak(response, { rate: 1.05 });
    }
  }, [inputText, isThinking, processVoiceCommand, sendChat, navigate, ttsEnabled, speak]);

  /**
   * Manejar voz en el chat
   */
  const handleVoiceChat = () => {
    if (isListening) {
      stopListening();
      return;
    }

    startListening({
      continuous: false,
      onResult: (text) => {
        handleSend(text);
      },
    });
  };

  /**
   * Hablar un mensaje del asistente
   */
  const speakMessage = (text) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text, { rate: 1.05 });
    }
  };

  /**
   * Guardar API key
   */
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setValidatingKey(true);
    const isValid = await validateApiKey(apiKeyInput.trim());
    setValidatingKey(false);

    if (isValid) {
      setApiKey(apiKeyInput.trim());
      setShowSettings(false);
      setApiKeyInput('');
    } else {
      alert('La API key no es válida. Verifica que la copiaste correctamente.');
    }
  };

  /**
   * Formatear timestamp
   */
  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* FAB Button */}
      <button
        className={`ai-fab ${isOpen ? 'open' : ''}`}
        onClick={togglePanel}
        title="Asistente IA OdontoIA"
        id="ai-assistant-fab"
      >
        {!isOpen && <div className="ai-fab-pulse" />}
        <span className="ai-fab-icon">
          {isOpen ? <X size={24} /> : '🤖'}
        </span>
      </button>

      {/* Overlay */}
      <div
        className={`ai-panel-overlay ${isOpen ? 'visible' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Chat Panel */}
      <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-avatar">🤖</div>
          <div className="ai-panel-title">
            <h3>OdontoIA</h3>
            <span>Asistente Inteligente</span>
          </div>
          <div className="ai-header-actions">
            {ttsSupported && (
              <button
                className={`ai-header-btn ${ttsEnabled ? 'active' : ''}`}
                onClick={() => setTtsEnabled(!ttsEnabled)}
                title={ttsEnabled ? 'Desactivar voz' : 'Activar voz'}
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
            <button
              className="ai-header-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Configuración"
            >
              <Settings size={16} />
            </button>
            <button
              className="ai-header-btn"
              onClick={clearChat}
              title="Limpiar chat"
            >
              <Trash2 size={16} />
            </button>
            <button
              className="ai-header-btn close-btn"
              onClick={() => setIsOpen(false)}
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Settings View */}
        {showSettings ? (
          <div className="ai-settings">
            <h4>⚙️ Configuración del Asistente</h4>

            <div className="ai-settings-group">
              <label>API Key de Google Gemini</label>
              <input
                type="password"
                placeholder="Ingresa tu API key aquí..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              />
              <div className="hint">
                Obtén tu key gratis en{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                  aistudio.google.com/apikey
                </a>
                <br />
                Estado: {apiKeyConfigured ? '✅ Configurada' : '❌ No configurada'}
              </div>
            </div>

            <div className="ai-settings-group">
              <label>Voz del Asistente</label>
              <div className="ai-toggle-row">
                <span>Respuestas en voz alta</span>
                <label className="ai-toggle">
                  <input
                    type="checkbox"
                    checked={ttsEnabled}
                    onChange={(e) => setTtsEnabled(e.target.checked)}
                  />
                  <div className="ai-toggle-track" />
                  <div className="ai-toggle-thumb" />
                </label>
              </div>
            </div>

            <button
              className="ai-settings-save-btn"
              onClick={handleSaveApiKey}
              disabled={validatingKey || !apiKeyInput.trim()}
            >
              {validatingKey ? 'Validando...' : '💾 Guardar API Key'}
            </button>

            <button
              className="ai-settings-save-btn"
              onClick={() => setShowSettings(false)}
              style={{ background: 'var(--bg-input)', marginTop: 8 }}
            >
              ← Volver al Chat
            </button>
          </div>
        ) : (
          <>
            {/* Context Badge */}
            {currentPatient && (
              <div className="ai-context-badge">
                <Bot size={12} />
                Paciente: {currentPatient.first_name} {currentPatient.last_name}
              </div>
            )}

            {/* Messages */}
            <div className="ai-messages">
              {messages.length === 0 ? (
                <div className="ai-welcome">
                  <span className="ai-welcome-icon">🦷✨</span>
                  <h4>¡Hola, Doctor!</h4>
                  <p>
                    Soy <strong>OdontoIA</strong>, tu asistente inteligente. 
                    Pregúntame sobre tratamientos, medicación, o dime un comando por voz.
                  </p>
                  {!apiKeyConfigured && (
                    <p style={{ color: 'var(--warning)', fontSize: '12px', marginBottom: 12 }}>
                      ⚠️ Configura tu API Key de Gemini para activar la IA.
                      <br />
                      <button
                        onClick={() => setShowSettings(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-light)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                          fontSize: 'inherit'
                        }}
                      >
                        Ir a configuración →
                      </button>
                    </p>
                  )}
                  <div className="ai-quick-actions">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        className="ai-quick-btn"
                        onClick={() => handleSend(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`ai-msg ${msg.role}`}>
                    <div className={`ai-msg-bubble ${msg.isError ? 'error' : ''}`}>
                      {msg.content}
                    </div>
                    <div className="ai-msg-time">
                      {formatTime(msg.timestamp)}
                      {msg.role === 'assistant' && !msg.isError && ttsSupported && (
                        <button
                          className={`ai-msg-speak-btn ${isSpeaking ? 'speaking' : ''}`}
                          onClick={() => speakMessage(msg.content)}
                        >
                          <Volume2 size={11} />
                          {isSpeaking ? 'Detener' : 'Escuchar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Thinking indicator */}
              {isThinking && (
                <div className="ai-thinking">
                  <div className="ai-thinking-dot" />
                  <div className="ai-thinking-dot" />
                  <div className="ai-thinking-dot" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Voice Indicator */}
            {isListening && (
              <div className="ai-voice-indicator">
                <div className="ai-voice-bars">
                  <div className="ai-voice-bar" />
                  <div className="ai-voice-bar" />
                  <div className="ai-voice-bar" />
                  <div className="ai-voice-bar" />
                  <div className="ai-voice-bar" />
                </div>
                <span>
                  {interimTranscript || 'Escuchando...'}
                </span>
              </div>
            )}

            {/* Input Area */}
            <div className="ai-input-area">
              <div className="ai-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isListening ? 'Escuchando...' : 'Escribe o habla tu pregunta...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isThinking}
                />
                {voiceSupported && (
                  <button
                    className={`ai-input-voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={handleVoiceChat}
                    title={isListening ? 'Detener' : 'Hablar'}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}
                <button
                  className="ai-input-send-btn"
                  onClick={() => handleSend()}
                  disabled={(!inputText.trim() && !isListening) || isThinking}
                  title="Enviar"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
