import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { predictionsApi, LifeStagePrediction } from '../api/predictions';
import { Skeleton } from './Skeleton';

export function LifeInsightsWidget() {
  const [predictions, setPredictions] = useState<LifeStagePrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // First try to fetch existing
        let data = await predictionsApi.getLifeEvents();
        
        // If none exist, we might want to auto-analyze for the MVP 
        if (data.length === 0) {
          await predictionsApi.analyzeUser();
          data = await predictionsApi.getLifeEvents();
        }
        
        setPredictions(data.filter(p => !p.isActioned));
      } catch (err) {
        console.error('Failed to load predictions', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-48 h-6" />
        </div>
        <Skeleton className="w-full h-24 rounded-xl" />
      </div>
    );
  }

  const topPrediction = predictions.length > 0 ? predictions[0] : {
    id: 'onboarding',
    title: 'Welcome to PRISM AI',
    description: 'We are analyzing your digital footprint. Start by uploading more documents to unlock deep life insights and future milestones.',
    confidence: 1.0,
    isActioned: false
  };

  const confidencePercent = Math.round(topPrediction.confidence * 100);

  return (
    <div className="bg-gradient-to-br from-primary-container/30 to-surface-container-low rounded-2xl p-6 border border-primary/20 shadow-sm mb-8 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles size={18} />
            </div>
            <h3 className="font-headline font-semibold text-lg text-on-surface">AI Life Insight</h3>
          </div>
          {predictions.length > 0 && (
            <Link to="/insights" className="text-primary hover:text-primary/80 transition-colors">
              <div className="flex items-center gap-1 text-sm font-medium">
                View All <ChevronRight size={16} />
              </div>
            </Link>
          )}
        </div>

        <div className="bg-surface p-5 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-on-surface">{topPrediction.title}</h4>
            <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
              {predictions.length > 0 ? `${confidencePercent}% Match` : 'Onboarding'}
            </div>
          </div>
          
          <p className="text-sm text-secondary mb-5 leading-relaxed">
            {topPrediction.description}
          </p>

          <Link to={predictions.length > 0 ? "/insights" : "/documents"}>
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-all hover:gap-3">
              <FileText size={16} /> {predictions.length > 0 ? "Prepare Documents" : "Upload Documents"} <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
