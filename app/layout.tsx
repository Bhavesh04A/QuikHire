'use client';
import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import { User, LogOut, ChevronDown, UserCircle, Briefcase } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import ChatWidget from "./components/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

function Navbar() {
  const { user, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      router.push('/'); 
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <header className="relative w-full z-[100] glass-nav">
      <nav className="container flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-white">
          QuickHire
        </Link>

        <div className="flex items-center gap-6 md:gap-10 text-sm font-bold text-white/90">
          {user && role === 'seeker' && (
            <>
              <Link href="/jobs" className="hover:text-blue-400 transition-colors">Find Jobs</Link>
              <Link href="/companies" className="hover:text-blue-400 transition-colors">Companies</Link>
            </>
          )}

          {user && role === 'recruiter' && (
            <>
              <Link href="/dashboard/recruiter" className="hover:text-blue-400 transition-colors">My Postings</Link>
              <Link href="/applicants" className="hover:text-blue-400 transition-colors">Applicants</Link>
            </>
          )}

          <Link href="/about" className="hover:text-blue-400 transition-colors">About</Link>
          <Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link>
          
          {user ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition border border-white/10"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">
                   {user.displayName?.charAt(0) || <User size={14}/>}
                </div>
                <span className="hidden md:inline">Hi, {user.displayName?.split(' ')[0] || 'User'}</span>
                <ChevronDown size={14} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl py-2 text-slate-900 border border-slate-100 overflow-hidden fade-up origin-top-right">
                  {role === 'seeker' && (
                    <>
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                        <UserCircle size={18} className="text-blue-600" /> View Profile
                      </Link>
                      <Link 
                        href="/applications/my" 
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <Briefcase size={18} className="text-blue-600" /> My Applications
                      </Link>
                    </>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors text-left border-t border-slate-50"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-blue-400 transition-colors">Sign In</Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition">
                Join Now
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          
          {/* 2. RENDER THE CHAT WIDGET HERE */}
          <ChatWidget />
          
        </AuthProvider>

        <footer className="site-footer py-16">
          <div className="container">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">QuickHire</h2>
                <p>The bridge between elite talent and global opportunities.</p>
              </div>
              <div>
                <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-white">Platform</h4>
                <ul className="space-y-2">
                  <li><Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link></li>
                  <li><Link href="/companies" className="hover:text-white transition-colors">Companies</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-white">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-white">Support</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Help Center</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}