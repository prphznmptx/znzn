import { useState, useRef } from 'react';
import { X, Film, Loader, Check, AlertCircle, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { extractDuration } from '../lib/getDuration';

interface VideoUploadWithMuxForMasterclassProps {
  userId: string;
  onVideoSelected: (playbackId: string, videoUploadId: string, duration?: string) => void;
}

export default function VideoUploadWithMuxForMasterclass({
  userId,
  onVideoSelected
}: VideoUploadWithMuxForMasterclassProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [videoUploadId, setVideoUploadId] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

  function validate(file: File) {
    if (!ALLOWED_TYPES.includes(file.type))
      return 'Only MP4, WebM, and MOV files are allowed.';
    if (file.size > 500 * 1024 * 1024)
      return 'File must be under 500MB.';
    return null;
  }

  function selectFile(file: File) {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setVideoFile(file);
    setError(null);
  }

  async function handleUpload() {
    if (!videoFile) {
      setError('Please select a video first.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 0️⃣ EXTRACT VIDEO DURATION
      let extractedDuration: string | null = null;
      try {
        extractedDuration = await extractDuration(videoFile);
        setVideoDuration(extractedDuration);
      } catch (durationError) {
        extractedDuration = null;
      }
      // 1️⃣ UPLOAD TO B2 USING SERVER-SIDE FUNCTION (NO CORS)
      const filename = `masterclass_videos/${userId}/${Date.now()}-${videoFile.name}`;

      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("filename", filename);
      formData.append("contentType", videoFile.type);

      const uploadRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-b2`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      if (!uploadRes.ok) throw new Error("Upload to storage failed");
      setIsUploading(false);
      setIsProcessing(true);

      // 2️⃣ PROCESS WITH EM
      const processRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-masterclass-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            filename,
            userId
          }),
        }
      );

      if (!processRes.ok) throw new Error("Failed to process with em");

      const muxData = await processRes.json();
      const assetId = muxData.data?.id;

      if (!assetId) throw new Error("em asset ID missing");

      // 3️⃣ POLL masterclass_video_uploads FOR playback_id
      await pollMuxStatus(assetId, extractedDuration);

    } catch (err: any) {
      setError(err.message || "Upload failed");
      setIsUploading(false);
      setIsProcessing(false);
    }
  }

  async function pollMuxStatus(assetId: string, duration: string | null = null, tries = 0): Promise<void> {
    const { data, error } = await supabase
      .from("masterclass_video_uploads")
      .select("id, playback_id, status")
      .eq("asset_id", assetId)
      .single();

    if (error) throw new Error("Failed to check video status");

    if (data.playback_id && data.status === "ready") {
      setPlaybackId(data.playback_id);
      setVideoUploadId(data.id);
      onVideoSelected(data.playback_id, data.id, duration || undefined);
      setIsProcessing(false);
      return;
    }

    if (tries > 120) throw new Error("em took too long");

    await new Promise(r => setTimeout(r, 1000));
    return pollMuxStatus(assetId, duration, tries + 1);
  }

  function reset() {
    setVideoFile(null);
    setPlaybackId(null);
    setVideoUploadId(null);
    setVideoDuration(null);
    setError(null);
    setIsUploading(false);
    setIsProcessing(false);
  }

  // SUCCESS UI
  if (playbackId && videoUploadId) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="font-medium text-green-700">Video Ready</p>
            <p className="text-sm text-green-600">Will attach when saving the course.</p>
          </div>
          <button onClick={reset} className="p-2">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>
    );
  }

  // DEFAULT UI
  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
        className="hidden"
      />

      <div
        className={`border-2 border-dashed p-8 text-center rounded-lg ${
          dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading || isProcessing ? (
          <Loader className="w-6 h-6 animate-spin mx-auto text-purple-600" />
        ) : (
          <>
            <Film className="w-6 h-6 mx-auto text-gray-600" />
            <p className="mt-2 text-gray-700">Click or drag a video to upload</p>
            <p className="text-sm text-gray-500">MP4, WebM, MOV — up to 500MB</p>
          </>
        )}
      </div>

      {videoFile && !isProcessing && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload Video
        </button>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}
