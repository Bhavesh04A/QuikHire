'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles, Loader2, X, ArrowRight, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface Job {
  _id: string; // SleekCMS ID
  id?: string; // Firebase ID
  title: string;
  companyName?: string;
  company?: { name: string };
  description?: string; // We need this for context
  isFirebase?: boolean;
}

interface Props {
  jobs: Job[];
}

export default function JobMatcher({ jobs }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  const handleMatch = async () => {
    if (!user) {
        alert("Please log in to use Smart Match.");
        return;
    }
    setIsOpen(true);
    setLoading(true);

    try {
        // 1. Get User Profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const userProfile = `Bio: ${userData.bio || ''}, Experience: ${userData.experience || ''}, Skills: ${userData.bio || ''}`;

        // 2. Prepare Job Data (Minified to save tokens)
        // We only send ID, Title, Company, and a snippet of description
        const jobsPayload = jobs.slice(0, 15).map(j => ({
            jobId: j._id || j.id,
            title: j.title,
            company: j.companyName || j.company?.name
        }));

        // 3. Call AI
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'job_match',
                data: { userProfile, jobs: jobsPayload }
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.reply);
        
        // 4. Map results back to full job objects
        if (result.matches) {
            const matchedJobs = result.matches.map((match: any) => {
                const fullJob = jobs.find(j => (j._id === match.jobId || j.id === match.jobId));
                return { ...fullJob, matchReason: match.reason };
            }).filter((j: any) => j && j.title); // Filter out nulls
            
            setMatches(matchedJobs);
        }

    } catch (error) {
        console.error(error);
        setMatches([]); // Clear on error
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleMatch}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-[1.02]"
      >
        <Sparkles size={18} className="text-yellow-300" /> Smart Match
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-purple-600 p-2 rounded-lg"><Sparkles size={20}/></div>
                      <div>
                          <h3 className="font-bold text-lg">AI Job Picks</h3>
                          <p className="text-xs text-slate-400">Based on your profile</p>
                      </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full"><X size={20}/></button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                  {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4 text-slate-400">
                          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                          <p className="text-sm font-bold animate-pulse">Scanning opportunities...</p>
                      </div>
                  ) : matches.length > 0 ? (
                      <div className="space-y-4">
                          {matches.map((job, idx) => (
                              <Link 
                                href={`/jobs/${job._id || job.id}`} 
                                key={idx} 
                                className="block bg-white p-5 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all group"
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{job.title}</h4>
                                      <ArrowRight size={16} className="text-slate-300 group-hover:text-purple-600"/>
                                  </div>
                                  <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                                      <Briefcase size={12}/> {job.companyName || job.company?.name}
                                  </p>
                                  <div className="bg-purple-50 text-purple-700 p-3 rounded-xl text-xs font-medium leading-relaxed">
                                      <Sparkles size={12} className="inline mr-1 mb-0.5"/> {job.matchReason}
                                  </div>
                              </Link>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-10 text-slate-500">
                          <p>No strong matches found in the current list.</p>
                          <p className="text-xs mt-2">Try updating your profile with more skills!</p>
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </>
  );
}