'use client';
import { createSyncClient } from '@sleekcms/client';
import Link from 'next/link';
import HeroSlider from './components/HeroSlider';
import { 
  Briefcase, ArrowRight, Sparkles, Clock, 
  Building2, Search, Users, TrendingUp, PlusCircle, Zap, ShieldCheck, Loader2 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit, onSnapshot } from 'firebase/firestore';

export default function HomePage() {
  // Get 'loading' from AuthContext (rename to authLoading to avoid conflict)
  const { user, role, loading: authLoading } = useAuth();
  
  const [data, setData] = useState<any>({ home: null, jobs: [], companies: [] });
  const [recruiterStats, setRecruiterStats] = useState({ activeJobs: 0, totalApps: 0 });
  const [contentLoading, setContentLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let unsubscribeJobs: any;
    let unsubscribeApps: any;

    async function fetchData() {
      if (authLoading) return;

      try {
        const client = await createSyncClient({
          siteToken: process.env.NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN!,
          env: 'latest',
        });
        
        const homePage = client.getPage('/');
        const cmsCompanies = client.getEntry('companies') || [];
        const cmsJobsRaw = client.getEntry('jobs');
        const cmsJobs = (Array.isArray(cmsJobsRaw) ? cmsJobsRaw : [])
          .filter((j: any) => j && j.status === 'active');

        setData((prev: any) => ({ 
          ...prev, 
          home: homePage, 
          companies: cmsCompanies,
          jobs: role === 'recruiter' ? [] : [...cmsJobs] 
        }));

        if (!user || role === 'seeker') {
          const jobSnap = await getDocs(query(collection(db, "jobs"), where("status", "==", "active"), limit(10)));
          const fbJobs = jobSnap.docs.map(d => ({ _id: d.id, ...d.data(), isFirebase: true }));
          
          setData((prev: any) => ({ 
            ...prev, 
            jobs: [...cmsJobs, ...fbJobs] 
          }));
          setContentLoading(false);
        } 
        else if (role === 'recruiter' && user) {
          const myJobQ = query(collection(db, "jobs"), where("recruiterId", "==", user.uid));
          unsubscribeJobs = onSnapshot(myJobQ, (snapshot) => {
            const myJobs = snapshot.docs
              .map(d => ({ 
                _id: d.id, 
                ...d.data(), 
                isFirebase: true,
                createdAt: d.data().createdAt || new Date().toISOString()
              }))
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setData((prev: any) => ({ ...prev, jobs: myJobs }));
            
            setRecruiterStats(prev => ({
                ...prev,
                activeJobs: myJobs.filter((j: any) => j.status === 'active').length
            }));
            
            setContentLoading(false);
          });

          const appQ = query(collection(db, "applications"), where("recruiterId", "==", user.uid));
          unsubscribeApps = onSnapshot(appQ, (snapshot) => {
             setRecruiterStats(prev => ({
                ...prev,
                totalApps: snapshot.size
             }));
          });
        } else {
             setContentLoading(false);
        }

      } catch (err) {
        console.error(err);
        setContentLoading(false);
      }
    }

    fetchData();

    return () => {
      if (unsubscribeJobs) unsubscribeJobs();
      if (unsubscribeApps) unsubscribeApps();
    };
  }, [user, role, authLoading]);

  const filteredJobs = data.jobs.filter((job: any) => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    job.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //  Show loader if Auth OR Content is loading
  if (authLoading || contentLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold"><Loader2 className="animate-spin w-8 h-8 text-blue-500 mb-4"/></div>;

  // View 1: Recruiter
  if (user && role === 'recruiter') {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 fade-up">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back, {user.displayName?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 font-medium mt-2">Here is what's happening with your hiring pipeline.</p>
          </div>
          <Link href="/dashboard/recruiter" className="btn-primary flex items-center gap-2 px-6 py-3 shadow-xl hover:-translate-y-1 transition-all">
             <PlusCircle size={20} /> Post New Job
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link href="/dashboard/recruiter" className="card p-8 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group">
            <div className="relative z-10">
                <h2 className="text-5xl font-black mb-2">{recruiterStats.activeJobs}</h2>
                <p className="text-blue-100 font-bold flex items-center gap-2"><Briefcase size={18}/> Active Job Postings</p>
            </div>
            <Briefcase className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
          </Link>

          <div className="card p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform relative overflow-hidden group">
            <div className="relative z-10">
                <h2 className="text-5xl font-black mb-2">{recruiterStats.totalApps}</h2>
                <p className="text-slate-400 font-bold flex items-center gap-2"><Users size={18}/> Total Candidates</p>
            </div>
            <Users className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform" />
          </div>

          <Link href="/applicants" className="card p-8 bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center hover:shadow-xl transition-all group cursor-pointer hover:border-blue-200">
             <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
               <TrendingUp size={28} />
             </div>
             <span className="font-bold text-slate-900 text-lg">View Talent Pipeline</span>
             <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Manage Applications</span>
          </Link>
        </div>

        <div className="space-y-6 mb-20">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900">Your Recent Postings</h2>
            <Link href="/dashboard/recruiter" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                Manage All <ArrowRight size={14}/>
            </Link>
          </div>
          
          <div className="grid gap-4">
            {data.jobs.slice(0, 3).map((job: any) => (
              <div key={job._id} className="card p-6 bg-white border border-slate-100 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Briefcase size={20}/>
                   </div>
                   <div>
                       <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                         Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Just now'}
                       </p>
                   </div>
                </div>
                <div className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${job.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {job.status}
                </div>
              </div>
            ))}
            {data.jobs.length === 0 && (
               <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50">
                 <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4"/>
                 <p className="text-slate-500 font-bold text-lg">No active jobs found.</p>
                 <Link href="/dashboard/recruiter" className="text-blue-600 font-bold mt-2 inline-block hover:underline">Post your first job now</Link>
               </div>
            )}
          </div>
        </div>

        <section className="bg-slate-50 rounded-[3rem] p-12 text-center border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Maximize Your Hiring Potential</h3>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600"><Zap size={24}/></div>
                    <h4 className="font-bold text-slate-900">Fast-Track Hiring</h4>
                    <p className="text-sm text-slate-500">Use our "Shortlist" status to organize top talent quickly.</p>
                </div>
                <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600"><ShieldCheck size={24}/></div>
                    <h4 className="font-bold text-slate-900">Verified Badge</h4>
                    <p className="text-sm text-slate-500">Complete your profile to get the "Verified" badge on job posts.</p>
                </div>
                <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600"><Users size={24}/></div>
                    <h4 className="font-bold text-slate-900">Team Access</h4>
                    <p className="text-sm text-slate-500">Share applicant profiles with your team easily via link.</p>
                </div>
            </div>
        </section>
      </div>
    );
  }

  // View 2: Seeker
  if (user && role === 'seeker') {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 fade-up">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center text-white mb-16 relative overflow-hidden shadow-2xl">
           <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Find your next dream role.</h1>
              <div className="bg-white p-2 rounded-full flex items-center shadow-xl">
                 <Search className="ml-4 text-slate-400 w-6 h-6" />
                 <input 
                   type="text" 
                   placeholder="Search by title, skill, or company..." 
                   className="flex-1 p-4 bg-transparent text-slate-900 font-bold outline-none placeholder:text-slate-300"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all">
                   Search
                 </button>
              </div>
           </div>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none"/>
        </div>

        <div className="space-y-8 mb-20">
           <div className="flex justify-between items-end">
              <h2 className="text-3xl font-black text-slate-900">
                {searchTerm ? 'Search Results' : 'Recommended for You'}
              </h2>
              <Link href="/jobs" className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
                View All Jobs <ArrowRight size={16}/>
              </Link>
           </div>

           <div className="grid md:grid-cols-2 gap-6">
              {filteredJobs.slice(0, 4).map((job: any) => (
                 <div key={job._id} className="card p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-blue-200 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                          {job.isFirebase ? <Sparkles size={20} /> : <Briefcase size={20} />}
                       </div>
                       <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider">{job.type || 'Full Time'}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <p className="text-slate-500 font-medium mb-6">{job.companyName || "Top Company"} • {job.location}</p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                       <span className="text-sm font-bold text-slate-400 flex items-center gap-2"><Clock size={14}/> {new Date(job.createdAt || Date.now()).toLocaleDateString()}</span>
                       <Link href={job.isFirebase ? `/jobs/${job._id}` : (job.apply_link?.url || '#')} className="font-bold text-blue-600 text-sm hover:underline flex items-center gap-1">
                         View Details <ArrowRight size={14}/>
                       </Link>
                    </div>
                 </div>
              ))}
              
              {filteredJobs.length === 0 && (
                <div className="col-span-2 text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                  No jobs found matching "{searchTerm}". Try "React", "Design", or browse all.
                </div>
              )}
           </div>
        </div>

        <section className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-600 text-white rounded-[2.5rem] p-10 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4">Complete your Profile</h3>
                    <p className="mb-6 text-blue-100 font-medium">Recruiters are 5x more likely to contact candidates with a complete profile and resume.</p>
                    <Link href="/profile" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold inline-block hover:bg-blue-50 transition-colors">
                        Update Profile
                    </Link>
                </div>
                <Users className="absolute -bottom-10 -right-10 w-64 h-64 text-blue-500/50" />
            </div>
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4">Browse Top Companies</h3>
                    <p className="mb-6 text-slate-400 font-medium">Discover who is hiring actively on QuickHire and find your perfect culture fit.</p>
                    <Link href="/companies" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold inline-block hover:bg-slate-200 transition-colors">
                        View Companies
                    </Link>
                </div>
                <Building2 className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-800" />
            </div>
        </section>
      </div>
    );
  }

  // View 3: Guest
  return (
    <div className="flex flex-col">
      <section className="relative min-h-[85vh] flex items-center justify-center text-center px-4 overflow-hidden pt-10">
        <HeroSlider images={data.home?.hero_slider || []} />
        <div className="relative z-20 fade-up max-w-4xl px-6 text-white">
          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter drop-shadow-2xl">
            {data.home?.title || "Your Future Starts Here."}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-lg font-medium">
            {data.home?.hero_text || "The premier ecosystem connecting elite talent with world-class opportunities."}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jobs" className="btn-primary px-10 py-4 shadow-2xl text-lg">Explore Careers</Link>
            <Link href="/signup" className="px-10 py-4 rounded-full border border-white/40 text-white font-bold backdrop-blur-md hover:bg-white/20 transition-all text-lg">Join Platform</Link>
          </div>
        </div>
      </section>
      
      <section className="py-24 bg-slate-50 text-center">
        <div className="max-w-2xl mx-auto px-6">
            <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-4">Start your journey today</h2>
            <p className="text-slate-500 text-lg mb-10 font-medium">Log in as a Seeker to browse verified job listings, or as a Recruiter to build your team with the best talent on the market.</p>
            <div className="flex justify-center gap-6">
                <Link href="/login" className="btn-primary px-12">Login</Link>
                <Link href="/signup" className="px-12 py-4 rounded-full border border-slate-200 bg-white font-bold hover:shadow-xl transition-all">Sign Up</Link>
            </div>
        </div>
      </section>
    </div>
  );
}