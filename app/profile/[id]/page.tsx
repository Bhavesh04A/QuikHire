'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  User, Mail, FileText, Briefcase, GraduationCap, 
  MapPin, Calendar, Download, Loader2, Zap 
} from 'lucide-react';

export default function PublicProfileView() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const snap = await getDoc(doc(db, "users", id as string));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400"><Loader2 className="animate-spin mr-2"/> Loading Candidate...</div>;
  
  if (!profile) return <div className="p-32 text-center font-bold text-slate-400">Candidate profile not found.</div>;

  return (
    <div className="max-w-5xl mx-auto py-24 px-6 mb-20 "> 
      
      {/* Header Card */}
      <div className="card p-10 bg-white shadow-2xl rounded-[3rem] border border-slate-100 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row items-center gap-10">
          
          {/* Profile Photo */}
          <div className="relative group w-40 h-40 shrink-0">
            <img 
              src={profile.photoUrl || `https://ui-avatars.com/api/?name=${profile.name || 'User'}&background=2563eb&color=fff`} 
              className="w-full h-full rounded-[2.5rem] object-cover border-4 border-white shadow-2xl" 
              alt="Profile"
            />
          </div>

          {/* Name & Title */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">{profile.name || "Candidate"}</h1>
            <p className="text-xl text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
               <Mail size={18} className="text-blue-500"/> {profile.email}
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-4">
               {profile.role === 'seeker' && (
                 <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest rounded-full">
                   Job Seeker
                 </span>
               )}
               <span className="px-4 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2">
                 <Calendar size={12}/> Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}
               </span>
            </div>
          </div>

          {/* Action: Download Resume */}
          <div className="shrink-0">
            {profile.resumeUrl ? (
              <a 
                href={profile.resumeUrl} 
                download={`${profile.name || 'Candidate'}_Resume.pdf`}
                className="btn-primary flex items-center gap-3 px-8 py-4 shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform"
              >
                <Download size={20} /> Download Resume
              </a>
            ) : (
              <button disabled className="px-8 py-4 bg-slate-100 text-slate-400 font-bold rounded-full cursor-not-allowed">
                No Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-8 items-start"> {/* items-start prevents stretching */}
        
        {/* Left Column: Bio & Experience */}
        <div className="space-y-8">
          <div className="card p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
            <h3 className="flex items-center gap-3 font-black text-slate-900 uppercase text-xs tracking-widest mb-6 border-b border-slate-50 pb-4">
              <Zap className="w-4 h-4 text-blue-500" /> Professional Bio
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
              {profile.bio || "No professional bio added yet."}
            </p>
          </div>

          <div className="card p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
            <h3 className="flex items-center gap-3 font-black text-slate-900 uppercase text-xs tracking-widest mb-6 border-b border-slate-50 pb-4">
              <Briefcase className="w-4 h-4 text-blue-500" /> Work Experience
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {profile.experience || "No experience listed."}
            </p>
          </div>
        </div>

        {/* Right Column: Education */}
        <div className="space-y-8">
          <div className="card p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
            <h3 className="flex items-center gap-3 font-black text-slate-900 uppercase text-xs tracking-widest mb-6 border-b border-slate-50 pb-4">
              <GraduationCap className="w-4 h-4 text-blue-500" /> Education
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {profile.education || "No education details provided."}
            </p>
          </div>

          {/* Quick Resume Preview Box */}
          {profile.resumeUrl && (
            <div className="card p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center justify-center min-h-[200px]">
              <FileText className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="font-bold text-xl mb-2">Resume Available</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs">
                Click the download button above to view the candidate full official documentation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}