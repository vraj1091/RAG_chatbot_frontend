import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      const [documentsData, statsData] = await Promise.all([
        apiService.getDocuments(),
        apiService.getDocumentStats()
      ]);
      setDocuments(documentsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      setUploading(true);
      try {
        const response = await apiService.uploadDocument(file);
        setDocuments(prev => [response.document, ...prev]);
        toast.success(`${file.name} uploaded successfully!`);

        const updatedStats = await apiService.getDocumentStats();
        setStats(updatedStats);
      } catch (err) {
        console.error('Upload failed:', err);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
      }
    }
    event.target.value = ''; // Reset file input
  };

  const deleteDocument = async (documentId, filename) => {
    if (!window.confirm(`Delete "${filename}"?`)) return;

    try {
      await apiService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');

      const updatedStats = await apiService.getDocumentStats();
      setStats(updatedStats);
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  const formatFileSize = (bytes) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="large" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          📚 Knowledge Base ({documents.length} documents)
        </h1>
        <p className="text-gray-600 mt-1">Manage your AI knowledge base files - upload, view, and delete documents</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📤</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload documents to knowledge base</h3>
          <p className="text-gray-500 mb-4">Supports PDF, DOCX, TXT, and image files (PNG, JPG)</p>

          <label className="btn-primary cursor-pointer inline-flex items-center">
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? <><LoadingSpinner size="small" color="white" className="mr-2" />Uploading...</> : '📁 Choose Files'}
          </label>

          <p className="text-xs text-gray-500 mt-2">Maximum file size: 25MB</p>
        </div>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Documents</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="space-y-3 p-6">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {document.document_type === 'image' ? '🖼️' : '📄'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-md">
                        {document.original_filename}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.file_type.toUpperCase()} • {formatFileSize(document.file_size)} • {getStatusIcon(document.processing_status)} {document.processing_status}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDocument(document.id, document.original_filename)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Delete document"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📚</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents in your knowledge base</h3>
          <p className="text-gray-500 mb-6">Upload your first document to start building your AI-powered knowledge base.</p>
        </div>
      )}
    </div>
  );
}

export default KnowledgeBase;