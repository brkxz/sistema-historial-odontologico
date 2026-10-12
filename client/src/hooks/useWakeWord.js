// ============================================================
// Hook de Wake Word — "Oye Denty"
// Escucha continuamente en segundo plano esperando la
// palabra clave para activar el asistente por voz.
//
// FIX v3: Usa abort() + espera onend ANTES de disparar el
// callback, garantizando que el micrófono quede 100% libre
// en Chrome/Android antes de iniciar el reconocimiento principal.
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';

// Variantes que el reconocimiento puede captar (incluye errores fonéticos comunes)
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
  'oye odonto',
  'denti escucha',
  'denty escucha',
  'asistente denty',
  'asistente denti',
  'oye identi',
  'oye el denty',
  // Variante sin "oye" — solo el nombre
  'denty',
];

// Umbral mínimo de confianza (0–1). Chrome suele devolver 0 en continuo → lo bajamos a 0
const MIN_CONFIDENCE = 0;

// Cooldown entre activaciones (ms) — evita activaciones repetidas
const WAKE_COOLDOWN_MS = 3000;

// Idiomas a probar en orden de preferencia
const LANG_OPTIONS = ['es-PE', 'es-MX', 'es-ES', 'es'];

/**
 * Hook para detección de wake word en segundo plano.
 * Escucha continuamente el micrófono buscando "Oye Denty".
 *
 * Garantías de liberación de micrófono:
 * - Usa abort() para parar el recognition inmediatamente.
 * - Espera el evento onend antes de llamar al callback.
 * - Delay adicional configurable post-onend para Android.
 *
 * @param {Object} options
 * @param {Function} options.onWakeWord - Callback cuando se detecta la wake word
 * @param {boolean} options.enabled     - Si el listener está habilitado
 */
export function useWakeWord({ onWakeWord, enabled = false } = {}) {
  const [isWakeListening, setIsWakeListening] = useState(false);
  const [wakeWordSupported, setWakeWordSupported] = useState(false);

  const recognitionRef       = useRef(null);
  const onWakeWordRef        = useRef(onWakeWord);
  const enabledRef           = useRef(enabled);
  const restartTimerRef      = useRef(null);
  const lastWakeTimeRef      = useRef(0);
  // Flag: se detectó wake word, esperar onend antes de llamar callback
  const pendingWakeRef       = useRef(false);
  const langIndexRef         = useRef(0);

  // Mantener refs actualizados
  useEffect(() => { onWakeWordRef.current = onWakeWord; }, [onWakeWord]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // Verificar soporte una vez al montar
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setWakeWordSupported(supported);
  }, []);

  /**
   * Normalizar texto para comparación (sin tildes, minúsculas)
   */
  const normalize = (text) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  /**
   * Verificar si el texto contiene la wake word
   */
  const detectWakeWord = useCallback((text) => {
    const n = normalize(text);
    return WAKE_PHRASES.some(phrase => n.includes(normalize(phrase)));
  }, []);

  /**
   * Detener el recognition del wake word y llamar al callback
   * solo después de que el micrófono quede 100% libre (onend).
   * Esta función es segura llamarla múltiples veces.
   */
  const stopWakeWordListener = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      // No nulleamos recognitionRef aquí — onend lo hará
    }
    setIsWakeListening(false);
  }, []);

  /**
   * Iniciar reconocimiento de wake word
   */
  const startWakeWordListener = useCallback(() => {
    if (!wakeWordSupported || recognitionRef.current) return;

    const lang = LANG_OPTIONS[langIndexRef.current % LANG_OPTIONS.length];
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang             = lang;
    recognition.continuous       = true;
    recognition.interimResults   = false; // Solo finales — evita falsos positivos
    recognition.maxAlternatives  = 3;     // Más alternativas = mejor detección

    recognition.onstart = () => {
      setIsWakeListening(true);
    };

    recognition.onresult = (event) => {
      const now = Date.now();

      // Cooldown anti-spam
      if (now - lastWakeTimeRef.current < WAKE_COOLDOWN_MS) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;

        for (let j = 0; j < result.length; j++) {
          const { transcript, confidence } = result[j];

          // Chrome en modo continuo devuelve confidence=0 — lo aceptamos igual
          if (confidence > 0 && confidence < MIN_CONFIDENCE) continue;

          if (detectWakeWord(transcript)) {
            lastWakeTimeRef.current = now;
            pendingWakeRef.current = true; // Señal para onend

            // Abortar el recognition → disparará onend → allí llamamos callback
            try { recognition.abort(); } catch {}
            return;
          }
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;

      // En errores de idioma, rotar al siguiente
      if (event.error === 'language-not-supported') {
        langIndexRef.current++;
      }
      console.warn('[WakeWord] error:', event.error);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsWakeListening(false);

      if (pendingWakeRef.current) {
        // Wake word detectada: micrófono ya liberado, ahora llamar callback
        pendingWakeRef.current = false;
        // Delay mínimo adicional para Android (hardware release)
        setTimeout(() => {
          onWakeWordRef.current?.();
        }, 100);
        return; // No reiniciar el wake word listener ahora — el asistente está activo
      }

      // Auto-reiniciar si sigue habilitado
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (enabledRef.current) {
            startWakeWordListener();
          }
        }, 600);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.warn('[WakeWord] Failed to start:', e);
      recognitionRef.current = null;
      setIsWakeListening(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeWordSupported, detectWakeWord]);

  // Auto-start/stop cuando cambia `enabled`
  useEffect(() => {
    if (enabled && wakeWordSupported) {
      // Pequeño delay inicial para no colisionar con el montaje del componente
      const t = setTimeout(() => startWakeWordListener(), 300);
      return () => {
        clearTimeout(t);
        stopWakeWordListener();
      };
    } else {
      stopWakeWordListener();
    }
  }, [enabled, wakeWordSupported, startWakeWordListener, stopWakeWordListener]);

  /**
   * Reanudar el wake word listener después de que el asistente terminó de hablar.
   * Llamar esto cuando el overlay de voz se cierra o cuando TTS termina.
   */
  const resumeWakeWordListener = useCallback(() => {
    if (enabledRef.current && wakeWordSupported && !recognitionRef.current) {
      // Delay para asegurar que el micrófono del asistente esté liberado
      restartTimerRef.current = setTimeout(() => {
        if (enabledRef.current && !recognitionRef.current) {
          startWakeWordListener();
        }
      }, 800);
    }
  }, [wakeWordSupported, startWakeWordListener]);

  return {
    isWakeListening,
    wakeWordSupported,
    startWakeWordListener,
    stopWakeWordListener,
    resumeWakeWordListener,
    wakePhrases: WAKE_PHRASES,
  };
}

export default useWakeWord;
