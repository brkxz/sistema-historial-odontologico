// ============================================================
// VoiceOverlay — Modo Conversación por Voz Fullscreen
// Diseño premium inspirado en Gemini Live / ChatGPT Voice Mode
//
// Estados: idle → listening → processing → speaking
//
// FIX v3:
// - NO auto-inicia el micrófono al abrirse (estado idle por defecto)
// - Orb animado central reactivo al audio (reemplaza barras de waveform)
// - Feedback visual claro para cada estado
// - Hint "Di Oye Denty" cuando wake word está habilitado
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Mic, MicOff, Square, Volume2, VolumeX, Ear } from 'lucide-react';

// ── Orb central animado ────────────────────────────────────────
function VoiceOrb({ currentState, audioLevel }) {
  const [tick, setTick] = useState(0);

  // Re-render para animación fluida en listening/speaking
  useEffect(() => {
    if (currentState !== 'listening' && currentState !== 'speaking') return;
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, [currentState]);

  // Calcular tamaño del orb reactivo al audio
  const baseSize = 140;
  let scale = 1;
  if (currentState === 'listening') {
    scale = 1 + audioLevel * 0.45;
  } else if (currentState === 'speaking') {
    scale = 1 + Math.sin(Date.now() / 300) * 0.12 * 0.5 + 0.06;
  } else if (currentState === 'processing') {
    scale = 1;
  }

  const stateClass = `voice-orb voice-orb--${currentState}`;

  return (
    <div className="voice-orb-container">
      {/* Anillos de propagación */}
      {(currentState === 'listening' || currentState === 'speaking') && (
        <>
          <div className={`voice-orb-ring voice-orb-ring--1 voice-orb-ring--${currentState}`} />
          <div className={`voice-orb-ring voice-orb-ring--2 voice-orb-ring--${currentState}`} />
        </>
      )}
      {/* Orb principal */}
      <div
        className={stateClass}
        style={{
          width: baseSize,
          height: baseSize,
          transform: `scale(${scale})`,
          transition: currentState === 'listening'
            ? 'transform 0.08s ease-out'
            : 'transform 0.4s ease',
        }}
      >
        {/* Ícono interno según estado */}
        <div className="voice-orb-icon">
          {currentState === 'idle'       && <Mic size={36} />}
          {currentState === 'listening'  && <Mic size={36} />}
          {currentState === 'processing' && (
            <div className="voice-orb-spinner" />
          )}
          {currentState === 'speaking'   && <Volume2 size={36} />}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
export default function VoiceOverlay({
  isOpen,
  onClose,
  onSend,
  isListening,
  isSpeaking,
  isThinking,
  audioLevel,
  interimTranscript,
  lastResponse,
  voiceSupported,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  ttsEnabled,
  onToggleTts,
  wakeWordEnabled,
}) {
  const [showResponse, setShowResponse]     = useState(false);
  const [currentState, setCurrentState]     = useState('idle');
  const prevResponseRef = useRef(lastResponse);

  // ── Determinar estado visual ──────────────────────────────
  useEffect(() => {
    if (isSpeaking)      setCurrentState('speaking');
    else if (isThinking) setCurrentState('processing');
    else if (isListening) setCurrentState('listening');
    else                 setCurrentState('idle');
  }, [isListening, isSpeaking, isThinking]);

  // ── Mostrar respuesta cuando cambia ──────────────────────
  useEffect(() => {
    if (lastResponse && lastResponse !== prevResponseRef.current) {
      setShowResponse(true);
      prevResponseRef.current = lastResponse;
    }
  }, [lastResponse]);

  // ── Resetear estado al abrir ──────────────────────────────
  // ★ FIX PRINCIPAL: NO arrancamos el micrófono automáticamente.
  // El usuario debe presionar el botón o decir la wake word.
  useEffect(() => {
    if (isOpen) {
      setShowResponse(false);
    }
  }, [isOpen]);

  // ── Handlers ─────────────────────────────────────────────
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      onStopListening();
    } else if (!isThinking && !isSpeaking) {
      setShowResponse(false);
      onStartListening();
    }
  }, [isListening, isThinking, isSpeaking, onStartListening, onStopListening]);

  const handleClose = useCallback(() => {
    onStopListening();
    onStopSpeaking();
    onClose();
  }, [onClose, onStopListening, onStopSpeaking]);

  // ── Etiquetas por estado ──────────────────────────────────
  const STATE_LABELS = {
    idle:       'Toca el micrófono para hablar',
    listening:  'Escuchando... habla ahora',
    processing: 'Analizando tu consulta...',
    speaking:   'Denty está respondiendo',
  };

  if (!isOpen) return null;

  return (
    <div className={`voice-overlay ${isOpen ? 'open' : ''}`}>
      {/* ── Fondo gradiente dinámico por estado ── */}
      <div className={`voice-overlay-glow voice-overlay-glow--${currentState}`} />

      {/* ── Header ── */}
      <div className="voice-overlay-header">
        <div className="voice-overlay-header-left">
          <div className="voice-overlay-logo-badge">
            <span>🦷</span>
          </div>
          <div>
            <h3>Denty</h3>
            <span className="voice-overlay-status">Modo Conversación por Voz</span>
          </div>
        </div>
        <div className="voice-overlay-header-actions">
          <button
            className={`voice-overlay-tts-btn ${ttsEnabled ? 'active' : ''}`}
            onClick={onToggleTts}
            title={ttsEnabled ? 'Desactivar respuesta en voz' : 'Activar respuesta en voz'}
          >
            {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button className="voice-overlay-close-btn" onClick={handleClose} title="Cerrar (Esc)">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Contenido central ── */}
      <div className="voice-overlay-content">

        {/* Orb animado */}
        <VoiceOrb currentState={currentState} audioLevel={audioLevel} />

        {/* Etiqueta de estado */}
        <p className="voice-overlay-state-label" key={currentState}>
          {STATE_LABELS[currentState]}
        </p>

        {/* Transcript en tiempo real */}
        {isListening && interimTranscript && (
          <div className="voice-overlay-transcript">
            <span className="voice-overlay-transcript-label">Escuchando</span>
            <p>"{interimTranscript}"</p>
          </div>
        )}

        {/* Processing dots */}
        {isThinking && (
          <div className="voice-overlay-processing">
            <div className="voice-overlay-processing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Respuesta */}
        {showResponse && lastResponse && !isThinking && (
          <div className="voice-overlay-response">
            <div className="voice-overlay-response-header">
              <span>Denty</span>
              {isSpeaking && (
                <button
                  className="voice-overlay-stop-speak-btn"
                  onClick={onStopSpeaking}
                >
                  <Square size={11} /> Detener
                </button>
              )}
            </div>
            <p>{lastResponse}</p>
          </div>
        )}

        {/* Botón mic principal */}
        <button
          className={`voice-overlay-mic-btn voice-overlay-mic-btn--${currentState}`}
          onClick={handleMicToggle}
          disabled={isThinking}
          title={isListening ? 'Parar de escuchar' : 'Comenzar a escuchar'}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          <span className="voice-overlay-mic-btn-label">
            {isListening ? 'Detener' : 'Hablar'}
          </span>
        </button>

        {/* Hint wake word */}
        {wakeWordEnabled && !isListening && !isSpeaking && !isThinking && (
          <div className="voice-overlay-wake-hint">
            <Ear size={13} />
            <span>También puedes decir <strong>"Oye Denty"</strong> sin tocar</span>
          </div>
        )}

        {/* Comandos sugeridos cuando idle y sin respuesta */}
        {currentState === 'idle' && !showResponse && (
          <div className="voice-overlay-quick-tips">
            <span className="voice-overlay-tips-title">💡 Prueba decir:</span>
            <div className="voice-overlay-tips-chips">
              <button type="button" onClick={() => onSend('Nueva atención')}>"Nueva atención"</button>
              <button type="button" onClick={() => onSend('Buscar paciente')}>"Buscar paciente"</button>
              <button type="button" onClick={() => onSend('Marcar caries en pieza 16')}>"Caries en pieza 16"</button>
              <button type="button" onClick={() => onSend('Ver odontograma')}>"Ver odontograma"</button>
              <button type="button" onClick={() => onSend('Dosis de amoxicilina')}>"Dosis de amoxicilina"</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="voice-overlay-footer">
        <p>
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> para abrir/cerrar
          {' · '}Presiona <kbd>Esc</kbd> para salir
        </p>
      </div>
    </div>
  );
}
