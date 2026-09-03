// ============================================================
// VoiceOverlay — Modo Conversación por Voz Fullscreen
// Interfaz premium glassmorphism con waveform reactivo
// Estados: idle → listening → processing → speaking
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Mic, MicOff, Square, Volume2, VolumeX } from 'lucide-react';

/**
 * Barra individual del waveform que reacciona al nivel de audio
 */
function WaveformBar({ index, audioLevel, total, isListening, isSpeaking }) {
  // Cada barra tiene un offset diferente para crear efecto ondulado
  const offset = Math.sin((index / total) * Math.PI);
  
  let height;
  if (isListening) {
    // En modo escucha, las barras reaccionan al audio real
    const wave = Math.sin(Date.now() / 200 + index * 0.8) * 0.3 + 0.7;
    height = Math.max(8, audioLevel * 60 * offset * wave);
  } else if (isSpeaking) {
    // En modo habla, animación suave
    const wave = Math.sin(Date.now() / 150 + index * 0.6) * 0.5 + 0.5;
    height = 8 + wave * 30 * offset;
  } else {
    height = 4 + offset * 4;
  }

  return (
    <div
      className="voice-overlay-bar"
      style={{
        height: `${height}px`,
        opacity: isListening || isSpeaking ? 0.8 + audioLevel * 0.2 : 0.3,
      }}
    />
  );
}

/**
 * Componente de waveform animado
 */
function AnimatedWaveform({ audioLevel, isListening, isSpeaking }) {
  const [, setTick] = useState(0);
  const barCount = 32;

  // Forzar re-render para animación fluida
  useEffect(() => {
    if (!isListening && !isSpeaking) return;
    const interval = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  return (
    <div className="voice-overlay-waveform">
      {Array.from({ length: barCount }).map((_, i) => (
        <WaveformBar
          key={i}
          index={i}
          audioLevel={audioLevel}
          total={barCount}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      ))}
    </div>
  );
}

/**
 * VoiceOverlay — Panel de conversación por voz fullscreen
 */
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
}) {
  const [showResponse, setShowResponse] = useState(false);
  const [currentState, setCurrentState] = useState('idle'); // idle | listening | processing | speaking
  const prevResponseRef = useRef(lastResponse);

  // Determinar estado visual
  useEffect(() => {
    if (isSpeaking) {
      setCurrentState('speaking');
    } else if (isThinking) {
      setCurrentState('processing');
    } else if (isListening) {
      setCurrentState('listening');
    } else {
      setCurrentState('idle');
    }
  }, [isListening, isSpeaking, isThinking]);

  // Mostrar respuesta cuando cambia
  useEffect(() => {
    if (lastResponse && lastResponse !== prevResponseRef.current) {
      setShowResponse(true);
      prevResponseRef.current = lastResponse;
    }
  }, [lastResponse]);

  // Auto-iniciar escucha al abrir (si no está escuchando ya)
  useEffect(() => {
    if (isOpen && !isListening && !isSpeaking && !isThinking && voiceSupported) {
      const timer = setTimeout(() => {
        onStartListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      onStopListening();
    } else {
      setShowResponse(false);
      onStartListening();
    }
  }, [isListening, onStartListening, onStopListening]);

  const handleClose = useCallback(() => {
    onStopListening();
    onStopSpeaking();
    onClose();
  }, [onClose, onStopListening, onStopSpeaking]);

  const getStateLabel = () => {
    switch (currentState) {
      case 'listening': return 'Escuchando...';
      case 'processing': return 'Procesando...';
      case 'speaking': return 'OdontoIA está respondiendo...';
      default: return 'Toca el micrófono para hablar';
    }
  };

  const getStateIcon = () => {
    switch (currentState) {
      case 'listening': return '🎙️';
      case 'processing': return '🧠';
      case 'speaking': return '🔊';
      default: return '🦷';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`voice-overlay ${isOpen ? 'open' : ''}`}>
      {/* Background glow effect */}
      <div className={`voice-overlay-glow ${currentState}`} />

      {/* Header */}
      <div className="voice-overlay-header">
        <div className="voice-overlay-header-left">
          <span className="voice-overlay-logo">🤖</span>
          <div>
            <h3>OdontoIA</h3>
            <span className="voice-overlay-status">Modo Conversación por Voz</span>
          </div>
        </div>
        <div className="voice-overlay-header-actions">
          <button
            className={`voice-overlay-tts-btn ${ttsEnabled ? 'active' : ''}`}
            onClick={onToggleTts}
            title={ttsEnabled ? 'Desactivar lectura de respuestas' : 'Activar lectura de respuestas'}
          >
            {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button className="voice-overlay-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="voice-overlay-content">
        {/* State Icon */}
        <div className={`voice-overlay-state-icon ${currentState}`}>
          {getStateIcon()}
        </div>

        {/* Animated Waveform */}
        <AnimatedWaveform
          audioLevel={audioLevel}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />

        {/* Central Mic Button */}
        <button
          className={`voice-overlay-mic-btn ${currentState}`}
          onClick={handleMicToggle}
          disabled={isThinking}
        >
          <div className="voice-overlay-mic-ring" />
          <div className="voice-overlay-mic-ring ring-2" />
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </button>

        {/* State Label */}
        <p className="voice-overlay-state-label">{getStateLabel()}</p>

        {/* Interim Transcript (lo que se va escuchando) */}
        {isListening && interimTranscript && (
          <div className="voice-overlay-transcript">
            <span className="voice-overlay-transcript-label">Escuchando:</span>
            <p>"{interimTranscript}"</p>
          </div>
        )}

        {/* Processing Indicator */}
        {isThinking && (
          <div className="voice-overlay-processing">
            <div className="voice-overlay-processing-dots">
              <span /><span /><span />
            </div>
            <p>Analizando tu consulta...</p>
          </div>
        )}

        {/* Response Display */}
        {showResponse && lastResponse && !isThinking && (
          <div className="voice-overlay-response">
            <div className="voice-overlay-response-header">
              <span>🤖 OdontoIA</span>
              {isSpeaking && (
                <button
                  className="voice-overlay-stop-speak-btn"
                  onClick={onStopSpeaking}
                >
                  <Square size={12} /> Detener lectura
                </button>
              )}
            </div>
            <p>{lastResponse}</p>
          </div>
        )}
      </div>

      {/* Footer Hint */}
      <div className="voice-overlay-footer">
        <p>
          <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> para abrir/cerrar
          {' · '}Presiona <kbd>Esc</kbd> para salir
        </p>
      </div>
    </div>
  );
}
