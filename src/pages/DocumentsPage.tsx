import React, { useState, useRef } from 'react';
import { FileText, Search, Download, Eye, CheckCircle2, Clock, Trash2, Loader, X, UploadCloud, FileJson, BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApi } from '../hooks/useApi';
import { getDocuments, uploadDocument, verifyDocument, deleteDocument, getDownloadUrl } from '../api/documents';
import { DocumentRowSkeleton } from '../components/Skeleton';
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
  const [isDragging, setIsDragging] = useState(false);
  const [vcModalData, setVcModalData] = useState<any>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, loading, refetch } = useApi(
    () => getDocuments({ search: search || undefined, type: typeFilter || undefined, page }),
    [search, typeFilter, page]
  );

  const performUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      await uploadDocument(file);
      refetch();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await performUpload(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await performUpload(file);
  };

  const handleVerify = async (id: string, docName: string) => {
    setVerifyingId(id);
    try {
      const res = (await verifyDocument(id)) as any;
      setVcModalData({ ...res, documentName: docName });
      refetch();
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await deleteDocument(id);
    refetch();
  };

  const handleView = async (id: string) => {
    try {
      const res = await getDownloadUrl(id);
      if (res.downloadUrl) {
        const url = res.downloadUrl.startsWith('http') ? res.downloadUrl : `${BASE_URL}${res.downloadUrl}`;
        window.open(url, '_blank');
      }
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
      {vcModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#F5F0E8] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative border border-primary/20">
            <button onClick={() => setVcModalData(null)} className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto">
              <BadgeCheck className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-2xl font-bold font-headline text-center text-on-surface mb-2">Verifiable Credential Issued</h3>
            <p className="text-center text-secondary mb-8 font-medium">Your document "{vcModalData.documentName}" has been verified successfully on the DID network.</p>
            <div className="space-y-4 bg-white p-4 rounded-xl border border-outline-variant/10 text-sm">
              <div>
                <span className="block text-[10px] uppercase text-outline tracking-widest font-bold mb-1">Credential ID</span>
                <span className="font-mono text-on-surface break-all bg-surface-container-lowest px-2 py-1 rounded">{vcModalData.vcCredentialId}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-outline tracking-widest font-bold mb-1">DID Issuer Key</span>
                <span className="font-mono text-secondary break-all">{vcModalData.document?.vcProof ? JSON.parse(vcModalData.document.vcProof).verificationMethod : 'did:prism:key-1'}</span>
              </div>
            </div>
            <button onClick={() => setVcModalData(null)} className="mt-8 w-full bg-primary text-on-primary py-3 rounded-lg font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Done
            </button>
          </motion.div>
        </div>
      )}

      <header>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Document Vault</h2>
        <p className="text-secondary font-medium mt-2">
          Securely store and share your verified documents.
          {pagination && <span className="ml-2 text-primary font-bold">{pagination.total} total</span>}
        </p>
      </header>

      {/* Drag & Drop Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center text-center overflow-hidden
          ${isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50'}`}
      >
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="font-bold text-on-surface">Uploading Document...</p>
            <p className="text-sm text-secondary">Encrypting and analyzing via PRISM node</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-primary text-on-primary shadow-lg scale-110' : 'bg-surface-container text-secondary'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Drag & Drop files here</h3>
            <p className="text-secondary text-sm mb-6 max-w-sm">Upload identity, medical, or financial documents. PDF, PNG, JPG up to 10MB.</p>
            <button 
              onClick={() => fileRef.current?.click()}
              className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-md"
            >
              Browse Files
            </button>
            {uploadError && <p className="mt-4 text-xs font-bold text-error bg-error/10 px-3 py-1 rounded-full">{uploadError}</p>}
          </div>
        )}
      </div>

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
              {loading ? (
                <>
                  <DocumentRowSkeleton />
                  <DocumentRowSkeleton />
                  <DocumentRowSkeleton />
                  <DocumentRowSkeleton />
                  <DocumentRowSkeleton />
                </>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-secondary">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-outline" />
                    <p className="font-bold">No documents found</p>
                    <p className="text-sm mt-1">Upload your first document to get started</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {docs.map((doc, i) => {
                    const isExpanded = expandedDocId === doc.id;
                    const ocrObj = typeof doc.ocrExtractedFields === 'string' ? JSON.parse(doc.ocrExtractedFields) : doc.ocrExtractedFields;
                    const hasOcr = ocrObj && Object.keys(ocrObj).length > 0;

                    return (
                    <React.Fragment key={doc.id}>
                      <motion.tr
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.03 }}
                        className={`hover:bg-surface-container/20 transition-colors group ${isExpanded ? 'bg-surface-container/10' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 relative">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-on-surface max-w-[180px] lg:max-w-[220px] truncate">{doc.name}</span>
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
                              onClick={() => handleVerify(doc.id, doc.name)}
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
                          <div className="flex justify-end gap-2 text-primary">
                            {hasOcr && (
                              <button
                                onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                                title="View extracted data"
                                className="p-2 hover:bg-surface-container rounded-full"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleView(doc.id)}
                              title="View document"
                              className="p-2 hover:bg-surface-container rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc.id, doc.originalFilename || doc.name)}
                              title="Download document"
                              className="p-2 hover:bg-surface-container rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(doc.id)} className="p-2 hover:bg-error/10 rounded-full text-error opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                      {/* OCR Expansion Row */}
                      <AnimatePresence>
                        {isExpanded && hasOcr && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={6} className="bg-[#FAF7F2] p-0 overflow-hidden border-t border-b border-primary/10">
                              <div className="p-6 md:p-8 flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <FileJson className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 text-sm">
                                  <h4 className="font-bold text-on-surface mb-4 tracking-wide flex items-center gap-2">
                                    Machine Extracted Fields
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold uppercase tracking-widest">Auto-OCR</span>
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                                    {Object.entries(ocrObj).map(([key, val]) => (
                                      <div key={key}>
                                        <p className="text-[10px] uppercase text-outline font-bold tracking-widest">{key}</p>
                                        <p className="font-medium text-secondary truncate">{String(val)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  )})}
                </AnimatePresence>
              )}
            </tbody>
          </table>
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
