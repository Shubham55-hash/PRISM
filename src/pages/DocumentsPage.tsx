import React, { useState, useRef } from 'react';
import { FileText, Search, Filter, Download, Eye, MoreVertical, CheckCircle2, Clock, Trash2, Loader, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { documentsApi } from '../api/documents';
import { BASE_URL } from '../api/client';

const TYPE_COLORS: Record<string, string> = {
  identity: 'bg-primary/10 text-primary',
  financial: 'bg-amber-100 text-amber-700',
  address: 'bg-blue-100 text-blue-700',
  employment: 'bg-green-100 text-green-700',
  education: 'bg-purple-100 text-purple-700',
  medical: 'bg-red-100 text-red-700',
  other: 'bg-surface-container text-secondary',
};

export function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, loading, refetch } = useApi(
    () => documentsApi.list({ search: search || undefined, type: typeFilter || undefined, page }),
    [search, typeFilter, page]
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      await documentsApi.upload(file);
      refetch();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await documentsApi.verify(id);
      refetch();
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await documentsApi.delete(id);
    refetch();
  };

  const handleView = async (id: string) => {
    try {
      const token = localStorage.getItem('prism_token');
      const response = await fetch(`${BASE_URL}/api/documents/${id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('View failed');
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        window.open(data.downloadUrl?.startsWith('http') ? data.downloadUrl : `${BASE_URL}${data.downloadUrl}`, '_blank');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      window.open(`${BASE_URL}/api/documents/${id}/download`, '_blank');
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const token = localStorage.getItem('prism_token');
      const response = await fetch(`${BASE_URL}/api/documents/${id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Download failed');
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        // Backend returned a URL (seeded doc without physical file)
        const data = await response.json();
        window.open(data.downloadUrl?.startsWith('http') ? data.downloadUrl : `${BASE_URL}${data.downloadUrl}`, '_blank');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(`${BASE_URL}/api/documents/${id}/download`, '_blank');
    }
  };

  const docs = data?.documents || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Document Vault</h2>
          <p className="text-secondary font-medium mt-2">
            Securely store and share your verified documents.
            {pagination && <span className="ml-2 text-primary font-bold">{pagination.total} total</span>}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {uploadError && (
            <span className="text-xs text-error font-medium bg-error/5 px-3 py-1 rounded-lg">{uploadError}</span>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-primary text-on-primary px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
          >
            {uploading ? <Loader className="w-3 h-3 animate-spin" /> : null}
            {uploading ? 'Uploading…' : 'Upload Document'}
          </button>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-6 border-b border-outline-variant/10 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-background border-none rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 ring-primary/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-background border border-outline-variant/10 rounded-lg px-4 py-2 text-sm font-bold text-secondary outline-none focus:ring-1 ring-primary/20"
          >
            <option value="">All Types</option>
            {['identity', 'financial', 'address', 'employment', 'education', 'medical'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          {(search || typeFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); setPage(1); }}
              className="flex items-center gap-1 px-3 py-2 bg-error/5 text-error rounded-lg text-xs font-bold">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-20 text-secondary">
              <FileText className="w-12 h-12 mx-auto mb-3 text-outline" />
              <p className="font-bold">No documents found</p>
              <p className="text-sm mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container/30 text-[10px] uppercase tracking-widest text-secondary font-bold">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                <AnimatePresence>
                  {docs.map((doc, i) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-surface-container/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-on-surface max-w-[220px] truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${TYPE_COLORS[doc.documentType || 'other'] || TYPE_COLORS.other}`}>
                          {doc.documentType ? doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1) : 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary">{doc.sizeFormatted}</td>
                      <td className="px-6 py-4 text-sm text-secondary">{doc.dateAdded}</td>
                      <td className="px-6 py-4">
                        {doc.isVerified ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-primary">
                            <CheckCircle2 className="w-3 h-3 fill-current" /> Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerify(doc.id)}
                            disabled={verifyingId === doc.id}
                            className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors"
                          >
                            {verifyingId === doc.id
                              ? <Loader className="w-3 h-3 animate-spin" />
                              : <Clock className="w-3 h-3" />}
                            {verifyingId === doc.id ? 'Issuing…' : 'Issue VC'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleView(doc.id)}
                            title="View document"
                            className="p-2 hover:bg-surface-container rounded-full text-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id, doc.originalFilename || doc.name)}
                            title="Download document"
                            className="p-2 hover:bg-surface-container rounded-full text-primary"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(doc.id)} className="p-2 hover:bg-error/10 rounded-full text-error">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-outline-variant/10 flex items-center justify-between">
            <span className="text-xs text-secondary">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded text-xs font-bold disabled:opacity-40 hover:bg-surface-container transition-colors">← Prev</button>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded text-xs font-bold disabled:opacity-40 hover:bg-surface-container transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
