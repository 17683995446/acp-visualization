import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

const containerVariants = (staggerDelay: number): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  className,
  staggerDelay = 0.05,
}) => (
  <motion.div
    className={className}
    variants={containerVariants(staggerDelay)}
    initial="hidden"
    animate="visible"
  >
    {children}
  </motion.div>
);

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
}) => (
  <motion.div className={className} variants={itemVariants}>
    {children}
  </motion.div>
);
