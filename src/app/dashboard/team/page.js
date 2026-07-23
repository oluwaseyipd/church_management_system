"use client";

import { useEffect, useState } from "react";
import { 
  UserPlus, 
  Mail, 
  User, 
  Lock, 
  Calendar, 
  Shield, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Create user form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/register");
      if (!res.ok) {
        throw new Error("Failed to load team members list.");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Could not retrieve user list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess(false);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to register team member.");
      }

      setFormSuccess(true);
      setFormData({ name: "", email: "", password: "" });
      fetchUsers(); // Refresh list

      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);
    } catch (err) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List of current members */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Team Members</h3>
            <p className="text-xs text-slate-500 mt-1">
              Administrators with access to manage sermons.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              Loading team directory...
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              {errorMsg}
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {users.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between group">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-sm font-bold text-slate-800 truncate">{member.name}</h5>
                      <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center font-normal">
                        <Mail className="w-3.5 h-3.5 mr-1" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 flex-shrink-0 text-slate-400">
                    <span className="inline-flex items-center text-[10px] bg-brand-orange-50 text-brand-orange-700 border border-brand-orange-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </span>
                    <div className="text-right text-xs text-slate-400 hidden md:block">
                      <div className="flex items-center font-normal">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        Registered {member.created_at ? member.created_at.split("T")[0] : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Register user form */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm h-fit">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-brand-orange-50 text-brand-orange-600 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Add Team Member</h4>
            <p className="text-xs text-slate-500">Create new administrator account</p>
          </div>
        </div>

        {formSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start space-x-2 text-sm font-semibold my-4 animate-in fade-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>Team member registered successfully!</span>
          </div>
        )}

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start space-x-2 text-sm font-semibold my-4 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                required
                disabled={formLoading}
                placeholder="e.g. Stephen Bamigbola"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange-500 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="email"
                required
                disabled={formLoading}
                placeholder="email@hgbcinfluencers.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange-500 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                required
                disabled={formLoading}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange-500 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full mt-4 py-2.5 px-4 bg-brand-orange-600 hover:bg-brand-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-orange-600/25 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{formLoading ? "Registering..." : "Add Member"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
