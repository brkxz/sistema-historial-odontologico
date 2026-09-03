// ============================================================
// Hook de Wake Word — "Oye Denty"
// Escucha continuamente en segundo plano esperando la
// palabra clave para activar el asistente por voz.
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';

// Variantes que el reconocimiento de voz puede captar
const WAKE_PHRASES = [
  'oye denty',
  'oye denti',
  'oye dente',
  'hey denty',
  'hey denti',
  'oye dentí',
  'oye den ti',
  'oye denthy',
  'hola denty',
  'hola denti',
];

/**
 * Hook para detección de wake word en segundo plano
 * Escucha continuamente el micrófono buscando "Oye Denty"
 * 
 * @param {Object} options
 * @param {Function} options.onWakeWord - Callback cuando se detecta la palabra clave
 * @param {boolean} options.enabled - Si el wake word listener está habilitado
 */
export function useWakeWord({ onWakeWord, enabled = false } = {}) {
  const [isWakeListening, setIsWakeListening] = useState(false);
  const [wakeWordSupported, setWakeWordSupported] = useState(false);
  const recognitionRef = useRef(null);
  const onWakeWordRef = useRef(onWakeWord);
  const enabledRef = useRef(enabled);
  const restartTimerRef = useRef(null);

  // Mantener ref actualizado
  useEffect(() => {
    onWakeWordRef.current = onWakeWord;
  }, [onWakeWord]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Verificar soporte
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setWakeWordSupported(supported);
  }, []);

  /**
   * Verificar si el texto contiene la wake word
   */
  const detectWakeWord = useCallback((text) => {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .trim();

    return WAKE_PHRASES.some(phrase => normalized.includes(phrase));
  }, []);

  /**
   * Iniciar escucha de wake word en segundo plano
   */
  const startWakeWordListener = useCallback(() => {
    if (!wakeWordSupported || recognitionRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'es-PE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3; // Más alternativas = mejor detección

    recognition.onstart = () => {
      setIsWakeListening(true);
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Revisar todas las alternativas
        for (let j = 0; j < result.length; j++) {
          const transcript = result[j].transcript;
          if (detectWakeWord(transcript)) {
            // ¡Wake word detectada!
            // Detener listener para no interferir con el asistente
            stopWakeWordListener();
            onWakeWordRef.current?.();
            return;
          }
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Errores normales, se reiniciará en onend
        return;
      }
      console.warn('Wake word listener error:', event.error);
    };

    recognition.onend = () => {
      setIsWakeListening(false);
      recognitionRef.current = null;
      // Auto-reiniciar si sigue habilitado
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (enabledRef.current) {
            startWakeWordListener();
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.warn('Failed to start wake word listener:', e);
      recognitionRef.current = null;
      setIsWakeListening(false);
    }
  }, [wakeWordSupported, detectWakeWord]);

  /**
   * Detener escucha de wake word
   */
  const stopWakeWordListener = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsWakeListening(false);
  }, []);

  // Auto-start/stop cuando cambia enabled
  useEffect(() => {
    if (enabled && wakeWordSupported) {
      startWakeWordListener();
    } else {
      stopWakeWordListener();
    }

    return () => {
      stopWakeWordListener();
    };
  }, [enabled, wakeWordSupported]);

  return {
    isWakeListening,
    wakeWordSupported,
    startWakeWordListener,
    stopWakeWordListener,
    wakePhrases: WAKE_PHRASES,
  };
}

export default useWakeWord;
