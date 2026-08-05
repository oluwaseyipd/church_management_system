"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { uploadFileWithProgress } from "@/lib/upload";
import { 
  Search, 
  Grid, 
  List, 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  Calendar, 
  User, 
  BookOpen, 
  AlertTriangle,
  AlertCircle
} from "lucide-react";

export default function ManageSermons() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState(null);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: "",
    minister: "",
    date: "",
    bibleText: "",
    category: "",
    coverPhoto: "",
    audioSource: ""
  });

  const [editAudioUploading, setEditAudioUploading] = useState(false);
  const [editAudioProgress, setEditAudioProgress] = useState(0);

  const handleEditAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEditAudioUploading(true);
    setEditAudioProgress(0);
    try {
      const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}&filetype=${encodeURIComponent(file.type)}`);
      if (!res.ok) throw new Error("Failed to get upload link.");
      const { uploadUrl, publicUrl } = await res.json();
      
      await uploadFileWithProgress(file, uploadUrl, setEditAudioProgress);
      setEditForm(prev => ({ ...prev, audioSource: publicUrl }));
    } catch (err) {
      alert("Audio upload failed: " + err.message);
    } finally {
      setEditAudioUploading(false);
    }
  };

  const fetchSermons = async () => {
    setLoading(true);
    setErrorMsg("");
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
  const [featuredSeries, setFeaturedSeries] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featureForm, setFeatureForm] = useState({
    category: "",
    title: "",
    subtitle: "",
    description: "",
    coverPhoto: ""
  });
  const [featureUploading, setFeatureUploading] = useState(false);
  const [featureProgress, setFeatureProgress] = useState(0);

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

  useEffect(() => {
    fetchSermons();
    fetchFeaturedSeries();
  }, []);

  // Search filter
  const filteredSermons = sermons.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.minister?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Edit action
  const handleOpenEdit = (sermon) => {
    setSelectedSermon(sermon);
    
    // Normalize date format to yyyy-MM-dd for HTML date input
    let formattedDate = "";
    if (sermon.date) {
      const d = new Date(sermon.date);
      formattedDate = d.toISOString().split("T")[0];
    }

    setEditForm({ 
      ...sermon,
      date: formattedDate
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sermons/${selectedSermon.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update the sermon record.");
      }

      setIsEditModalOpen(false);
      fetchSermons(); // Refresh list from DB
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete action
  const handleOpenDelete = (sermon) => {
    setSelectedSermon(sermon);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`/api/sermons/${selectedSermon.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete the sermon record.");
      }

      setIsDeleteModalOpen(false);
      fetchSermons(); // Refresh list from DB
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title, preacher, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 text-sm bg-slate-50/50 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* View Toggles */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-brand-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-brand-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              title="Grid View"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>

          <Link
            href="/dashboard/sermons/upload"
            className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center space-x-2 transition-all shadow-md shadow-brand-orange-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>New Sermon</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold">Database Connection Warning</p>
            <p className="mt-0.5 text-slate-655 text-xs">
              Check your <code className="bg-amber-100/80 px-1 rounded">.env.local</code> settings. The CRUD operations require a valid MySQL credentials configuration to function.
            </p>
          </div>
        </div>
      )}

      {/* Featured Series Manager */}
      {!loading && !featuredLoading && (
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 mb-6 gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Featured Series Manager</h3>
              <p className="text-xs text-slate-500 mt-0.5">Highlight a sermon category on the main website homepage banner and dedicated page.</p>
            </div>
            {featuredSeries && (
              <button
                onClick={handleRemoveFeaturedSeries}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <span>Remove Featured Series</span>
              </button>
            )}
          </div>

          {featuredSeries ? (
            /* Featured Series Active State */
            <div className="flex flex-col lg:flex-row items-center gap-6 bg-slate-50 border border-slate-200/50 p-6 rounded-2xl">
              <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden relative border border-slate-200 shadow-sm flex-shrink-0">
                <img 
                  src={featuredSeries.coverPhoto || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300"} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-orange-100 text-brand-orange-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                    {featuredSeries.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Featured Series</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-base mt-2">{featuredSeries.title}</h4>
                {featuredSeries.subtitle && <p className="text-xs text-slate-600 font-semibold mt-0.5">{featuredSeries.subtitle}</p>}
                {featuredSeries.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-normal">{featuredSeries.description}</p>}
              </div>
            </div>
          ) : (
            /* No Featured Series Form / State */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex items-start space-x-3 text-sm text-slate-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div className="font-semibold text-xs">
                  No sermon category is currently featured. You can select one below to showcase it.
                </div>
              </div>

              <form onSubmit={handleSetFeaturedSeries} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Category to Feature</label>
                  <select
                    required
                    value={featureForm.category}
                    onChange={handleCategoryChange}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 bg-white text-slate-800"
                  >
                    <option value="">-- Select Category --</option>
                    {Array.from(new Set(sermons.map(s => s.category).filter(Boolean))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Series Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mansions and Flames Series"
                    value={featureForm.title}
                    onChange={e => setFeatureForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Series Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. Is Heaven and Hell Real?"
                    value={featureForm.subtitle}
                    onChange={e => setFeatureForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                    <span>Cover Photo URL</span>
                    <span className="text-[10px] text-slate-400 capitalize">Auto-filled from selected category or upload below</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={featureForm.coverPhoto}
                      onChange={e => setFeatureForm(prev => ({ ...prev, coverPhoto: e.target.value }))}
                      className="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors flex items-center justify-center flex-shrink-0">
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

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Series Description</label>
                  <textarea
                    placeholder="Describe the sermon series..."
                    rows={3}
                    value={featureForm.description}
                    onChange={e => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 text-slate-800"
                  />
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-orange-600/25"
                  >
                    Set as Featured Series
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Sermons display */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm text-slate-500 font-medium animate-pulse">
          Loading sermons database catalog...
        </div>
      ) : filteredSermons.length > 0 ? (
        viewMode === "list" ? (
          /* List View Table */
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500 font-normal">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Sermon</th>
                    <th className="px-6 py-4">Preacher</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {filteredSermons.map((sermon) => (
                    <tr key={sermon.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-9 rounded bg-slate-100 overflow-hidden flex-shrink-0 relative border border-slate-200/60 font-normal">
                            <img 
                              src={sermon.coverPhoto || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=160"} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=160" }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-900 font-bold truncate max-w-xs">{sermon.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-normal truncate max-w-xs">{sermon.bibleText || "No text"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 truncate max-w-[150px]">{sermon.minister}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200/40">
                            {sermon.category}
                          </span>
                          {!sermon.audioSource && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider animate-pulse">
                              Draft
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-normal">
                        {sermon.date ? sermon.date.split("T")[0] : ""}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 font-normal">
                          <button
                            onClick={() => handleOpenEdit(sermon)}
                            className="p-2 text-slate-400 hover:text-brand-orange-600 hover:bg-brand-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(sermon)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSermons.map((sermon) => (
              <div key={sermon.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  <img
                    src={sermon.coverPhoto || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600"}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600" }}
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    <span className="bg-white/90 backdrop-blur-sm text-brand-orange-600 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                      {sermon.category}
                    </span>
                    {!sermon.audioSource && (
                      <span className="bg-amber-550/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wider animate-pulse">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col font-semibold">
                  <h4 className="font-bold text-slate-950 leading-snug truncate-2-lines flex-1" title={sermon.title}>
                    {sermon.title}
                  </h4>
                  
                  <div className="mt-4 space-y-2 text-xs text-slate-500 font-normal">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="font-semibold text-slate-700 truncate">{sermon.minister}</span>
                    </div>
                    {sermon.bibleText && (
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="truncate">{sermon.bibleText}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      <span>{sermon.date ? sermon.date.split("T")[0] : ""}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(sermon)}
                      className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-brand-orange-600 hover:bg-brand-orange-50 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(sermon)}
                      className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
          <p className="text-slate-400 text-base font-semibold">No sermons match your query.</p>
          <button 
            onClick={() => setSearchQuery("")}
            className="mt-3 text-sm font-bold text-brand-orange-600 hover:text-brand-orange-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Edit Sermon Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Edit Sermon Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify sermon metadata. Changes are saved to database.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sermon Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500"
                  />
                </div>

                {/* Preacher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preacher/Minister</label>
                  <input
                    type="text"
                    required
                    value={editForm.minister}
                    onChange={(e) => setEditForm({ ...editForm, minister: e.target.value })}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sermon Series/Category</label>
                  <input
                    type="text"
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date Preached</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500"
                  />
                </div>

                {/* Bible Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bible Text Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. John 3:16"
                    value={editForm.bibleText}
                    onChange={(e) => setEditForm({ ...editForm, bibleText: e.target.value })}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500"
                  />
                </div>

                {/* Cover photo url */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cover Photo Link (URL)</label>
                  <input
                    type="url"
                    required
                    value={editForm.coverPhoto}
                    onChange={(e) => setEditForm({ ...editForm, coverPhoto: e.target.value })}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500"
                  />
                </div>

                {/* Audio URL */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                    <span>Audio Stream Link (URL)</span>
                    <span className="text-[10px] text-slate-400 capitalize">Optional for drafts</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editForm.audioSource || ""}
                      onChange={(e) => setEditForm({ ...editForm, audioSource: e.target.value })}
                      className="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors flex items-center justify-center flex-shrink-0">
                      {editAudioUploading ? `Uploading (${editAudioProgress}%)` : "Upload File"}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={editAudioUploading}
                        onChange={handleEditAudioUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-orange-600 hover:bg-brand-orange-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-orange-600/25"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 text-center animate-scale-up">
            <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Confirm Delete</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{selectedSermon?.title}"</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-600/25"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
