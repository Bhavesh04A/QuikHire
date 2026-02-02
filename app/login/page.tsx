'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Chrome, UserCheck, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, demoEmail?: string, demoPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, demoEmail || email, demoPass || password);
      router.push('/'); 
    } catch (error: any) {
      alert("Invalid login credentials. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      // If new Google user, create basic Seeker profile by default
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'seeker', // Default role
          createdAt: new Date().toISOString(),
          photoURL: user.photoURL
        });
      }
      
      router.push('/');
    } catch (error: any) {
      console.error(error);
      alert("Google Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full fade-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Log in to manage your career or hiring pipeline.</p>
        </div>

        <div className="card shadow-2xl p-8 bg-white border-slate-100 rounded-[2rem]">
          
          {/* DEMO LOGIN SECTION */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button 
              onClick={() => handleLogin(undefined, 'seeker@gmail.com', 'demo@123')}
              className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100 group"
            >
              <UserCheck className="text-blue-600 mb-1 group-hover:scale-110 transition-transform" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-800">Demo Seeker</span>
            </button>
            <button 
              onClick={() => handleLogin(undefined, 'demo@gmail.com', 'demo@123')}
              className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100 group"
            >
              <Briefcase className="text-slate-600 mb-1 group-hover:scale-110 transition-transform" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Demo Recruiter</span>
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or login with email</span></div>
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Email Address</label>
              <input 
                type="email" placeholder="john@example.com" required
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-bold text-slate-700"
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Password</label>
              <input 
                type="password" placeholder="••••••••" required
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-bold text-slate-700"
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex justify-center text-lg shadow-xl shadow-blue-500/20">
              {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 border border-slate-200 rounded-xl flex items-center justify-center gap-3 font-bold text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
            >
              <Chrome size={20} className="text-slate-900" /> Sign in with Google
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500 font-medium">
                Do not have an account? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Create one for free</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}