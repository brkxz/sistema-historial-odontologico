// ============================================================
// Hook de Voz Mejorado v2 - STT + TTS para Odontología
// Reconocimiento de voz continuo + Síntesis de voz
// + Web Audio API para nivel de volumen en tiempo real
// + Limpieza de texto TTS (emojis, markdown)
// + Chunking inteligente de TTS
// + Auto-reinicio en modo continuo
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';

// ---- Utilidades de limpieza de texto para TTS ----

/**
 * Elimina emojis, markdown y caracteres especiales del texto
 * para que la síntesis de voz suene natural
 */
function cleanTextForTTS(text) {
  if (!text) return '';
  
  return text
    // Remover emojis (Unicode emoji ranges)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // Misc Symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // Transport
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')  // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')    // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')    // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // Variation selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // Supplemental
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')  // Chess
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')  // Extended-A
    .replace(/[\u{200D}]/gu, '')              // Zero width joiner
    // Remover markdown
    .replace(/\*\*(.+?)\*\*/g, '$1')   // Bold **text**
    .replace(/\*(.+?)\*/g, '$1')       // Italic *text*
    .replace(/__(.+?)__/g, '$1')       // Bold __text__
    .replace(/_(.+?)_/g, '$1')         // Italic _text_
    .replace(/~~(.+?)~~/g, '$1')       // Strikethrough
    .replace(/`(.+?)`/g, '$1')         // Inline code
    .replace(/```[\s\S]*?```/g, '')    // Code blocks
    .replace(/^#{1,6}\s+/gm, '')       // Headers
    .replace(/^[-*+]\s+/gm, '')        // List items
    .replace(/^\d+\.\s+/gm, '')        // Numbered lists
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links [text](url)
    .replace(/^>\s+/gm, '')            // Blockquotes
    // Limpiar caracteres especiales
    .replace(/[*_~`#>|]/g, '')
    .replace(/\n{3,}/g, '\n\n')        // Múltiples saltos
    .replace(/\s{2,}/g, ' ')           // Múltiples espacios
    .trim();
}

/**
 * Divide texto largo en chunks por oraciones para TTS
 * El sintetizador puede cortarse con textos muy largos
 */
function chunkTextForTTS(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// ---- Hook Principal ----

/**
 * Hook personalizado para manejo avanzado de voz v2
 * - Reconocimiento de voz (Speech-to-Text) continuo
 * - Síntesis de voz (Text-to-Speech) en español con chunking
 * - Detección inteligente de silencio
 * - Nivel de audio en tiempo real (Web Audio API)
 * - Limpieza de texto para TTS
 * - Auto-reinicio en modo continuo
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0-1, nivel de volumen en tiempo real
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const onInterimCallbackRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const utteranceQueueRef = useRef([]);
  const isSpeakingChunksRef = useRef(false);
  const continuousModeRef = useRef(false);
  const shouldRestartRef = useRef(false);

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
      cleanupAudioAnalysis();
    };
  }, []);

  // ---- Audio Level Analysis (Web Audio API) ----

  /**
   * Iniciar análisis de nivel de audio del micrófono
   */
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calcular nivel promedio (0-1)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        // Aplicar curva para hacer más sensible a niveles bajos
        const level = Math.min(1, avg * 2.5);
        setAudioLevel(level);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('No se pudo iniciar análisis de audio:', err);
    }
  }, []);

  /**
   * Limpiar recursos de análisis de audio
   */
  const cleanupAudioAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // ---- Voces TTS ----

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

  // ---- Speech-to-Text ----

  /**
   * Iniciar reconocimiento de voz
   * @param {Object} options
   * @param {boolean} options.continuous - Si true, escucha continuamente
   * @param {Function} options.onResult - Callback con el texto final reconocido
   * @param {Function} options.onInterim - Callback con texto intermedio
   * @param {number} options.silenceTimeout - Ms de silencio para auto-parar (default 3000)
   * @param {boolean} options.autoRestart - Auto-reiniciar si se corta en modo continuo
   */
  const startListening = useCallback((options = {}) => {
    const {
      continuous = false,
      onResult,
      onInterim,
      silenceTimeout = 4000,
      autoRestart = true,
    } = options;

    if (!voiceSupported) return false;

    // Detener si ya está escuchando
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    continuousModeRef.current = continuous;
    shouldRestartRef.current = continuous && autoRestart;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-PE';
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    onResultCallbackRef.current = onResult;
    onInterimCallbackRef.current = onInterim;

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
        onInterimCallbackRef.current?.(interim);
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
            shouldRestartRef.current = false;
            stopListening();
          }, silenceTimeout);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition error:', event.error);
      }
      // No detener inmediatamente en modo continuo para errores no fatales
      if (event.error === 'no-speech' && continuousModeRef.current && shouldRestartRef.current) {
        // Se reintentará en onend
        return;
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
        shouldRestartRef.current = false;
      }
    };

    recognition.onend = () => {
      setInterimTranscript('');
      
      // Auto-reinicio en modo continuo
      if (shouldRestartRef.current && continuousModeRef.current) {
        try {
          // Pequeño delay para evitar errores de re-start rápido
          setTimeout(() => {
            if (shouldRestartRef.current) {
              recognition.start();
            } else {
              setIsListening(false);
              cleanupAudioAnalysis();
            }
          }, 100);
          return;
        } catch {
          // Si falla, se detiene
        }
      }
      
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      cleanupAudioAnalysis();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      // Iniciar análisis de audio para waveform
      startAudioAnalysis();
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
      return false;
    }
  }, [voiceSupported, startAudioAnalysis, cleanupAudioAnalysis]);

  /**
   * Detener reconocimiento de voz
   */
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    continuousModeRef.current = false;
    
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
    cleanupAudioAnalysis();
  }, [cleanupAudioAnalysis]);

  // ---- Text-to-Speech ----

  /**
   * Hablar texto en voz alta (Text-to-Speech) con limpieza y chunking
   * @param {string} text - Texto a hablar (puede contener emojis/markdown)
   * @param {Object} options
   * @param {number} options.rate - Velocidad (0.5-2, default 1)
   * @param {number} options.pitch - Tono (0-2, default 1)
   * @param {Function} options.onEnd - Callback cuando termina todo el texto
   * @param {boolean} options.clean - Limpiar emojis/markdown (default true)
   */
  const speak = useCallback((text, options = {}) => {
    if (!ttsSupported || !text) return;

    // Detener cualquier speech anterior
    stopSpeaking();

    const { rate = 1, pitch = 1, onEnd, clean = true } = options;

    // Limpiar texto si es necesario
    const cleanedText = clean ? cleanTextForTTS(text) : text;
    if (!cleanedText) return;

    // Dividir en chunks
    const chunks = chunkTextForTTS(cleanedText);
    utteranceQueueRef.current = [...chunks];
    isSpeakingChunksRef.current = true;

    const speakNextChunk = () => {
      if (utteranceQueueRef.current.length === 0 || !isSpeakingChunksRef.current) {
        setIsSpeaking(false);
        isSpeakingChunksRef.current = false;
        onEnd?.();
        return;
      }

      const chunk = utteranceQueueRef.current.shift();
      const utterance = new SpeechSynthesisUtterance(chunk);
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
        // Hablar siguiente chunk
        speakNextChunk();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        isSpeakingChunksRef.current = false;
        utteranceQueueRef.current = [];
      };

      synthRef.current.speak(utterance);
    };

    speakNextChunk();
  }, [ttsSupported, getSpanishVoice]);

  /**
   * Detener síntesis de voz
   */
  const stopSpeaking = useCallback(() => {
    isSpeakingChunksRef.current = false;
    utteranceQueueRef.current = [];
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
    audioLevel,   // NUEVO: nivel de audio 0-1 para waveform
    
    // Acciones STT
    startListening,
    stopListening,
    toggleListening,
    
    // Acciones TTS
    speak,
    stopSpeaking,
    
    // Utilidades (exportadas para uso externo)
    cleanTextForTTS,
  };
}

export default useVoice;
