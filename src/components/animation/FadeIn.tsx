import React from 'react';
import { motion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.4,
  className,
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration, delay, ease: 'easeOut' }}
    style={{ minHeight: 0 }} // Ensure container has layout for ResponsiveContainer
  >
    {children}
  </motion.div>
);
