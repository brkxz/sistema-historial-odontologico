// ============================================================
// Hook de Feedback Sonoro — Web Audio API
// Genera sonidos programáticos suaves y profesionales
// Sin archivos de audio externos
// ============================================================

import { useRef, useCallback } from 'react';

/**
 * Hook para generar sonidos de feedback usando Web Audio API
 * Todos los sonidos son generados programáticamente (sin archivos)
 */
export function useSoundFeedback() {
  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume si está suspended (por autoplay policy)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Reproducir un tono con envolvente suave
   */
  const playTone = useCallback((frequency, duration, type = 'sine', volume = 0.15) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Envolvente suave (attack-decay)
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Silently fail if Web Audio API not available
    }
  }, [getAudioContext]);

  /**
   * Sonido de inicio de escucha — dos tonos ascendentes rápidos
   */
  const playStartSound = useCallback(() => {
    playTone(523.25, 0.12, 'sine', 0.12); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.12), 80); // E5
  }, [playTone]);

  /**
   * Sonido de detener escucha — dos tonos descendentes
   */
  const playStopSound = useCallback(() => {
    playTone(659.25, 0.1, 'sine', 0.1); // E5
    setTimeout(() => playTone(523.25, 0.15, 'sine', 0.1), 70); // C5
  }, [playTone]);

  /**
   * Sonido de confirmación — acorde mayor breve
   */
  const playConfirmSound = useCallback(() => {
    playTone(523.25, 0.2, 'sine', 0.08); // C5
    playTone(659.25, 0.2, 'sine', 0.08); // E5
    playTone(783.99, 0.25, 'sine', 0.08); // G5
  }, [playTone]);

  /**
   * Sonido de envío de mensaje — swoosh suave
   */
  const playSendSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Silently fail
    }
  }, [getAudioContext]);

  /**
   * Sonido de error — tono bajo breve
   */
  const playErrorSound = useCallback(() => {
    playTone(220, 0.15, 'triangle', 0.1);
    setTimeout(() => playTone(196, 0.2, 'triangle', 0.1), 100);
  }, [playTone]);

  return {
    playStartSound,
    playStopSound,
    playConfirmSound,
    playSendSound,
    playErrorSound,
  };
}

export default useSoundFeedback;
