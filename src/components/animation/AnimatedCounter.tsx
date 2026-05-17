import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 0.5,
  className,
}) => {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const displayRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      motionValue.set(value);
      prevValue.current = value;
    }
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = String(Math.round(latest));
      }
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <motion.span className={className} ref={displayRef}>
      {Math.round(value)}
    </motion.span>
  );
};
