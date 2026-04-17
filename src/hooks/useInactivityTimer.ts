import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage inactivity-based locking.
 * Resets a timer on user interactions and flips a 'isLocked' flag when time expires.
 * 
 * @param timeoutMs Duration in milliseconds before locking (default 10 mins)
 */
export const useInactivityTimer = (timeoutMs: number = 600000) => {
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Only set timer if not already locked
    if (!isLocked) {
      timerRef.current = setTimeout(lockApp, timeoutMs);
    }
  }, [isLocked, lockApp, timeoutMs]);

  useEffect(() => {
    // List of events to listen for
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleInteraction = () => resetTimer();

    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, handleInteraction);
    });

    // Initial timer start
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [resetTimer]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  return { isLocked, unlock, resetTimer };
};
