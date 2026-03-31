import React from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Shield, Users, FileText, Loader } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { analyticsApi } from '../api/analytics';

const ICONS: Record<string, React.ElementType> = {
  security: Shield,
  network: Users,
  vault: FileText
};

export function AnalyticsPage() {
  const { data: trustData } = useApi(() => analyticsApi.getTrustTrend(), []);
  const { data: usageData } = useApi(() => analyticsApi.getVerificationVelocity(), []);
  const { data: categoryData } = useApi(() => analyticsApi.getDataDistribution(), []);
  const { data: network } = useApi(() => analyticsApi.getNetworkReach(), []);
  const { data: insights } = useApi(() => analyticsApi.getInsights(), []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Analytics</h2>
        <p className="text-secondary font-medium mt-2">Insights into your digital presence and trust metrics.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Trust Index Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-headline text-xl font-bold">Trust Index Trend</h3>
              <p className="text-xs text-secondary">Historical performance of your security score</p>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+8.2% this year</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {!trustData ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trustData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#705831" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#705831" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2ede5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6e5b44'}} dy={10} />
                  <YAxis hide domain={['dataMin - 5', 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f2ede5', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#705831', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#705831" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-prism-sidebar rounded-2xl p-6 text-inverse-on-surface shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-prism-accent mb-4">Network Reach</h4>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-headline font-extrabold">{network ? network.totalConnections : '…'}</p>
              <p className="text-xs text-prism-accent/60 mb-1">Verified Connections</p>
            </div>
            <div className="mt-6 h-2 w-full bg-prism-accent/20 rounded-full overflow-hidden">
              <div className="h-full bg-prism-accent w-[75%]" />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Verification Velocity</h4>
            <div className="h-[120px] w-full">
              {!usageData ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData}>
                    <Bar dataKey="count" fill="#705831" radius={[4, 4, 0, 0]} />
                    <Tooltip cursor={{fill: '#f2ede5'}} contentStyle={{ borderRadius: '8px' }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-6 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <h3 className="font-headline text-xl font-bold mb-8">Data Distribution</h3>
          {!categoryData ? (
            <div className="h-48 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {categoryData.filter(i => i.value > 0).map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-on-surface">{item.name}</span>
                    <span className="text-secondary">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full" 
                      style={{ backgroundColor: item.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Insights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-6 bg-[#FAF7F2] rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <h3 className="font-headline text-xl font-bold mb-6">Curator Insights</h3>
          {!insights ? (
            <div className="h-48 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, i) => {
                const Icon = ICONS[insight.type] || FileText;
                return (
                  <div key={i} className="flex gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{insight.title}</h4>
                      <p className="text-xs text-secondary mt-1">{insight.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
