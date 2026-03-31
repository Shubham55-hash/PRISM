import React from 'react';
import { FileText, Search, Filter, Download, Eye, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';

const docs = [
  { name: 'Passport_Scan_Main.pdf', type: 'Identity', size: '2.4 MB', date: 'Mar 12, 2024' },
  { name: 'Tax_Return_2023.pdf', type: 'Financial', size: '1.1 MB', date: 'Yesterday' },
  { name: 'Utility_Bill_Feb.pdf', type: 'Address', size: '0.8 MB', date: 'Feb 28, 2024' },
  { name: 'Employment_Contract.pdf', type: 'Employment', size: '4.2 MB', date: 'Jan 15, 2024' },
  { name: 'Degree_Certificate.pdf', type: 'Education', size: '3.5 MB', date: 'Dec 10, 2023' },
];

export function DocumentsPage() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Document Vault</h2>
          <p className="text-secondary font-medium mt-2">Securely store and share your verified documents.</p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-md">
          Upload Document
        </button>
      </header>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full bg-background border-none rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 ring-primary/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg text-sm font-bold text-secondary border border-outline-variant/10">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container/30 text-[10px] uppercase tracking-widest text-secondary font-bold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Added</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {docs.map((doc, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-surface-container/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-on-surface">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-surface-container rounded text-secondary">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">{doc.size}</td>
                  <td className="px-6 py-4 text-sm text-secondary">{doc.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-surface-container rounded-full text-primary">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-surface-container rounded-full text-primary">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-surface-container rounded-full text-secondary">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
