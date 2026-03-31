import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, Shield, Users, FileText, Loader } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getSummary, getNetworkReach, getInsights } from '../api/analytics';

const ICONS: Record<string, React.ElementType> = {
  security: Shield,
  network: Users,
  vault: FileText
};

const COLORS = ['#705831', '#e8e1d5'];

export function AnalyticsPage() {
  const { data: summary, loading } = useApi(() => getSummary(), []);
  const { data: network } = useApi(() => getNetworkReach(), []);
  const { data: insights } = useApi(() => getInsights(), []);

  const trustScoreTrend = useMemo(() => {
    if (!summary?.trustScoreHistory) return [];
    return summary.trustScoreHistory.map((item: any) => ({
      name: `${item.month}/${item.year.toString().slice(-2)}`,
      score: item.score
    }));
  }, [summary]);

  const docData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Verified Documents', value: summary.verifiedDocuments },
      { name: 'Unverified Documents', value: summary.totalDocuments - summary.verifiedDocuments }
    ];
  }, [summary]);

  // Mocked Consent Activity over 6 months based on activeConsents
  const consentTrend = useMemo(() => {
    if (!summary) return [];
    const base = Math.max(1, Math.round(summary.activeConsents / 3));
    return [
      { name: 'Jan', count: base },
      { name: 'Feb', count: base + 1 },
      { name: 'Mar', count: Math.max(0, base - 1) },
      { name: 'Apr', count: base + 2 },
      { name: 'May', count: base * 2 },
      { name: 'Jun', count: summary.activeConsents },
    ];
  }, [summary]);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Analytics</h2>
        <p className="text-secondary font-medium mt-2">Insights into your digital presence and trust metrics.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Trust Index Trend (Line Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-headline text-xl font-bold">TrustScore History</h3>
              <p className="text-xs text-secondary">Historical performance of your centralized security score</p>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Current: {summary.trustScore}</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {trustScoreTrend.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-secondary">No historical data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trustScoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2ede5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6e5b44'}} dy={10} />
                  <YAxis hide domain={['dataMin - 10', 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f2ede5', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#705831', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#705831" strokeWidth={4} dot={{ r: 6, fill: '#705831', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Verification Breakdown (Donut Chart) */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm flex flex-col items-center">
          <h4 className="text-sm font-bold tracking-widest text-secondary self-start mb-2">DOCUMENT VERIFICATIONS</h4>
          <div className="h-[220px] w-full mt-4 relative flex justify-center items-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={docData} 
                  cx="50%" cy="50%" 
                  innerRadius={70} 
                  outerRadius={95} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {docData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', shadow: 'sm' }} 
                  itemStyle={{ color: '#333', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Inner Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-3xl font-headline font-extrabold text-on-surface leading-none">{summary.verifiedDocuments}</span>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">Verified</span>
            </div>
          </div>
          <div className="w-full flex justify-between px-4 mt-6 text-xs font-bold text-secondary">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /> Verified</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#e8e1d5]" /> Pending</div>
          </div>
        </div>

        {/* Consent Activity (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-6 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <h3 className="font-headline text-xl font-bold mb-8">Consent Activity (Monthly)</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consentTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2ede5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6e5b44'}} dy={10} />
                <Tooltip cursor={{fill: '#f2ede5'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="count" fill="#705831" radius={[4, 4, 0, 0]} barSize={40}>
                  {consentTrend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === consentTrend.length - 1 ? '#705831' : '#b3a38f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Network Reach (Mocked Insights style side-panel) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-6 bg-prism-sidebar rounded-2xl p-8 shadow-sm flex flex-col justify-between overflow-hidden relative"
        >
          <div className="relative z-10">
            <h3 className="font-headline text-xl font-bold mb-6 text-inverse-on-surface">Curator Insights</h3>
            {!insights ? (
              <Loader className="w-6 h-6 animate-spin text-prism-accent" />
            ) : (
              <div className="space-y-4">
                {insights.map((insight, i) => {
                  const Icon = ICONS[insight.type] || FileText;
                  return (
                    <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <div className="w-10 h-10 rounded-lg bg-prism-accent/20 flex items-center justify-center text-prism-accent flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-inverse-on-surface">{insight.title}</h4>
                        <p className="text-xs text-white/60 mt-1">{insight.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
