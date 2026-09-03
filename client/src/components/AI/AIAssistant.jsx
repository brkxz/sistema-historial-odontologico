// ============================================================
// AIAssistant - Componente Principal del Asistente IA
// Chat flotante con voz bidireccional + Modo Voz Fullscreen
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../../context/AIContext';
import { useVoice } from '../../hooks/useVoice';
import { useSoundFeedback } from '../../hooks/useSoundFeedback';
import { useWakeWord } from '../../hooks/useWakeWord';

import VoiceOverlay from './VoiceOverlay';
import {
  X, Send, Mic, MicOff, Volume2, VolumeX,
  Settings, Trash2, Sparkles, Bot, ChevronRight, AudioLines, Ear
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
    messages, isThinking, sendChat, clearChat, addLocalMessages,
    currentPatient, ttsEnabled, setTtsEnabled,
    apiKeyConfigured, processVoiceCommand,
  } = useAI();

  const {
    isListening, isSpeaking, interimTranscript, voiceSupported,
    ttsSupported, startListening, stopListening, speak, stopSpeaking,
    audioLevel, availableVoices, selectedVoiceURI, selectVoice,
  } = useVoice();

  const { playStartSound, playStopSound, playConfirmSound, playSendSound } = useSoundFeedback();

  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [lastVoiceResponse, setLastVoiceResponse] = useState('');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(
    () => localStorage.getItem('odonto_wake_word') === 'true'
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // ---- Wake Word: "Oye Denty" ----
  const { isWakeListening, wakeWordSupported, startWakeWordListener } = useWakeWord({
    enabled: wakeWordEnabled && !voiceOverlayOpen && !isListening,
    onWakeWord: () => {
      playStartSound();
      // Abrir el chat (no el overlay fullscreen) para que se vea la app
      if (!isOpen) setIsOpen(true);
      // Iniciar escucha inline
      startListening({
        continuous: false,
        onResult: async (text) => {
          playConfirmSound();
          const response = await handleSend(text);
          // Hablar la respuesta si TTS está activo
          if (ttsEnabled && response && !response.startsWith('⚙️') && !response.startsWith('⚠️')) {
            speak(response, { rate: 1.05 });
          }
        },
      });
    },
  });

  // Persistir preferencia de wake word
  const toggleWakeWord = useCallback((value) => {
    setWakeWordEnabled(value);
    localStorage.setItem('odonto_wake_word', value ? 'true' : 'false');
  }, []);

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

  // ---- Hotkey Global: Ctrl+Shift+V ----
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+V → Toggle Voice Overlay
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        setVoiceOverlayOpen(prev => !prev);
      }
      // Escape → Cerrar voice overlay
      if (e.key === 'Escape' && voiceOverlayOpen) {
        e.preventDefault();
        setVoiceOverlayOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceOverlayOpen]);

  /**
   * Enviar mensaje
   */
  const handleSend = useCallback(async (text) => {
    const msg = text || inputText.trim();
    if (!msg || isThinking) return;

    setInputText('');
    playSendSound();

    // Procesar como comando de voz
    const command = processVoiceCommand(msg);

    if (command.type === 'navigate') {
      const confirmMsg = command.confirm || `✅ Navegando a ${command.label}...`;
      addLocalMessages(msg, confirmMsg);
      navigate(command.route);
      if (ttsEnabled) speak(confirmMsg, { rate: 1.05 });
      return confirmMsg;
    }

    if (command.type === 'search_dni') {
      const confirmMsg = `🔍 Buscando paciente con DNI ${command.dni}...`;
      addLocalMessages(msg, confirmMsg);
      navigate('/buscar');
      if (ttsEnabled) speak(confirmMsg, { rate: 1.05 });
      return confirmMsg;
    }

    // Chat normal con IA
    const response = await sendChat(msg);

    // TTS: hablar la respuesta si está activado
    if (ttsEnabled && response && !response.startsWith('⚙️') && !response.startsWith('❌')) {
      speak(response, { rate: 1.05 });
    }

    return response;
  }, [inputText, isThinking, processVoiceCommand, sendChat, navigate, ttsEnabled, speak, playSendSound]);

  /**
   * Manejar voz en el chat (inline)
   */
  const handleVoiceChat = useCallback(() => {
    if (isListening) {
      stopListening();
      playStopSound();
      return;
    }

    playStartSound();
    startListening({
      continuous: false,
      onResult: (text) => {
        playConfirmSound();
        handleSend(text);
      },
    });
  }, [isListening, startListening, stopListening, handleSend, playStartSound, playStopSound, playConfirmSound]);

  /**
   * Manejar voz desde VoiceOverlay (modo conversación)
   */
  const handleVoiceOverlayStart = useCallback(() => {
    playStartSound();
    startListening({
      continuous: true,
      autoRestart: true,
      silenceTimeout: 5000,
      onResult: async (text) => {
        playConfirmSound();
        const response = await handleSend(text);
        if (response) {
          setLastVoiceResponse(response);
        }
      },
    });
  }, [startListening, handleSend, playStartSound, playConfirmSound]);

  const handleVoiceOverlayStop = useCallback(() => {
    stopListening();
    playStopSound();
  }, [stopListening, playStopSound]);

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
        className={`ai-fab ${isOpen ? 'open' : ''} ${isWakeListening ? 'wake-active' : ''}`}
        onClick={togglePanel}
        title={isWakeListening ? 'OdontoIA — Escuchando "Oye Denty"' : 'Asistente IA OdontoIA'}
        id="ai-assistant-fab"
      >
        {!isOpen && <div className="ai-fab-pulse" />}
        {isWakeListening && !isOpen && <div className="ai-fab-wake-badge"><Ear size={10} /></div>}
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
            {/* Botón Modo Voz */}
            {voiceSupported && (
              <button
                className="ai-header-btn ai-voice-mode-btn"
                onClick={() => setVoiceOverlayOpen(true)}
                title="Modo Conversación por Voz (Ctrl+Shift+V)"
              >
                <AudioLines size={16} />
              </button>
            )}
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
              <label>Estado de la IA</label>
              <div className="hint">
                {apiKeyConfigured
                  ? '✅ OdontoIA está activa y lista para usar'
                  : '❌ API no configurada — Contacta al administrador'}
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
              {ttsEnabled && availableVoices.length > 0 && (
                <select
                  className="ai-voice-select"
                  value={selectedVoiceURI}
                  onChange={(e) => selectVoice(e.target.value)}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  <option value="">🔊 Voz automática (español)</option>
                  {availableVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="ai-settings-group">
              <label>Activación por Voz</label>
              <div className="ai-toggle-row">
                <span>
                  <Ear size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Decir <strong>"Oye Denty"</strong> para activar
                </span>
                <label className="ai-toggle">
                  <input
                    type="checkbox"
                    checked={wakeWordEnabled}
                    onChange={(e) => toggleWakeWord(e.target.checked)}
                  />
                  <div className="ai-toggle-track" />
                  <div className="ai-toggle-thumb" />
                </label>
              </div>
              {wakeWordEnabled && (
                <div className="hint" style={{ marginTop: 6 }}>
                  {isWakeListening ? '🟢 Escuchando en segundo plano...' : '⏳ Iniciando detector...'}
                  <br />El micrófono permanece activo mientras esta opción esté habilitada.
                </div>
              )}
            </div>

            <div className="ai-settings-group">
              <label>Atajo de teclado</label>
              <div className="ai-settings-shortcut-info">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>
                <span>Abrir modo conversación por voz</span>
              </div>
            </div>

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

                  {/* Voice Mode Card */}
                  {voiceSupported && (
                    <div
                      className="ai-voice-mode-card"
                      onClick={() => setVoiceOverlayOpen(true)}
                    >
                      <div className="ai-voice-mode-card-icon">
                        <AudioLines size={20} />
                      </div>
                      <div className="ai-voice-mode-card-text">
                        <strong>Modo Conversación por Voz</strong>
                        <span>Habla con OdontoIA en modo manos libres</span>
                      </div>
                      <ChevronRight size={16} className="ai-voice-mode-card-arrow" />
                    </div>
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

            {/* Voice Indicator (mejorado con audio level) */}
            {isListening && (
              <div className="ai-voice-indicator">
                <div className="ai-voice-bars">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="ai-voice-bar"
                      style={{
                        height: `${6 + audioLevel * 20 * Math.sin((i / 7) * Math.PI)}px`,
                        transition: 'height 0.1s ease',
                      }}
                    />
                  ))}
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

      {/* Voice Overlay (Fullscreen Mode) */}
      <VoiceOverlay
        isOpen={voiceOverlayOpen}
        onClose={() => setVoiceOverlayOpen(false)}
        onSend={handleSend}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isThinking={isThinking}
        audioLevel={audioLevel}
        interimTranscript={interimTranscript}
        lastResponse={lastVoiceResponse}
        voiceSupported={voiceSupported}
        onStartListening={handleVoiceOverlayStart}
        onStopListening={handleVoiceOverlayStop}
        onStopSpeaking={stopSpeaking}
        ttsEnabled={ttsEnabled}
        onToggleTts={() => setTtsEnabled(!ttsEnabled)}
      />
    </>
  );
}
