// ============================================================
// Hook de Voz Mejorado - STT + TTS para Odontología
// Reconocimiento de voz continuo + Síntesis de voz
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook personalizado para manejo avanzado de voz
 * - Reconocimiento de voz (Speech-to-Text) continuo
 * - Síntesis de voz (Text-to-Speech) en español
 * - Detección inteligente de silencio
 * - Control de estado de voz
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Verificar soporte al montar
  useEffect(() => {
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setVoiceSupported(hasSpeechRecognition);
    setTtsSupported('speechSynthesis' in window);

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  /**
   * Obtener la mejor voz en español disponible
   */
  const getSpanishVoice = useCallback(() => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    
    // Priorizar voces en español latinoamericano
    const preferredVoice = voices.find(v => 
      v.lang === 'es-PE' || v.lang === 'es-419' || v.lang === 'es-MX'
    );
    if (preferredVoice) return preferredVoice;

    // Fallback a cualquier voz en español
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) return spanishVoice;

    return voices[0] || null;
  }, []);

  /**
   * Iniciar reconocimiento de voz
   * @param {Object} options
   * @param {boolean} options.continuous - Si true, escucha continuamente
   * @param {Function} options.onResult - Callback con el texto final reconocido
   * @param {Function} options.onInterim - Callback con texto intermedio
   * @param {number} options.silenceTimeout - Ms de silencio para auto-parar (default 3000)
   */
  const startListening = useCallback((options = {}) => {
    const {
      continuous = false,
      onResult,
      onInterim,
      silenceTimeout = 4000
    } = options;

    if (!voiceSupported) return false;

    // Detener si ya está escuchando
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-PE';
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    onResultCallbackRef.current = onResult;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
        onInterim?.(interim);
      }

      if (final) {
        setTranscript(prev => prev ? `${prev} ${final}` : final);
        onResultCallbackRef.current?.(final);
        
        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        if (continuous) {
          silenceTimerRef.current = setTimeout(() => {
            stopListening();
          }, silenceTimeout);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
      return false;
    }
  }, [voiceSupported]);

  /**
   * Detener reconocimiento de voz
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  /**
   * Hablar texto en voz alta (Text-to-Speech)
   * @param {string} text - Texto a hablar
   * @param {Object} options
   * @param {number} options.rate - Velocidad (0.5-2, default 1)
   * @param {number} options.pitch - Tono (0-2, default 1)
   * @param {Function} options.onEnd - Callback cuando termina
   */
  const speak = useCallback((text, options = {}) => {
    if (!ttsSupported || !text) return;

    // Detener cualquier speech anterior
    stopSpeaking();

    const { rate = 1, pitch = 1, onEnd } = options;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    const voice = getSpanishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [ttsSupported, getSpanishVoice]);

  /**
   * Detener síntesis de voz
   */
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  /**
   * Toggle de escucha (start/stop)
   */
  const toggleListening = useCallback((options) => {
    if (isListening) {
      stopListening();
    } else {
      startListening(options);
    }
  }, [isListening, startListening, stopListening]);

  return {
    // Estado
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    voiceSupported,
    ttsSupported,
    
    // Acciones STT
    startListening,
    stopListening,
    toggleListening,
    
    // Acciones TTS
    speak,
    stopSpeaking,
  };
}

export default useVoice;
