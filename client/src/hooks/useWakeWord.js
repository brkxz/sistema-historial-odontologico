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
  'ok denty',
  'ok denti',
  'denty',
  'asistente denty',
  'asistente denti',
  'oye identi',
  'oye el denty',
];

// Umbral mínimo de confianza para aceptar un resultado (0-1)
const MIN_CONFIDENCE = 0.4;

// Cooldown entre activaciones (ms) — evita activaciones repetidas
const WAKE_COOLDOWN_MS = 3000;

/**
 * Hook para detección de wake word en segundo plano
 * Escucha continuamente el micrófono buscando "Oye Denty"
 * 
 * MEJORAS para móvil:
 * - Solo procesa resultados FINALES (no interim) para evitar falsos positivos
 * - Cooldown entre activaciones
 * - Umbral mínimo de confianza
 * - Delay aumentado post-detección para liberar micrófono en Android
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
  const lastWakeTimeRef = useRef(0); // Timestamp de la última activación

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
      .replace(/\s+/g, ' ')           // Normalizar espacios
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
    // ★ CAMBIO CLAVE: En móvil usamos solo resultados finales
    // Los interim generan demasiados falsos positivos en Android
    recognition.interimResults = false;
    recognition.maxAlternatives = 3; // Más alternativas = mejor detección

    recognition.onstart = () => {
      setIsWakeListening(true);
    };

    recognition.onresult = (event) => {
      const now = Date.now();

      // Cooldown: evitar activaciones repetidas
      if (now - lastWakeTimeRef.current < WAKE_COOLDOWN_MS) {
        return;
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        // ★ SOLO procesar resultados finales
        if (!result.isFinal) continue;

        // Revisar todas las alternativas
        for (let j = 0; j < result.length; j++) {
          const transcript = result[j].transcript;
          const confidence = result[j].confidence;

          // ★ Verificar confianza mínima
          if (confidence < MIN_CONFIDENCE) continue;

          if (detectWakeWord(transcript)) {
            // ¡Wake word detectada!
            lastWakeTimeRef.current = now;

            // Detener listener para no interferir con el asistente
            stopWakeWordListener();

            // ★ Delay aumentado para móvil: el micrófono necesita más
            // tiempo para liberarse en Android antes de iniciar otro
            // reconocimiento de voz
            setTimeout(() => {
              onWakeWordRef.current?.();
            }, 200);
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
        }, 800); // ★ Delay más largo para móvil
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
