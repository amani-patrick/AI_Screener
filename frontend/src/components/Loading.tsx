'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles, Brain, Zap } from 'lucide-react';

interface LoadingProps {
  variant?: 'spinner' | 'pulse' | 'ai' | 'page';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function Loading({ 
  variant = 'spinner', 
  size = 'md', 
  text = 'Loading...',
  fullScreen = false 
}: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      {variant === 'spinner' && (
        <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-500`} />
      )}
      
      {variant === 'pulse' && (
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
          <div className="relative inset-0 rounded-full bg-indigo-500 animate-pulse" />
        </div>
      )}
      
      {variant === 'ai' && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative flex items-center justify-center">
            <Brain className={`${sizeClasses[size]} text-indigo-400`} />
          </div>
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </motion.div>
        </div>
      )}
      
      {variant === 'page' && (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative flex items-center gap-4 px-8 py-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-indigo-400" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="h-3 w-3 text-cyan-400 absolute -top-1 -right-1" />
                </motion.div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">TalentIQ</span>
                <span className="text-sm text-gray-400">{text}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-indigo-500"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {variant !== 'page' && text && (
        <p className="text-gray-400">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#0b1020] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function PageLoader() {
  return <Loading variant="page" fullScreen text="Loading your experience..." />;
}

export function AILoader({ text = 'AI is thinking...' }: { text?: string }) {
  return <Loading variant="ai" size="lg" text={text} />;
}
