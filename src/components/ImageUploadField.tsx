import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Edit2 } from 'lucide-react';

interface ImageUploadFieldProps {
  value: File | null;
  preview: string | null;
  onChange: (file: File | null) => void;
  label: string;
  currentImageUrl?: string;
}

export default function ImageUploadField({
  value,
  preview,
  onChange,
  label,
  currentImageUrl,
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onChange(file);
        setIsEditing(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      onChange(files[0]);
      setIsEditing(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div>
      <label className="block text-white font-semibold mb-2">{label}</label>

      {preview && !isEditing ? (
        <div className="relative mb-4">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleEdit}
            className="absolute top-2 right-2 p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center space-x-1"
            title="Change image"
          >
            <Edit2 className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-rose-400 bg-rose-500/10'
              : 'border-white/20 hover:border-rose-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-300 text-sm mb-1">
            Drag and drop image here or click to select
          </p>
          <p className="text-gray-500 text-xs">JPG, PNG up to 10MB</p>
        </div>
      )}

      {isEditing && preview && (
        <button
          type="button"
          onClick={handleRemove}
          className="mt-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
