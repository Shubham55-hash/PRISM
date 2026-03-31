import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Loader, AlertCircle, Plus, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { getSuggestions } from '../api/assistant';

export function SuggestionBanner() {
  const [closed, setClosed] = useState(false);
  
  const { data: suggestions, loading: loadingSuggestions } = useApi(() => getSuggestions(), []);

  if (closed || (!loadingSuggestions && (!suggestions || suggestions.length === 0))) return null;

  // Get highest priority suggestion
  const topSuggestion = suggestions?.find((s: any) => s.priority === 'high') || suggestions?.[0];

  const priorityStyles = {
    high: { bg: 'from-error/10 to-transparent', border: 'border-error/20', dot: 'bg-error' },
    medium: { bg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    low: { bg: 'from-primary/10 to-transparent', border: 'border-primary/20', dot: 'bg-primary' }
  };

  const styles = topSuggestion ? priorityStyles[topSuggestion.priority] : priorityStyles.low;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
        className={`bg-gradient-to-r ${styles.bg} border ${styles.border} rounded-xl p-6 relative overflow-hidden flex items-start`}
      >
        <button 
          onClick={() => setClosed(true)}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-12 h-12 ${styles.dot === 'bg-error' ? 'bg-error/20' : styles.dot === 'bg-amber-500' ? 'bg-amber-500/20' : 'bg-primary/20'} rounded-full flex items-center justify-center mr-6 flex-shrink-0`}>
          {topSuggestion?.priority === 'high' ? (
            <AlertCircle className="w-6 h-6 text-error" />
          ) : topSuggestion?.priority === 'medium' ? (
            <Zap className="w-6 h-6 text-amber-600" />
          ) : (
            <Sparkles className="w-6 h-6 text-primary" />
          )}
        </div>
        
        <div className="flex-1 pr-4">
          {loadingSuggestions ? (
            <div className="h-16 flex items-center text-sm font-medium text-secondary">
              <Loader className="w-4 h-4 animate-spin mr-2" /> Analyzing your profile...
            </div>
          ) : topSuggestion ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-on-surface text-lg">{topSuggestion.title}</h4>
                <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-widest ${
                  topSuggestion.priority === 'high' ? 'bg-error/20 text-error' :
                  topSuggestion.priority === 'medium' ? 'bg-amber-500/20 text-amber-600' :
                  'bg-primary/20 text-primary'
                }`}>
                  {topSuggestion.priority}
                </span>
              </div>
              <p className="text-sm font-medium text-secondary mb-4 leading-relaxed max-w-lg">
                {topSuggestion.description}
              </p>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

