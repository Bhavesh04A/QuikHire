'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { 
  Mail, Briefcase, ExternalLink, 
  CheckCircle, XCircle, Clock, Calendar, Trophy, Filter, FileText, X 
} from 'lucide-react';
import Link from 'next/link';
// Import AI Scorer
import ApplicantScorer from '@/app/components/ai/ApplicantScorer';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('pending'); 
  const [loading, setLoading] = useState(true);
  
  // NEW: State to store the cover letter currently being viewed
  const [selectedLetter, setSelectedLetter] = useState<{name: string, text: string} | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen for applications sent to this recruiter
    const q = query(
      collection(db, "applications"), 
      where("recruiterId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setApplicants(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (appId: string, newStatus: string) => {
    await updateDoc(doc(db, "applications", appId), { status: newStatus });
  };

  // Filter Logic
  const filteredApps = applicants.filter(app => 
    filterStatus === 'all' ? true : (app.status || 'pending') === filterStatus
  );

  const tabs = [
    { id: 'pending', label: 'Inbox', icon: <Clock size={14}/> },
    { id: 'shortlisted', label: 'Shortlisted', icon: <CheckCircle size={14}/> },
    { id: 'interviewing', label: 'Interview', icon: <Calendar size={14}/> },
    { id: 'hired', label: 'Hired', icon: <Trophy size={14}/> },
    { id: 'rejected', label: 'Rejected', icon: <XCircle size={14}/> },
    { id: 'all', label: 'All History', icon: <Filter size={14}/> },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading Pipeline...</div>;

  return (
    <div className="max-w-7xl mx-auto py-24 px-6 min-h-screen bg-slate-50/50">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">Candidate Pipeline</h1>
        <p className="text-slate-500 font-medium mt-2">Manage your hiring workflow from application to offer.</p>
      </div>

      {/* Pipeline Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              filterStatus === tab.id 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab.icon} {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] ${filterStatus === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>
              {applicants.filter(a => (a.status || 'pending') === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredApps.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Filter size={24} />
            </div>
            <p className="text-slate-400 font-bold text-lg">No candidates in "{filterStatus}"</p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div key={app.id} className="card p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Candidate Info */}
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg ${
                    app.status === 'hired' ? 'bg-yellow-500' : 
                    app.status === 'rejected' ? 'bg-slate-200 text-slate-400' : 'bg-blue-600'
                  }`}>
                    {app.seekerName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                      {app.seekerName}
                    </h3>
                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-500 font-medium mt-1">
                      <span className="flex items-center gap-1"><Briefcase size={14} /> {app.jobTitle}</span>
                      <span className="flex items-center gap-1"><Mail size={14} /> {app.seekerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Tools */}
                <div className="flex items-center gap-2 border-t lg:border-none pt-4 lg:pt-0">
                  
                  {/* AI Score Button */}
                  <ApplicantScorer seekerId={app.seekerId} jobTitle={app.jobTitle} />

                  {/* NEW: View Cover Letter Button (Only shows if letter exists) */}
                  {app.coverLetter && (
                    <button 
                        onClick={() => setSelectedLetter({ name: app.seekerName, text: app.coverLetter })}
                        className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Read Cover Letter"
                    >
                        <FileText size={18} />
                    </button>
                  )}

                  <Link 
                    href={`/profile/${app.seekerId}`} 
                    className="px-5 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-colors flex items-center gap-2"
                  >
                    Profile <ExternalLink size={14} />
                  </Link>

                  {/* Status Buttons */}
                  {app.status !== 'rejected' && (
                    <>
                      {(app.status === 'pending' || !app.status) && (
                        <button onClick={() => updateStatus(app.id, 'shortlisted')} className="action-btn text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white" title="Shortlist"><CheckCircle size={18} /></button>
                      )}
                      {app.status === 'shortlisted' && (
                        <button onClick={() => updateStatus(app.id, 'interviewing')} className="action-btn text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white" title="Interview"><Calendar size={18} /></button>
                      )}
                      {app.status === 'interviewing' && (
                        <button onClick={() => updateStatus(app.id, 'hired')} className="action-btn text-yellow-600 bg-yellow-50 hover:bg-yellow-500 hover:text-white" title="Hire"><Trophy size={18} /></button>
                      )}
                      <button onClick={() => updateStatus(app.id, 'rejected')} className="action-btn text-red-600 bg-red-50 hover:bg-red-600 hover:text-white" title="Reject"><XCircle size={18} /></button>
                    </>
                  )}
                  {app.status === 'rejected' && <span className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold uppercase">Rejected</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW: Cover Letter Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Cover Letter</h3>
                        <p className="text-xs text-slate-400">From {selectedLetter.name}</p>
                    </div>
                    <button onClick={() => setSelectedLetter(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-sm">
                        {selectedLetter.text}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button onClick={() => setSelectedLetter(null)} className="text-slate-500 font-bold text-xs hover:text-slate-800">Close Viewer</button>
                </div>
            </div>
        </div>
      )}
      
      <style jsx>{`
        .action-btn { @apply p-3 rounded-xl transition-all duration-200; }
      `}</style>
    </div>
  );
}