'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { 
  User, Mail, FileText, Briefcase, Save, ShieldCheck, 
  Upload, Loader2, Zap, GraduationCap, PenLine, Sparkles 
} from 'lucide-react';
import ResumeEnhancer from '@/app/components/ai/ResumeEnhancer';

export default function SeekerProfile() {
  const [profile, setProfile] = useState<any>({ 
    name: '',
    bio: '', 
    experience: '', 
    education: '',
    resumeUrl: '', 
    photoUrl: '' 
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [strength, setStrength] = useState(0);
  // NEW: State to toggle AI Tool visibility
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            ...data,
            name: data.name || user.displayName || ''
          });
          calculateStrength(data);
        } else {
          setProfile({ name: user.displayName || '' });
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const calculateStrength = (p: any) => {
    let score = 0;
    if (p.bio?.length > 20) score += 20;
    if (p.experience?.length > 20) score += 20;
    if (p.education?.length > 10) score += 20;
    if (p.resumeUrl) score += 30;
    if (p.photoUrl) score += 10;
    setStrength(score);
  };

  const convertToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: any, type: 'resume' | 'photo') => {
    const file = e.target.files[0];
    if (!file || !auth.currentUser) return;

    if (file.size > 800 * 1024) {
      alert("File is too large! Please upload an image/PDF smaller than 800KB.");
      return;
    }

    setUploading(true);
    
    try {
      const base64File = await convertToBase64(file);
      
      const updatedProfile = { 
        ...profile, 
        [type === 'resume' ? 'resumeUrl' : 'photoUrl']: base64File 
      };
      
      setProfile(updatedProfile);
      
      await updateDoc(doc(db, "users", auth.currentUser.uid), updatedProfile);
      calculateStrength(updatedProfile);
      alert(`${type === 'resume' ? 'Resume' : 'Photo'} uploaded successfully!`);
    } catch (err: any) { 
      console.error("Upload Error:", err); 
      alert("Failed to upload. Try a smaller file.");
    } finally { 
      setUploading(false); 
    }
  };

  const handleSaveText = async () => {
    if (!auth.currentUser) return;
    
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), profile);
      
      if (profile.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: profile.name });
      }

      calculateStrength(profile);
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save changes.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Profile...</div>;

  return (
    <div className="max-w-7xl mx-auto py-32 px-6 grid lg:grid-cols-4 gap-12">
      <aside className="space-y-6">
        <div className="card p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl">
          <ShieldCheck className="text-blue-400 mb-4" size={32}/>
          <h3 className="font-bold text-xl mb-4">Profile Strength</h3>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000" 
              style={{ width: `${strength}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            {strength === 100 ? "Your profile is fully optimized!" : "Complete your profile to unlock 5x more visibility."}
          </p>
        </div>

        <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
          <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2"><Zap size={14}/> Pro Tip</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Use a square image (jpg/png) under 800KB for best results.
          </p>
        </div>

        {/* AI TOOL TOGGLE BUTTON */}
        <button 
          onClick={() => setShowAI(!showAI)}
          className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          <Sparkles size={18} /> {showAI ? "Hide AI Writer" : "Use AI Writer"}
        </button>
      </aside>

      <div className="lg:col-span-3 space-y-10">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900">My Portfolio</h1>
            <p className="text-slate-500 mt-2 font-medium">Control your professional identity across the platform.</p>
          </div>
          <button onClick={handleSaveText} className="btn-primary flex items-center gap-2 px-8 py-4 shadow-xl shadow-blue-500/20">
            <Save size={20} /> Save Changes
          </button>
        </div>
        
        {/* AI WRITER COMPONENT (Shows when toggled) */}
        {showAI && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="bg-slate-900 text-white p-6 rounded-t-[2rem] flex justify-between items-center">
                <div>
                   <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-yellow-400" /> AI Resume Enhancer</h3>
                   <p className="text-slate-400 text-sm">Draft rough points below and let AI polish them professionally.</p>
                </div>
                <button onClick={() => setShowAI(false)} className="text-slate-400 hover:text-white">Close</button>
             </div>
             <ResumeEnhancer />
          </div>
        )}

        <div className="card p-12 bg-white shadow-2xl rounded-[3rem] space-y-12 border border-slate-50">
          
          <div className="flex flex-col md:flex-row items-center gap-10 border-b border-slate-100 pb-12">
            <div className="relative group w-36 h-36 shrink-0">
              <img 
                src={profile.photoUrl || `https://ui-avatars.com/api/?name=${profile.name || 'User'}&background=2563eb&color=fff`} 
                className="w-full h-full rounded-[2.5rem] object-cover border-4 border-white shadow-2xl group-hover:brightness-75 transition-all" 
              />
              <label className="absolute inset-0 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {uploading ? <Loader2 className="animate-spin mb-1" /> : <Upload size={28} className="mb-1" />}
                <span className="text-xs font-bold uppercase tracking-widest">Change</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
              </label>
            </div>
            
            <div className="flex-1 w-full text-center md:text-left">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2 justify-center md:justify-start">
                <PenLine size={12}/> Full Name
              </label>
              <input 
                type="text" 
                className="text-4xl md:text-5xl font-black text-slate-900 bg-transparent border-b-2 border-transparent hover:border-slate-100 focus:border-blue-500 focus:outline-none w-full transition-all placeholder:text-slate-200"
                placeholder="Type Name Here"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
              <p className="text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2 mt-3">
                <Mail size={16} className="text-blue-500" /> {auth.currentUser?.email}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Zap size={16} className="text-blue-500" /> Professional Bio
              </label>
              <textarea 
                className="w-full p-6 border border-slate-100 rounded-[1.5rem] h-40 bg-slate-50 focus:bg-white focus:ring-4 ring-blue-500/5 transition-all outline-none resize-none"
                placeholder="Pitch yourself to recruiters..."
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <label className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-500" /> Experience
              </label>
              <textarea 
                className="w-full p-6 border border-slate-100 rounded-[1.5rem] h-40 bg-slate-50 focus:bg-white focus:ring-4 ring-blue-500/5 transition-all outline-none resize-none"
                placeholder="List previous roles and achievements..."
                value={profile.experience}
                onChange={(e) => setProfile({...profile, experience: e.target.value})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <GraduationCap size={16} className="text-blue-500" /> Education
              </label>
              <textarea 
                className="w-full p-6 border border-slate-100 rounded-[1.5rem] h-40 bg-slate-50 focus:bg-white focus:ring-4 ring-blue-500/5 transition-all outline-none resize-none"
                placeholder="University, degrees, and certifications..."
                value={profile.education}
                onChange={(e) => setProfile({...profile, education: e.target.value})}
              />
            </div>
            
            <div className="space-y-4">
              <label className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> Official Resume (PDF)
              </label>
              <div className={`border-2 border-dashed rounded-[1.5rem] p-10 text-center transition-all ${profile.resumeUrl ? 'border-green-200 bg-green-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                {uploading ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : (
                  <>
                    <FileText className={`mx-auto mb-3 ${profile.resumeUrl ? 'text-green-500' : 'text-slate-200'}`} size={40} />
                    <p className={`text-sm font-bold mb-4 ${profile.resumeUrl ? 'text-green-700' : 'text-slate-500'}`}>
                      {profile.resumeUrl ? "Resume Active & Synced" : "PDF files only (<800KB)"}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <label className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                        {profile.resumeUrl ? "Update File" : "Upload Resume"}
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, 'resume')} />
                      </label>
                      {profile.resumeUrl && (
                        <a href={profile.resumeUrl} download="resume.pdf" className="px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm bg-white hover:bg-slate-50 transition-colors">
                          Download
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}