import { useEffect, useCallback } from "react";

export const useKeyboardControls = (
  onKeyDown: (key: string) => void,
  isActive: boolean = true
) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;
    
    // Prevent page scroll for arrow keys and spacebar during gameplay
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    
    // Prevent page navigation
    if (event.code === 'Backspace' && event.target === document.body) {
      event.preventDefault();
    }
    
    onKeyDown(event.code);
  }, [onKeyDown, isActive]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, isActive]);

  return { handleKeyDown };
};