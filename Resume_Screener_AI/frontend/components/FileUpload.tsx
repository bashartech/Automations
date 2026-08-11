'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (text: string, filename: string) => void;
  loading: boolean;
}

export default function FileUpload({ onFileUpload, loading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOCX, or image files.');
      setUploading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8002/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const data = await response.json();
      onFileUpload(data.extracted_text, data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const isBusy = loading || uploading;

  return (
    <div className="w-full">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          disabled={isBusy}
        />
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}
            ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isBusy ? (
              <>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <p className="text-sm text-muted-foreground">Extracting text from file...</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, PNG, JPG (MAX. 10MB)</p>
              </>
            )}
          </div>
        </label>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
