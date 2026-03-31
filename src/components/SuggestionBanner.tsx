import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi, useApiMutation } from '../hooks/useApi';
import api from '../api/client';

export function SuggestionBanner() {
  const [closed, setClosed] = useState(false);
  
  const { data: suggestions, refetch, loading: loadingSuggestions } = useApi(() => api.get<any[]>('/api/assistant/suggestions').then(res => res.data), []);
  const { mutate, loading: preparing } = useApiMutation((stage: string) => api.post(`/api/assistant/bundle/${stage}`).then(res => res.data));

  const suggestion = suggestions && suggestions.length > 0 ? suggestions[0] : null;

  if (closed || (!loadingSuggestions && !suggestion)) return null;

  const handleAction = async () => {
    if (!suggestion) return;
    try {
      await mutate(suggestion.stage);
      alert(`${suggestion.title} bundle successfully auto-prepared! Check your Document Vault.`);
      await refetch();
    } catch (e: any) {
      alert(e.message || 'Failed to prepare bundle');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
        className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-6 relative overflow-hidden flex items-start"
      >
        <button 
          onClick={() => setClosed(true)}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-6 flex-shrink-0 animate-pulse">
          <Sparkles className="w-6 h-6 text-primary fill-current" />
        </div>
        
        <div className="flex-1">
          {loadingSuggestions ? (
            <div className="h-16 flex items-center text-sm font-medium text-secondary">
              <Loader className="w-4 h-4 animate-spin mr-2" /> Analyzing contextual patterns...
            </div>
          ) : (
            <>
              <h4 className="font-bold text-on-surface text-lg mb-1">{suggestion.title}</h4>
              <p className="text-sm font-medium text-secondary mb-4 leading-relaxed max-w-lg">
                {suggestion.description}
              </p>
              <button 
                onClick={handleAction}
                disabled={preparing}
                className="bg-primary text-on-primary text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center gap-2"
              >
                {preparing ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {preparing ? 'Preparing Bundle...' : 'Auto-Prepare Documents'} 
                {!preparing && <ArrowRight className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
