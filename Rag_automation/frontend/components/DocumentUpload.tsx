"use client"
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle2, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8000/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('success');
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl">
      <CardContent className="p-6">
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
            accept=".pdf,.txt,.docx,.pptx" 
          />
          
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <File className="w-10 h-10 text-indigo-400" />
              <p className="font-medium text-slate-200">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 cursor-pointer">
              <div className="p-4 bg-slate-800 rounded-full">
                <UploadCloud className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-200">Click or drag document to upload</p>
                <p className="text-sm text-slate-500 mt-1">Supports PDF, DOCX, PPTX, TXT</p>
              </div>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={(e) => { e.stopPropagation(); handleUpload(); }} 
              disabled={isUploading || uploadStatus === 'success'}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploadStatus === 'success' && <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />}
              {isUploading ? 'Processing...' : uploadStatus === 'success' ? 'Indexed Successfully' : 'Upload & Index'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
