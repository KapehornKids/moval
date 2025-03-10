
import { useEffect, useState } from "react";

// Intersection Observer hook for reveal animations
export function useReveal(threshold = 0.1, rootMargin = "0px") {
  const [isRevealed, setIsRevealed] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(ref);
    
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, threshold, rootMargin]);

  return [setRef, isRevealed] as const;
}

// Staggered animation utility for lists
export function staggeredClasses(index: number, baseClass: string, delayIncrement = 50) {
  const delay = index * delayIncrement;
  return `${baseClass} animate-delay-${delay}`;
}

// Animation variants for framer-motion (if we add it later)
export const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

// Utility class for adding transition delays
export function getDelayClass(index: number) {
  const delays = [
    'delay-0',
    'delay-75',
    'delay-100',
    'delay-150',
    'delay-200',
    'delay-300',
    'delay-500',
    'delay-700'
  ];
  
  const safeIndex = Math.min(index, delays.length - 1);
  return delays[safeIndex];
}

// Animation class generator
export function getAnimationClass(type: 'fade' | 'slide' | 'scale', index = 0) {
  const delay = getDelayClass(index);
  
  switch (type) {
    case 'fade':
      return `animate-fade-in ${delay}`;
    case 'slide':
      return `animate-slide-in ${delay}`;
    case 'scale':
      return `animate-scale-in ${delay}`;
    default:
      return `animate-fade-in ${delay}`;
  }
}
