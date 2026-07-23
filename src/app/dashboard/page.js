"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Music, 
  Users, 
  Tag, 
  CloudLightning, 
  Upload, 
  ChevronRight, 
  Calendar,
  AlertCircle
} from "lucide-react";

export default function OverviewPage() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchSermons() {
      try {
        const res = await fetch("/api/sermons");
        if (!res.ok) {
          throw new Error("Failed to fetch sermons from API. Make sure your database environment variables are configured.");
        }
        const data = await res.json();
        setSermons(data);
      } catch (err) {
        console.error("Error loading overview data:", err);
        setErrorMsg(err.message || "An unexpected error occurred while loading sermons.");
      } finally {
        setLoading(false);
      }
    }

    fetchSermons();
  }, []);

  const totalSermons = sermons.length;
  const uniqueMinisters = new Set(sermons.map(s => s.minister)).size;
  const uniqueCategories = new Set(sermons.map(s => s.category)).size;

  // Calculate category distributions
  const categoryCounts = sermons.reduce((acc, current) => {
    acc[current.category] = (acc[current.category] || 0) + 1;
    return acc;
  }, {});

  const categoryDistribution = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat],
    percentage: totalSermons > 0 ? Math.round((categoryCounts[cat] / totalSermons) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  const recentSermons = [...sermons]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-orange-700/30 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome to HGBC Influencers Panel</h3>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Manage your audio messages, update sermon metadata, and upload cover photos. Changes reflect instantly on your media catalog.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link 
              href="/dashboard/sermons/upload" 
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center space-x-2 transition-all shadow-md shadow-brand-orange-600/35"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Sermon</span>
            </Link>
            <Link 
              href="/dashboard/sermons" 
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur"
            >
              Manage Catalog
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-orange-500 via-transparent to-transparent pointer-events-none" />
      </div>

      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold">Database Connection Required</p>
            <p className="mt-0.5 text-slate-650 text-xs">
              Ensure you create a <code className="bg-amber-100/80 px-1 rounded">.env.local</code> file in your project root with your database credentials to fetch live sermons.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium">
          Loading metrics and overview data...
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Sermons", value: totalSermons, icon: Music, color: "text-brand-orange-600 bg-brand-orange-50" },
              { label: "Preachers", value: uniqueMinisters, icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: "Categories", value: uniqueCategories, icon: Tag, color: "text-emerald-600 bg-emerald-50" },
              { label: "Cloud Bandwidth", value: "Unlimited", icon: CloudLightning, color: "text-purple-600 bg-purple-50" }
            ].map((metric) => (
              <div key={metric.label} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4">
                <div className={`p-3.5 rounded-xl ${metric.color}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Two Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Uploads List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900">Recent Uploads</h4>
                  <p className="text-xs text-slate-500">The latest sermons uploaded to the database</p>
                </div>
                <Link href="/dashboard/sermons" className="text-xs font-semibold text-brand-orange-600 hover:text-brand-orange-700 flex items-center space-x-1">
                  <span>View all</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="mt-4 divide-y divide-slate-100 flex-1">
                {recentSermons.length > 0 ? (
                  recentSermons.map((sermon) => (
                    <div key={sermon.id} className="py-3.5 flex items-center justify-between group">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative border border-slate-150 font-normal">
                          <img 
                            src={sermon.coverPhoto || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120"} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120" }}
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-orange-600 transition-colors">
                            {sermon.title}
                          </h5>
                          <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">{sermon.minister}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 flex-shrink-0 text-slate-400">
                        <span className="hidden md:inline-flex items-center text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {sermon.category}
                        </span>
                        <div className="text-right text-xs">
                          <div className="flex items-center text-slate-500 font-normal">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            {sermon.date ? sermon.date.split("T")[0] : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No sermons found. Start by uploading one!
                  </div>
                )}
              </div>
            </div>

            {/* Categories Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
              <div>
                <h4 className="font-bold text-slate-900">Category Share</h4>
                <p className="text-xs text-slate-500">Distribution of sermons by series</p>
              </div>

              <div className="mt-6 space-y-4 flex-1 overflow-y-auto max-h-[260px] pr-1">
                {categoryDistribution.length > 0 ? (
                  categoryDistribution.map((cat) => (
                    <div key={cat.name} className="space-y-1.5 font-semibold">
                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="truncate pr-2">{cat.name}</span>
                        <span>{cat.count} ({cat.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-orange-600 rounded-full transition-all duration-500" 
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No categories active.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
