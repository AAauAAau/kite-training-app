import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { useAppStore } from '../store';

let audioContext: AudioContext | null = null;

export function primeTimerAudio(): void {
  const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  audioContext ??= new Context();
  if (audioContext.state === 'suspended') void audioContext.resume();
}

function signal(audioEnabled: boolean, frequency = 880): void {
  navigator.vibrate?.([180, 80, 180]);
  if (!audioEnabled || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.12, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.17);
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
}

function formatStopwatch(milliseconds: number): string {
  const hundredths = Math.max(0, Math.floor(milliseconds / 10));
  const minutes = Math.floor(hundredths / 6000);
  const seconds = Math.floor(hundredths / 100) % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths % 100).padStart(2, '0')}`;
}

export function TimerDock() {
  const { activeTimer, settings, stopTimer, updateSettings } = useAppStore();
  const [now, setNow] = useState(Date.now());
  const signaledEnd = useRef(false);
  const lastPaceBeat = useRef(0);

  useEffect(() => {
    signaledEnd.current = false;
    lastPaceBeat.current = 0;
  }, [activeTimer?.startedAt]);

  useEffect(() => {
    if (!activeTimer) return;
    let timeout = 0;
    const tick = () => {
      setNow(Date.now());
      timeout = window.setTimeout(tick, 250);
    };
    tick();
    const visible = () => setNow(Date.now());
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [activeTimer]);

  useEffect(() => {
    if (!activeTimer) return;
    let lock: { release: () => Promise<void> } | null = null;
    const request = async () => {
      if (document.visibilityState !== 'visible') return;
      const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
      if (wakeLock) {
        try { lock = await wakeLock.request('screen'); } catch { /* Wake Lock is best effort. */ }
      }
    };
    void request();
    const visible = () => { if (document.visibilityState === 'visible') void request(); };
    document.addEventListener('visibilitychange', visible);
    return () => {
      document.removeEventListener('visibilitychange', visible);
      if (lock) void lock.release();
    };
  }, [activeTimer]);

  const audioEnabled = settings.timerAudioEnabled !== false;
  const elapsedMs = activeTimer ? Math.max(0, now - activeTimer.startedAt) : 0;
  const remaining = activeTimer?.endTimestamp
    ? Math.max(0, Math.ceil((activeTimer.endTimestamp - now) / 1000))
    : 0;
  const finished = Boolean(activeTimer?.endTimestamp && now >= activeTimer.endTimestamp);

  useEffect(() => {
    if (!activeTimer) return;
    if (activeTimer.mode === 'pace') {
      const beat = Math.min(activeTimer.defaultSec ?? 4, Math.floor((now - activeTimer.startedAt) / 1000));
      if (beat > 0 && beat > lastPaceBeat.current && !finished) {
        lastPaceBeat.current = beat;
        signal(audioEnabled, 660);
      }
    }
    if (finished && !signaledEnd.current) {
      signaledEnd.current = true;
      signal(audioEnabled);
    }
  }, [activeTimer, audioEnabled, finished, now]);

  if (!activeTimer) return null;
  const shownTime = activeTimer.mode === 'countup' ? formatStopwatch(elapsedMs) : formatTime(remaining);

  return (
    <aside className={`timer-dock ${finished ? 'finished' : ''}`} aria-live="polite">
      <div>
        <small>{activeTimer.kind === 'rest' ? t('timer.rest') : activeTimer.mode === 'pace' ? t('timer.pace') : t('timer.timer')}</small>
        <strong>{activeTimer.label}</strong>
      </div>
      <b>{finished ? t('timer.done') : shownTime}</b>
      <button type="button" onClick={() => void stopTimer()}>{activeTimer.mode === 'countup' ? t('common.timerStop') : t('timer.close')}</button>
      <button
        type="button"
        className="audio-toggle"
        aria-label={audioEnabled ? t('timer.audioOffAria') : t('timer.audioOnAria')}
        onClick={() => { primeTimerAudio(); void updateSettings({ timerAudioEnabled: !audioEnabled }); }}
      >{audioEnabled ? t('timer.audioOn') : t('timer.audioOff')}</button>
    </aside>
  );
}
