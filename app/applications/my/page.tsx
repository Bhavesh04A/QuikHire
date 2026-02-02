'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Briefcase, MapPin, Calendar, CheckCircle, 
  XCircle, Clock, Loader2, ArrowRight, Building2 
} from 'lucide-react';
import Link from 'next/link';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, "applications"), 
          where("seekerId", "==", user.uid)
        );

        const unsubscribeApps = onSnapshot(q, (snapshot) => {
          const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort by newest first
          setApplications(apps.sort((a: any, b: any) => 
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          ));
          setLoading(false);
        });

        return () => unsubscribeApps();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'interviewing': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'hired': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'shortlisted', 'interviewing', 'hired'];
    if (status === 'rejected') return -1;
    return steps.indexOf(status) + 1;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading your journey...</div>;

  return (
    <div className="max-w-5xl mx-auto py-24 px-6 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">My Applications</h1>
        <p className="text-slate-500 font-medium mt-2">Track the status of your active job applications.</p>
      </div>

      <div className="space-y-6">
        {applications.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-slate-700">No applications yet</h3>
             <p className="text-slate-400 mb-6">Start applying to jobs to track them here.</p>
             <Link href="/jobs" className="btn-primary px-8 py-3 rounded-xl shadow-xl">Find a Job</Link>
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="card p-8 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all group">
              <div className="flex flex-col md:flex-row gap-8 justify-between">
                
                {/* Job Info */}
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border ${getStatusColor(app.status || 'pending')}`}>
                        {app.status || 'Applied'}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={12}/> Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                     {app.jobTitle}
                   </h2>
                   <p className="font-bold text-slate-500 flex items-center gap-2">
                     <Building2 size={16} /> {app.companyName}
                   </p>
                </div>

                {/* Status Bar */}
                <div className="flex-1 flex flex-col justify-center">
                   {app.status === 'rejected' ? (
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-sm flex items-center gap-2">
                        <XCircle size={18}/> Unfortunately, not selected this time.
                      </div>
                   ) : (
                     <div className="relative pt-4">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
                           <span>Applied</span>
                           <span>Shortlist</span>
                           <span>Interview</span>
                           <span>Offer</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-1000 ${app.status === 'hired' ? 'bg-yellow-500' : 'bg-blue-600'}`} 
                             style={{ width: `${getStatusStep(app.status || 'pending') * 25}%` }}
                           />
                        </div>
                     </div>
                   )}
                </div>

                {/* Action */}
                <div className="flex items-center">
                   <Link 
                     href={`/jobs/${app.jobId}`} 
                     className="p-4 bg-slate-50 rounded-full text-slate-400 hover:bg-blue-600 hover:text-white transition-all"
                   >
                     <ArrowRight size={24} />
                   </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}