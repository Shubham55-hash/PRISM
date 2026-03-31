import React from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Shield, Users, FileText } from 'lucide-react';

const trustData = [
  { name: 'Jan', score: 85 },
  { name: 'Feb', score: 87 },
  { name: 'Mar', score: 86 },
  { name: 'Apr', score: 89 },
  { name: 'May', score: 91 },
  { name: 'Jun', score: 92 },
];

const usageData = [
  { name: 'Mon', count: 4 },
  { name: 'Tue', count: 7 },
  { name: 'Wed', count: 5 },
  { name: 'Thu', count: 9 },
  { name: 'Fri', count: 12 },
  { name: 'Sat', count: 3 },
  { name: 'Sun', count: 2 },
];

const categoryData = [
  { name: 'Identity', value: 45, color: '#705831' },
  { name: 'Financial', value: 25, color: '#8a4c1e' },
  { name: 'Employment', value: 20, color: '#A0855A' },
  { name: 'Other', value: 10, color: '#dbc3a6' },
];

export function AnalyticsPage() {
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
                <YAxis hide domain={[80, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f2ede5', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#705831', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#705831" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-prism-sidebar rounded-2xl p-6 text-inverse-on-surface shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-prism-accent mb-4">Network Reach</h4>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-headline font-extrabold">124</p>
              <p className="text-xs text-prism-accent/60 mb-1">Verified Connections</p>
            </div>
            <div className="mt-6 h-2 w-full bg-prism-accent/20 rounded-full overflow-hidden">
              <div className="h-full bg-prism-accent w-[75%]" />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Verification Velocity</h4>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <Bar dataKey="count" fill="#705831" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
          <div className="space-y-6">
            {categoryData.map((item, i) => (
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
        </motion.div>

        {/* Recent Insights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-6 bg-[#FAF7F2] rounded-2xl p-8 border border-outline-variant/10 shadow-sm"
        >
          <h3 className="font-headline text-xl font-bold mb-6">Curator Insights</h3>
          <div className="space-y-4">
            {[
              { icon: Shield, title: 'Security Peak', desc: 'Your trust index reached an all-time high of 92 last week.' },
              { icon: Users, title: 'Network Growth', desc: '3 new organizations requested verification in the last 7 days.' },
              { icon: FileText, title: 'Vault Efficiency', desc: '85% of your documents are now verified and ready for instant sharing.' },
            ].map((insight, i) => (
              <div key={i} className="flex gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <insight.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{insight.title}</h4>
                  <p className="text-xs text-secondary mt-1">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
