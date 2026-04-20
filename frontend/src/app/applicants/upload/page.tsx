'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Upload, 
  ArrowLeft, 
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  X
} from 'lucide-react';
import { uploadCSV } from '@/lib/api';
import { addToast } from '@/components/Toast';

export default function UploadCSVPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    totalRows: number;
    importedCount: number;
    applicantIds: string[];
    rowErrors: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadCSV(file);
      setResult(response.data.data);
      addToast({ type: 'success', title: 'Upload complete', message: `${response.data.data.importedCount} applicants imported` });
    } catch (error: any) {
      console.error('Upload failed:', error);
      addToast({ type: 'error', title: 'Upload failed', message: error.response?.data?.error || 'Please try again' });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `fullName,email,headline,skills,location,city,country,experience_years
John Doe,john@example.com,Senior React Developer,"React,TypeScript,Node.js",Rwanda,Kigali,Rwanda,5
Jane Smith,jane@example.com,Full-Stack Engineer,"Python,Django,PostgreSQL",Kenya,Nairobi,Kenya,4
Bob Johnson,bob@example.com,DevOps Engineer,"AWS,Kubernetes,Docker",Nigeria,Lagos,Nigeria,6`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applicants_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0b1020]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/applicants"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applicants
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Upload className="h-8 w-8 text-emerald-400" />
            Bulk Import Applicants
          </h1>
          <p className="text-gray-400 mt-1">Upload a CSV or Excel file to import multiple candidates at once</p>
        </motion.div>

        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Template Download */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Download className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Download Template</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Use our CSV template to ensure your data is formatted correctly.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download template.csv
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-lg font-medium text-white mb-1">{file.name}</p>
                  <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-4 text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-white mb-2">
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-gray-400 text-sm">
                    Supports CSV and Excel files (.csv, .xlsx)
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Required Columns
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <code className="text-sm text-gray-300">fullName</code>
                  <span className="text-xs text-gray-500">(required)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <code className="text-sm text-gray-300">email</code>
                  <span className="text-xs text-gray-500">(required, unique)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  <code className="text-sm text-gray-300">headline</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  <code className="text-sm text-gray-300">skills</code>
                  <span className="text-xs text-gray-500">(comma-separated)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  <code className="text-sm text-gray-300">location / city / country</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  <code className="text-sm text-gray-300">experience_years</code>
                </div>
              </div>
            </div>

            {/* Upload Button */}
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      Upload & Import
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Results View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
              {result.importedCount === result.totalRows ? (
                <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-10 w-10 text-amber-400" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-white mb-2">
                {result.importedCount === result.totalRows
                  ? 'Import Successful!'
                  : 'Import Completed with Warnings'}
              </h2>
              <p className="text-gray-400">
                {result.importedCount} of {result.totalRows} applicants imported successfully
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-3xl font-bold text-white">{result.totalRows}</p>
                <p className="text-sm text-gray-400">Total Rows</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">{result.importedCount}</p>
                <p className="text-sm text-gray-400">Imported</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{result.rowErrors.length}</p>
                <p className="text-sm text-gray-400">Errors</p>
              </div>
            </div>

            {/* Errors */}
            {result.rowErrors.length > 0 && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  Import Errors
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.rowErrors.map((error, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5">
                      <span className="text-red-400 font-mono text-sm">Row {error.row}</span>
                      <span className="text-gray-300 text-sm">{error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                }}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Upload Another File
              </button>
              <Link
                href="/applicants"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                View Applicants
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
