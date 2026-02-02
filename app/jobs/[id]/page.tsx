'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { createSyncClient } from '@sleekcms/client';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  MapPin, Calendar, CheckCircle, Loader2, 
  TrendingUp, Building2, PlayCircle, Clock, Wallet, Share2, X, Users 
} from 'lucide-react';
import CoverLetterGenerator from '@/app/components/ai/CoverLetterGenerator';

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [applied, setApplied] = useState(false);
  const [applicantCount, setApplicantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobAndStatus = async () => {
      try {
        const docRef = doc(db, "jobs", id as string);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setJob({ ...snap.data(), isFirebase: true });
        } else {
          const client = await createSyncClient({
            siteToken: process.env.NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN!,
            env: 'latest',
          });
          
          const cmsJobs = (client.getEntry('jobs') as any[]) || [];
          
          const foundCmsJob = cmsJobs.find((j: any) => j._id === id);
          if (foundCmsJob) setJob({ ...foundCmsJob, isFirebase: false });
        }

        const qCount = query(collection(db, "applications"), where("jobId", "==", id));
        onSnapshot(qCount, (snap) => setApplicantCount(snap.size));

        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const q = query(collection(db, "applications"), where("jobId", "==", id), where("seekerId", "==", user.uid));
            const appSnap = await getDocs(q);
            if (!appSnap.empty) setApplied(true);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Fetch Error:", error);
        setLoading(false);
      }
    };
    fetchJobAndStatus();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return router.push('/login');
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, "applications"), {
        jobId: id,
        jobTitle: job.title,
        recruiterId: job.isFirebase ? job.recruiterId : "OFFICIAL_PARTNER_ADMIN",
        companyName: job.isFirebase ? job.companyName : (job.company?.name || "Verified Partner"),
        seekerId: auth.currentUser.uid,
        seekerName: auth.currentUser.displayName || "QuickHire Candidate",
        seekerEmail: auth.currentUser.email,
        coverLetter: coverLetter,
        status: 'pending',
        appliedAt: new Date().toISOString()
      });
      setApplied(true);
      setIsApplyModalOpen(false); 
      alert("Application sent successfully!");
    } catch (error) { 
        console.error(error); 
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!job) return <div className="p-32 text-center font-bold">Job Listing no longer active.</div>;

  return (
    <div className="max-w-5xl mx-auto py-24 px-6 fade-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">{job.title}</h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
            <Building2 size={16} className="text-blue-600"/>
            <span>{job.isFirebase ? job.companyName : (job.company?.name || "Platform Partner")}</span>
        </div>
      </div>

      <div className="card bg-white shadow-2xl border border-slate-100 rounded-[2rem] overflow-hidden">
        <div className="p-8 md:p-10 border-b border-slate-100">
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest rounded-md border border-blue-100">
                        <TrendingUp size={12}/> Actively Hiring
                    </span>
                    <CoverLetterGenerator 
                        jobTitle={job.title} 
                        companyName={job.isFirebase ? job.companyName : (job.company?.name || "Company")} 
                    />
                </div>
                <Share2 className="text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" size={20} />
            </div>

            <div className="flex items-start gap-4 mb-8">
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl">
                    {job.companyName?.charAt(0) || "C"}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div><p className="metric-label"><PlayCircle size={12}/> Start Date</p><p className="metric-val">{job.startDate || "Immediately"}</p></div>
                <div><p className="metric-label"><Calendar size={12}/> Duration</p><p className="metric-val">{job.duration || "Permanent"}</p></div>
                <div><p className="metric-label"><Wallet size={12}/> Stipend/Salary</p><p className="metric-val">{job.stipend || "Competitive"}</p></div>
                <div><p className="metric-label"><Clock size={12}/> Apply By</p><p className="metric-val">{job.deadline || "ASAP"}</p></div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Users size={16} className="text-blue-500"/>
                    <span>{applicantCount} applicants</span>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{job.type || 'Full Time'}</span>
                </div>
            </div>
        </div>

        <div className="bg-blue-600 p-6 flex flex-col md:flex-row justify-between items-center text-white gap-4">
            <div>
               <p className="font-bold text-lg">Do not miss this opportunity.</p>
               <p className="text-blue-200 text-sm">Increase your profile visibility by applying early.</p>
            </div>
            {applied ? (
               <div className="bg-white text-blue-600 px-8 py-3 rounded-xl font-black flex items-center gap-2">
                 <CheckCircle size={20} /> Applied
               </div>
            ) : (
               <button 
                  onClick={() => setIsApplyModalOpen(true)}
                  className="bg-white text-blue-600 px-10 py-3 rounded-xl font-black hover:bg-blue-50 transition-colors shadow-xl"
               >
                 Apply Now
               </button>
            )}
        </div>

        <div className="p-10 space-y-8">
            <div>
               <h3 className="font-bold text-lg text-slate-900 mb-4">About the work</h3>
               <div className="prose prose-slate text-slate-600 leading-relaxed whitespace-pre-wrap">
                 {job.description}
               </div>
            </div>
        </div>
      </div>

      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg">Complete Application</h3>
                    <button onClick={() => setIsApplyModalOpen(false)}><X size={20}/></button>
                </div>
                <form onSubmit={handleApply} className="p-8 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Cover Letter (Optional)</label>
                        <p className="text-xs text-slate-500 mb-2">Use the AI Generator above to create one, then paste it here.</p>
                        <textarea 
                            className="w-full h-40 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Dear Hiring Manager..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsApplyModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                        <button disabled={submitting} className="btn-primary px-8 py-3 rounded-xl shadow-lg flex items-center gap-2">
                           {submitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>} Submit Application
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <style jsx>{`
        .metric-label { @apply text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1; }
        .metric-val { @apply font-bold text-slate-900 text-sm; }
      `}</style>
    </div>
  );
}