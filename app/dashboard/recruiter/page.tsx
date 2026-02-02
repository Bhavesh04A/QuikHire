'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, doc, updateDoc, deleteDoc, getDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  Building2, PlusCircle, ListChecks, MapPin, Trash2, Power, 
  Users, TrendingUp, Search, CheckCircle, Edit3, Save, Upload, Loader2, Calendar, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

export default function RecruiterDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile State
  const [compName, setCompName] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compLogo, setCompLogo] = useState(''); 
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Job Form State
  const [jobData, setJobData] = useState({
    title: '', location: '', type: 'Internship', duration: '', 
    stipend: '', startDate: 'Immediately', deadline: '', description: ''
  });

  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({ hiredCount: 0, activeJobs: 0 });
  const [loading, setLoading] = useState(true);
  //  AI Loading State
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) router.push('/login');
      else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        setProfile(data);
        if (data) {
            setCompName(data.companyName || '');
            setCompWebsite(data.companyWebsite || '');
            setCompDesc(data.companyDescription || '');
            setCompLogo(data.companyLogo || ''); 
        }
        
        const q = query(collection(db, "jobs"), where("recruiterId", "==", user.uid));
        const unsubscribeJobs = onSnapshot(q, async (snapshot) => {
          const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setMyJobs(jobs);

          const activeCount = jobs.filter((j: any) => j.status === 'active').length;

          if (jobs.length > 0) {
            const appQ = query(collection(db, "applications"), where("recruiterId", "==", user.uid));
            const appSnap = await getDocs(appQ);
            const hired = appSnap.docs.filter(doc => doc.data().status === 'hired').length;
            setStats({ hiredCount: hired, activeJobs: activeCount });
          } else {
            setStats({ hiredCount: 0, activeJobs: 0 });
          }
          setLoading(false);
        });

        return () => unsubscribeJobs();
      }
    });
    return () => unsubscribe();
  }, []);

  // AI Generator Function
  const handleGenerateDescription = async () => {
    if (!jobData.title || !jobData.location) {
        alert("Please enter a Job Title and Location first so the AI has context!");
        return;
    }
    
    setGeneratingAI(true);
    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'generate_jd', 
                data: { title: jobData.title, location: jobData.location, type: jobData.type }
            })
        });
        const data = await response.json();
        if (data.reply) {
            setJobData(prev => ({ ...prev, description: data.reply }));
        }
    } catch (error) {
        console.error(error);
        alert("AI Generation failed. Check your API Key.");
    } finally {
        setGeneratingAI(false);
    }
  };

  const convertToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleLogoUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) return alert("Logo too large! Keep it under 500KB.");

    setUploadingLogo(true);
    try {
      const base64 = await convertToBase64(file);
      setCompLogo(base64 as string);
      setUploadingLogo(false);
    } catch (err) {
      console.error(err);
      setUploadingLogo(false);
    }
  };

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
        companyName: compName,
        companyWebsite: compWebsite,
        companyDescription: compDesc,
        companyLogo: compLogo 
    });
    setIsEditing(false); 
    alert("Company Profile Updated!");
  };

  const handlePostJob = async (e: any) => {
    e.preventDefault();
    if (!compName) return alert("Please setup your Company Profile first!");
    
    await addDoc(collection(db, "jobs"), {
      ...jobData,
      recruiterId: auth.currentUser?.uid,
      companyName: compName,
      companyLogo: compLogo,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiry_date: jobData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    setJobData({
      title: '', location: '', type: 'Internship', duration: '', 
      stipend: '', startDate: 'Immediately', deadline: '', description: ''
    });
    alert("Job Posted Successfully!");
    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteJob = async (id: string) => {
    if(confirm("Permanently delete this posting?")) {
      await deleteDoc(doc(db, "jobs", id));
    }
  };

  const toggleJobStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    await updateDoc(doc(db, "jobs", id), { status: newStatus });
  };

  const scrollToJobs = () => {
    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-12">
      {/* Header Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div onClick={scrollToJobs} className="card p-8 bg-slate-900 text-white rounded-[2rem] shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform">
          <h2 className="text-4xl font-black mb-1">{stats.activeJobs}</h2>
          <p className="text-slate-400 font-medium flex items-center gap-2"><TrendingUp size={16}/> Active Jobs</p>
        </div>

        <Link href="/applicants?filter=hired">
          <div className="card p-8 bg-green-600 text-white rounded-[2rem] shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform">
            <h2 className="text-4xl font-black mb-1">{stats.hiredCount}</h2>
            <p className="text-green-100 font-medium flex items-center gap-2"><CheckCircle size={16}/> Hired Candidates</p>
          </div>
        </Link>

        <Link href="/applicants" className="card p-8 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all flex flex-col justify-center items-center text-center cursor-pointer group hover:scale-[1.02]">
          <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-2 group-hover:scale-110 transition-transform">
            <Search size={24} />
          </div>
          <span className="font-bold text-slate-700">Review Applications</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* SIDEBAR: Company Profile */}
        <div className="space-y-6">
            <div className="card p-8 bg-white border border-slate-100 rounded-[2rem] shadow-lg h-fit sticky top-24">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-black flex items-center gap-2 text-slate-800"><Building2 className="w-5 h-5 text-blue-600" /> Company Profile</h2>
                   <button 
                     onClick={() => setIsEditing(!isEditing)} 
                     className="text-xs font-bold text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1"
                   >
                     {isEditing ? 'Cancel' : <><Edit3 size={14}/> Edit</>}
                   </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="flex flex-col items-center mb-4">
                       <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-3 relative group">
                          {uploadingLogo ? <Loader2 className="animate-spin text-blue-600"/> : (
                             compLogo ? <img src={compLogo} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="text-slate-300" size={32}/>
                          )}
                          {isEditing && (
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload size={20}/>
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                          )}
                       </div>
                       {isEditing && <span className="text-[10px] font-bold text-slate-400 uppercase">Click image to upload logo</span>}
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Company Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        className={`w-full p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 ${isEditing ? 'bg-slate-50' : 'bg-transparent pl-0'}`} 
                        value={compName} 
                        onChange={e => setCompName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Website</label>
                      <input 
                        type="url" 
                        disabled={!isEditing}
                        className={`w-full p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 font-medium ${isEditing ? 'bg-slate-50' : 'bg-transparent pl-0'}`} 
                        value={compWebsite} 
                        onChange={e => setCompWebsite(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                      <textarea 
                        disabled={!isEditing}
                        className={`w-full p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 h-32 resize-none leading-relaxed ${isEditing ? 'bg-slate-50' : 'bg-transparent pl-0'}`} 
                        value={compDesc} 
                        onChange={e => setCompDesc(e.target.value)} 
                      />
                    </div>
                    
                    {isEditing && (
                      <button className="btn-primary w-full py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-in fade-in">
                        <Save size={18}/> Save Changes
                      </button>
                    )}
                </form>
            </div>
        </div>

        {/* MAIN: Post and Manage Jobs */}
        <div className="lg:col-span-2 space-y-10">
            <div className="card p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900"><PlusCircle className="text-blue-600" /> Post New Opportunity</h2>
                <form onSubmit={handlePostJob} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <input type="text" placeholder="Job Title (e.g. Node.js Intern)" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold" value={jobData.title} onChange={e => setJobData({...jobData, title: e.target.value})} required />
                        <input type="text" placeholder="Location (e.g. Remote)" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold" value={jobData.location} onChange={e => setJobData({...jobData, location: e.target.value})} required />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                           <label className="text-[10px] font-bold uppercase text-slate-400">Type</label>
                           <select className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm" value={jobData.type} onChange={e => setJobData({...jobData, type: e.target.value})}>
                             <option>Internship</option>
                             <option>Full Time</option>
                             <option>Part Time</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold uppercase text-slate-400">Duration</label>
                           <input type="text" placeholder="e.g. 6 Months" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm" value={jobData.duration} onChange={e => setJobData({...jobData, duration: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold uppercase text-slate-400">Stipend/Salary</label>
                           <input type="text" placeholder="₹ 10k/mo" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm" value={jobData.stipend} onChange={e => setJobData({...jobData, stipend: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold uppercase text-slate-400">Apply By</label>
                           <input type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm" value={jobData.deadline} onChange={e => setJobData({...jobData, deadline: e.target.value})} />
                        </div>
                    </div>

                    <div className="relative">
                        <textarea 
                            placeholder="Describe the day-to-day responsibilities and skills required..." 
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 h-40 resize-none" 
                            value={jobData.description} 
                            onChange={e => setJobData({...jobData, description: e.target.value})} 
                            required 
                        />
                        {/* AI GENERATE BUTTON */}
                        <button 
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={generatingAI}
                            className="absolute top-4 right-4 bg-white border border-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
                        >
                            {generatingAI ? <Loader2 className="animate-spin w-3 h-3"/> : <Sparkles className="w-3 h-3"/>}
                            {generatingAI ? 'Writing...' : 'Auto-Write with AI'}
                        </button>
                    </div>

                    <button className="btn-primary w-full py-5 text-lg font-bold shadow-xl shadow-blue-500/20">Launch Job Post</button>
                </form>
            </div>

            <div id="jobs-section">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-800"><ListChecks /> Active Listings</h2>
                <div className="grid gap-5">
                    {myJobs.map(job => (
                        <div key={job.id} className="card p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-center group hover:border-blue-300 transition-all">
                            <div className="flex-1">
                                <h3 className="font-bold text-xl text-slate-900 mb-1">{job.title}</h3>
                                <div className="flex gap-4 text-xs font-bold text-slate-500">
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {job.duration || 'N/A'}</span>
                                    <span className={`flex items-center gap-1 uppercase tracking-widest ${job.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                                      {job.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => toggleJobStatus(job.id, job.status)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                                <Power size={18} className={job.status === 'active' ? 'text-green-500' : 'text-slate-400'} />
                              </button>
                              <button onClick={() => deleteJob(job.id)} className="p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-red-500">
                                <Trash2 size={18} />
                              </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}