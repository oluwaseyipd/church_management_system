"use client";

import { useEffect, useState } from "react";
import { uploadFileWithProgress } from "@/lib/upload";
import { 
  AlertCircle, 
  UploadCloud, 
  Image as ImageIcon,
  CheckCircle,
  Tag,
  Trash2,
  AlertTriangle,
  Info
} from "lucide-react";

export default function FeaturedSeriesPage() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [featuredSeries, setFeaturedSeries] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Form State
  const [featureForm, setFeatureForm] = useState({
    category: "",
    title: "",
    subtitle: "",
    description: "",
    coverPhoto: ""
  });

  const [featureUploading, setFeatureUploading] = useState(false);
  const [featureProgress, setFeatureProgress] = useState(0);

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sermons");
      if (!res.ok) {
        throw new Error("Failed to load sermons from the database API.");
      }
      const data = await res.json();
      setSermons(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected database error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedSeries = async () => {
    setFeaturedLoading(true);
    try {
      const res = await fetch("/api/featured-series");
      if (res.ok) {
        const data = await res.json();
        setFeaturedSeries(data.featuredSeries);
      }
    } catch (err) {
      console.error("Failed to load featured series", err);
    } finally {
      setFeaturedLoading(false);
    }
  };

  useEffect(() => {
    fetchSermons();
    fetchFeaturedSeries();
  }, []);

  const handleFeatureCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFeatureUploading(true);
    setFeatureProgress(0);
    try {
      const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}&filetype=${encodeURIComponent(file.type)}`);
      if (!res.ok) throw new Error("Failed to get upload link.");
      const { uploadUrl, publicUrl } = await res.json();
      
      await uploadFileWithProgress(file, uploadUrl, setFeatureProgress);
      setFeatureForm(prev => ({ ...prev, coverPhoto: publicUrl }));
    } catch (err) {
      alert("Cover photo upload failed: " + err.message);
    } finally {
      setFeatureUploading(false);
    }
  };

  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    const matchingSermon = sermons.find(s => s.category === selectedCat);
    setFeatureForm(prev => ({
      ...prev,
      category: selectedCat,
      coverPhoto: matchingSermon ? matchingSermon.coverPhoto : prev.coverPhoto
    }));
  };

  const handleSetFeaturedSeries = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/featured-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureForm),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to set featured series.");
      }

      setFeatureForm({
        category: "",
        title: "",
        subtitle: "",
        description: "",
        coverPhoto: ""
      });
      fetchFeaturedSeries();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveFeaturedSeries = async () => {
    if (!confirm("Are you sure you want to remove the current featured series? This will delete the banner from the website.")) return;
    try {
      const res = await fetch("/api/featured-series", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to remove featured series.");
      }
      fetchFeaturedSeries();
    } catch (err) {
      alert(err.message);
    }
  };

  const uniqueCategories = Array.from(new Set(sermons.map(s => s.category).filter(Boolean)));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-brand-orange-100 text-brand-orange-600 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Featured Series Manager</h3>
            <p className="text-xs text-slate-500 mt-0.5">Highlight a sermon category on the main website homepage banner and dedicated series page.</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold">Database Warning</p>
            <p className="mt-0.5 text-slate-600 text-xs">
              Check your connection configuration if live data is not loading.
            </p>
          </div>
        </div>
      )}

      {/* Main panel */}
      {featuredLoading || loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm text-slate-500 font-medium animate-pulse">
          Loading Featured Series catalog data...
        </div>
      ) : (
        <div className="space-y-6">
          {featuredSeries ? (
            /* Active Featured Series State */
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h4 className="font-bold text-slate-950 text-base">Active Featured Series</h4>
                  <p className="text-xs text-slate-500">This category is currently showcased on the website homepage.</p>
                </div>
                <button
                  onClick={handleRemoveFeaturedSeries}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Featured Series</span>
                </button>
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-8 bg-slate-50 border border-slate-200/50 p-6 rounded-2xl">
                <div className="w-full lg:w-64 h-44 rounded-xl overflow-hidden relative border border-slate-200 shadow-sm flex-shrink-0">
                  <img 
                    src={featuredSeries.coverPhoto || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600"} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-3 text-left">
                  <div>
                    <span className="bg-brand-orange-100 text-brand-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {featuredSeries.category}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xl leading-snug">{featuredSeries.title}</h4>
                  {featuredSeries.subtitle && <p className="text-sm text-slate-600 font-semibold">{featuredSeries.subtitle}</p>}
                  {featuredSeries.description && <p className="text-xs text-slate-500 leading-relaxed font-normal">{featuredSeries.description}</p>}
                </div>
              </div>
            </div>
          ) : (
            /* Set Featured Series Form */
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Feature a Category</h4>
                <p className="text-xs text-slate-500">Pick a sermon category and enter the details to feature it as a series on the website.</p>
              </div>

              {uniqueCategories.length === 0 ? (
                <div className="p-6 border border-slate-100 bg-slate-50 rounded-2xl text-center space-y-2">
                  <Info className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">No Categories Found</p>
                  <p className="text-xs text-slate-400">You must upload sermons with categories to feature a category series.</p>
                </div>
              ) : (
                <form onSubmit={handleSetFeaturedSeries} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Dropdown Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Category to Feature</label>
                    <select
                      required
                      value={featureForm.category}
                      onChange={handleCategoryChange}
                      className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 bg-white text-slate-800 font-semibold"
                    >
                      <option value="">-- Select Category --</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Series Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mansions and Flames Series"
                      value={featureForm.title}
                      onChange={e => setFeatureForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Series Subtitle</label>
                    <input
                      type="text"
                      placeholder="e.g. Is Heaven and Hell Real?"
                      value={featureForm.subtitle}
                      onChange={e => setFeatureForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Cover Artwork URL & Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                      <span>Cover Artwork URL</span>
                      <span className="text-[10px] text-slate-400 capitalize">Auto-filled from selected category or upload below</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://..."
                        value={featureForm.coverPhoto}
                        onChange={e => setFeatureForm(prev => ({ ...prev, coverPhoto: e.target.value }))}
                        className="flex-1 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800 font-medium"
                      />
                      <label className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors flex items-center justify-center flex-shrink-0 select-none">
                        {featureUploading ? `Uploading (${featureProgress}%)` : "Upload File"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={featureUploading}
                          onChange={handleFeatureCoverUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Series Description</label>
                    <textarea
                      placeholder="Describe the sermon series..."
                      rows={3}
                      required
                      value={featureForm.description}
                      onChange={e => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-orange-600/25 flex items-center space-x-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Set as Featured Series</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
