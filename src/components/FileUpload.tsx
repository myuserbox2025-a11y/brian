import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesAdded, 
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  className
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple
  } as any);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Upload className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium">點擊或拖拽文件到這裡</p>
        <p className="text-sm text-muted-foreground">
          支持 {Object.values(accept).flat().join(', ')} 格式
        </p>
      </div>
    </div>
  );
};
