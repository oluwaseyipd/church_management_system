"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  UploadCloud, 
  CheckCircle, 
  Music, 
  Image as ImageIcon,
  AlertCircle,
  X
} from "lucide-react";
import Link from "next/link";

// XMLHttpRequest helper for tracking upload progress
const uploadFileWithProgress = (file, uploadUrl, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => reject(new Error("Network error during file upload"));
    xhr.send(file);
  });
};

const CircularProgress = ({ progress, size = 64, strokeWidth = 4, label = "" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-1.5">
      <div className="relative animate-in fade-in duration-300" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-slate-200/80"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="text-brand-orange-600 transition-all duration-200"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">
          {progress}%
        </div>
      </div>
      {label && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">{label}</span>}
    </div>
  );
};

export default function UploadSermon() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    minister: "",
    date: new Date().toISOString().split("T")[0],
    bibleText: "",
    category: "",
  });

  // Media files state
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // Upload simulation/real states
  const [isUploading, setIsUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        setErrorMsg("Please select a valid audio file (MP3/WAV/M4A).");
        return;
      }
      setErrorMsg("");
      setAudioFile(file);
      setAudioProgress(0);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please select a valid image file (JPEG/PNG/WEBP).");
        return;
      }
      setErrorMsg("");
      setCoverFile(file);
      setCoverProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile) {
      setErrorMsg("Cover photo is required.");
      return;
    }

    setErrorMsg("");
    setIsUploading(true);

    try {
      // 1. Get presigned URL for cover artwork
      const coverUrlRes = await fetch(`/api/upload-url?filename=${encodeURIComponent(coverFile.name)}&filetype=${encodeURIComponent(coverFile.type)}`);
      if (!coverUrlRes.ok) throw new Error("Failed to get upload link for artwork.");
      const { uploadUrl: coverUploadUrl, publicUrl: coverPublicUrl } = await coverUrlRes.json();

      // 2. Upload cover artwork to R2
      await uploadFileWithProgress(coverFile, coverUploadUrl, setCoverProgress);

      // 3 & 4. Upload audio to R2 if selected
      let audioPublicUrl = null;
      if (audioFile) {
        const audioUrlRes = await fetch(`/api/upload-url?filename=${encodeURIComponent(audioFile.name)}&filetype=${encodeURIComponent(audioFile.type)}`);
        if (!audioUrlRes.ok) throw new Error("Failed to get upload link for audio.");
        const { uploadUrl: audioUploadUrl, publicUrl } = await audioUrlRes.json();
        
        await uploadFileWithProgress(audioFile, audioUploadUrl, setAudioProgress);
        audioPublicUrl = publicUrl;
      }

      // 5. Post metadata to MySQL database
      const sermonsRes = await fetch("/api/sermons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          minister: formData.minister,
          date: formData.date,
          bibleText: formData.bibleText,
          category: formData.category,
          coverPhoto: coverPublicUrl,
          audioSource: audioPublicUrl,
          featureStatus: true,
        }),
      });

      if (!sermonsRes.ok) {
        const errorData = await sermonsRes.json();
        throw new Error(errorData.error || "Failed to save sermon metadata to the database.");
      }

      setIsUploading(false);
      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard/sermons");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during file upload. Ensure environment variables are loaded.");
      setIsUploading(false);
      setAudioProgress(0);
      setCoverProgress(0);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <div>
        <Link 
          href="/dashboard/sermons" 
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-brand-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-lg">Upload Sermon Message</h3>
          <p className="text-xs text-slate-500 mt-1">
            Fill the metadata and select the media files to publish. Audio and cover photos will upload directly to R2.
          </p>
        </div>

        {success ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-xl">Sermon Published Successfully!</h4>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              The audio file and cover image have been uploaded and registered. Redirecting to the manage dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Title */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sermon Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Year of Supernatural Advancement"
                  disabled={isUploading}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 disabled:opacity-50"
                />
              </div>

              {/* Minister */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preacher/Minister</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pastor Samson Ayangoke"
                  disabled={isUploading}
                  value={formData.minister}
                  onChange={(e) => setFormData({ ...formData, minister: e.target.value })}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 disabled:opacity-50"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sermon Series/Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Restoration / Fellowship"
                  disabled={isUploading}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 disabled:opacity-50"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Preached</label>
                <input
                  type="date"
                  required
                  disabled={isUploading}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 disabled:opacity-50"
                />
              </div>

              {/* Bible Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bible Text Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Nehemiah 2:17, 1 Samuel 12:6"
                  disabled={isUploading}
                  value={formData.bibleText}
                  onChange={(e) => setFormData({ ...formData, bibleText: e.target.value })}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 disabled:opacity-50"
                />
              </div>

              {/* Media upload files row */}
              <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                
                {/* Audio Upload selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                    <Music className="w-4 h-4 mr-1 text-slate-400" />
                    <span>Audio Message File (.mp3)</span>
                  </label>
                  
                  {!audioFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-brand-orange-500/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 font-semibold">Click to select audio file</p>
                        <p className="text-[10px] text-slate-400 mt-1">MP3 / WAV up to 100MB</p>
                      </div>
                      <input 
                        type="file" 
                        accept="audio/*"
                        className="hidden" 
                        onChange={handleAudioChange}
                        disabled={isUploading}
                      />
                    </label>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-36 bg-slate-50/50 relative">
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <CircularProgress progress={audioProgress} size={64} label="Uploading Audio" />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between min-w-0">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate pr-6">{audioFile.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setAudioFile(null)}
                              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/55 rounded-lg transition-all"
                            >
                              <X className="w-4.5 h-4.5" />
                            </button>
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600 flex items-center animate-pulse">
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                            <span>Audio file ready</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Cover Photo Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1 text-slate-400" />
                    <span>Cover Artwork Image (.jpg/.png)</span>
                  </label>
                  
                  {!coverFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-brand-orange-500/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 font-semibold">Click to select image file</p>
                        <p className="text-[10px] text-slate-400 mt-1">JPEG / PNG / WEBP up to 5MB</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleCoverChange}
                        disabled={isUploading}
                      />
                    </label>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-36 bg-slate-50/50 relative">
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <CircularProgress progress={coverProgress} size={64} label="Uploading Artwork" />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between min-w-0">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate pr-6">{coverFile.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{(coverFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setCoverFile(null)}
                              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/55 rounded-lg transition-all"
                            >
                              <X className="w-4.5 h-4.5" />
                            </button>
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600 flex items-center animate-pulse">
                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                            <span>Artwork image ready</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/dashboard/sermons"
                className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-3 bg-brand-orange-600 hover:bg-brand-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-orange-600/25 disabled:opacity-50 inline-flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4.5 h-4.5" />
                    <span>Publish Sermon</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
