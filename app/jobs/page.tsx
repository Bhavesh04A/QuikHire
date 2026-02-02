'use client';
import { createSyncClient } from '@sleekcms/client';
import { MapPin, Briefcase, Search, Sparkles, ShieldCheck, Loader2, Clock, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import JobMatcher from '@/app/components/ai/JobMatcher';

export default function JobsPage() {
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cmsPage, setCmsPage] = useState<any>(null);

  useEffect(() => {
    async function fetchUnifiedJobs() {
      try {
        // 1. Fetch from SleekCMS
        const client = await createSyncClient({
          siteToken: process.env.NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN!,
          env: 'latest',
        });

        const page = client.getPage('/jobs');
        
        // STRICT FILTERING: Explicitly check for 'active' status
        const cmsJobsRaw = client.getEntry('jobs');
        const cmsJobs = (Array.isArray(cmsJobsRaw) ? cmsJobsRaw : [])
          .filter((job: any) => job && job.status === 'active') 
          .map((job: any) => ({ ...job, isFirebase: false }));
        
        setCmsPage(page);

        // 2. Fetch from Firebase
        const q = query(collection(db, "jobs"), where("status", "==", "active"));
        const querySnapshot = await getDocs(q);
        const firebaseJobs = querySnapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data(),
          isFirebase: true 
        }));

        // Combine and Sort by Date (Newest First)
        const combined = [...cmsJobs, ...firebaseJobs].sort((a, b) => {
           const dateA = new Date(a.createdAt || a.date || 0).getTime();
           const dateB = new Date(b.createdAt || b.date || 0).getTime();
           return dateB - dateA;
        });

        setAllJobs(combined);
        setFilteredJobs(combined);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUnifiedJobs();
  }, []);

  // Search Logic
  useEffect(() => {
    const results = allJobs.filter(job => 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.companyName || job.company?.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredJobs(results);
  }, [searchTerm, allJobs]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <section className="max-w-6xl mx-auto fade-up py-10 px-4 min-h-screen mt-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
          {cmsPage?.title || "Find Your Next Career"}
        </h1>
        
        <div className="max-w-2xl mx-auto relative group mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text"
            placeholder="Search by role, company, or location..."
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/*  AI SMART MATCH BUTTON */}
        <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
           <JobMatcher jobs={allJobs} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-slate-500 font-bold text-xl">No matching roles found.</p>
             <button onClick={() => setSearchTerm("")} className="text-blue-600 font-bold mt-2 hover:underline">Clear all filters</button>
          </div>
        ) : (
          filteredJobs.map((job: any) => (
            <div key={job._id} className="card flex flex-col md:flex-row md:items-center gap-8 justify-between hover:border-blue-400 group relative p-8 bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 rounded-[2rem]">
              
              <div className="absolute -top-3 left-8 flex gap-2">
                {job.isFirebase ? (
                  <div className="bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3" /> COMMUNITY POST
                  </div>
                ) : (
                  <div className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED PARTNER
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                    {job.job_type?.replace('_', ' ') || job.type || "Full Time"}
                  </span>
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 mb-5 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">
                  {job.title}
                </h2>
                
                <div className="flex flex-wrap gap-y-4 gap-x-10 text-sm font-bold text-slate-500">
                  <span className="flex items-center gap-2.5">
                    <Briefcase className="w-5 h-5 text-blue-500/50" />
                    {job.isFirebase ? (job.companyName || "Private Recruiter") : (job.company?.name || "Verified Firm")}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-blue-500/50" />
                    {job.location}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Link 
                  href={`/jobs/${job._id}`} 
                  className="btn-primary px-12 py-5 shadow-xl shadow-blue-500/20 whitespace-nowrap text-lg"
                >
                  View Opportunity
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
} 