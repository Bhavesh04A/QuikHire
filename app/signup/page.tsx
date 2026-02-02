'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Chrome } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState('seeker');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Display Name
      await updateProfile(user, { displayName: formData.name });

      // 3. Create Firestore Document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: user.email,
        role: role,
        createdAt: new Date().toISOString()
      });

      router.push('/');
    } catch (error: any) {
      // SMART ERROR HANDLING: If email exists, send them to login
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already registered. Redirecting to Login...");
        router.push('/login');
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists to avoid overwriting role
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: role, // Use the role selected in the dropdown
          createdAt: new Date().toISOString(),
          photoURL: user.photoURL
        });
      }
      
      router.push('/');
    } catch (error: any) {
      console.error(error);
      alert("Google Sign-In Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full fade-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Create Account</h1>
          <p className="text-slate-500 font-medium">Join the QuickHire ecosystem today.</p>
        </div>

        <div className="card shadow-2xl p-8 bg-white border-slate-100 rounded-[2rem]">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Full Name</label>
              <input 
                type="text" placeholder="John Doe" required
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-bold text-slate-700"
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Email Address</label>
              <input 
                type="email" placeholder="name@company.com" required
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-bold text-slate-700"
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Password</label>
              <input 
                type="password" placeholder="••••••••" required
                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none font-bold text-slate-700"
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">I want to</label>
              <div className="relative">
                <select 
                  className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl appearance-none cursor-pointer outline-none font-bold text-slate-700"
                  value={role} onChange={(e) => setRole(e.target.value)}
                >
                  <option value="seeker">Find a Job (Seeker)</option>
                  <option value="recruiter">Hire Talent (Recruiter)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex justify-center text-lg shadow-xl shadow-blue-500/20 mt-2">
              {loading ? <Loader2 className="animate-spin" /> : "Get Started"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleSignup}
            className="w-full py-4 border border-slate-200 rounded-xl flex items-center justify-center gap-3 font-bold text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            <Chrome size={20} className="text-slate-900" /> Google
          </button>

          <p className="text-center mt-8 text-sm text-slate-500 font-medium">
            Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}