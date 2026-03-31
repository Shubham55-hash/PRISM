import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, ArrowRight, ShieldCheck, Beaker } from 'lucide-react';
import { predictionsApi, LifeStagePrediction } from '../api/predictions';
import { Skeleton } from '../components/Skeleton';

export function InsightsPage() {
  const [predictions, setPredictions] = useState<LifeStagePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const data = await predictionsApi.getLifeEvents();
      // Only show actionable ones for MVP, or all? Let's show all, but styled differently if actioned.
      setPredictions(data);
    } catch (err) {
      console.error('Failed to load predictions', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      await predictionsApi.analyzeUser();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAction = async (id: string) => {
    try {
      await predictionsApi.actionPrediction(id);
      await loadData(); // refresh list
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface mb-2 flex items-center gap-3">
            <Brain className="text-primary" size={32} />
            Predictive Life Assessment
          </h1>
          <p className="text-secondary leading-relaxed max-w-2xl">
            PRISM continuously analyzes your uploaded documents, activity patterns, and profile to proactively suggest required actions and document bundles ahead of major life transitions.
          </p>
        </div>
        
        <button 
          onClick={handleAnalyze} 
          disabled={analyzing || loading}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {analyzing ? (
             <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          ) : (
             <Beaker size={20} />
          )}
          {analyzing ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </motion.div>

      <div className="space-y-6">
        {loading ? (
          <>
            <Skeleton className="w-full h-48 rounded-2xl" />
            <Skeleton className="w-full h-48 rounded-2xl" />
          </>
        ) : predictions.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-outline-variant/30 border-dashed">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-2">No active predictions</h3>
            <p className="text-secondary">Your profile doesn't currently indicate any upcoming major life transitions.</p>
          </div>
        ) : (
          predictions.map((pred, i) => (
             <motion.div
               key={pred.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className={`rounded-2xl border p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden transition-all duration-300
                 ${pred.isActioned 
                    ? 'bg-surface-container-lowest border-outline-variant/50 opacity-70 grayscale-[30%]' 
                    : 'bg-surface border-primary/20 shadow-lg shadow-primary/5 hover:border-primary/40'}`}
             >
               {/* Accent Gradient */}
               {!pred.isActioned && (
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-tertiary"></div>
               )}

               <div className="flex-1 space-y-4 relative z-10 w-full">
                 <div className="flex flex-wrap items-center gap-3">
                   <h3 className="text-xl font-headline font-bold text-on-surface">{pred.title}</h3>
                   <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
                     {Math.round(pred.confidence * 100)}% Confidence
                   </span>
                   {pred.isActioned && (
                     <span className="bg-success/10 text-success flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md">
                       <ShieldCheck size={14} /> Actioned
                     </span>
                   )}
                 </div>

                 <p className="text-secondary leading-relaxed">
                   {pred.description}
                 </p>

                 {pred.suggestedBundle && !pred.isActioned && (
                   <div className="mt-4 pt-4 border-t border-outline-variant/40">
                     <p className="text-sm font-semibold text-on-surface mb-2">Recommended Document Bundle:</p>
                     <div className="flex flex-wrap gap-2">
                       {JSON.parse(pred.suggestedBundle).map((docType: string) => (
                         <span key={docType} className="bg-surface-container-high px-3 py-1 rounded-full text-xs font-medium text-secondary">
                           {docType.replace('_', ' ').toUpperCase()}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               <div className="flex flex-col justify-center min-w-[200px]">
                 {!pred.isActioned ? (
                   <button 
                     onClick={() => handleAction(pred.id)}
                     className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl font-medium shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg transition-all"
                   >
                     Prepare Documents <ArrowRight size={18} />
                   </button>
                 ) : (
                   <button disabled className="w-full flex items-center justify-center pointer-events-none opacity-50 bg-transparent text-secondary border border-outline-variant py-3 rounded-xl font-medium">
                     Documents Prepared
                   </button>
                 )}
               </div>
             </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
