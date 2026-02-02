'use client';
import { createSyncClient } from '@sleekcms/client';
import { useEffect, useState } from 'react';
import { ShieldCheck, Globe, Zap, Heart } from 'lucide-react';

export default function AboutPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAboutData() {
      try {
        const client = await createSyncClient({
          siteToken: process.env.NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN!,
          env: 'latest',
        });
        
        const aboutPage = client.getPage('/about');

        if (aboutPage) {
            // 1. Robust Parsing for Statistics
            if (aboutPage.key_statistics) {
              try {
                const stats = typeof aboutPage.key_statistics === 'string' 
                  ? JSON.parse(aboutPage.key_statistics) 
                  : aboutPage.key_statistics;
                aboutPage.key_statistics = Array.isArray(stats) ? stats : [];
              } catch (e) {
                console.error("Stats Data Format Error:", e);
                aboutPage.key_statistics = []; 
              }
            }

            // 2. Robust Parsing for Team Images
            if (aboutPage.team_images) {
                try {
                    let images = aboutPage.team_images;
                    if (typeof images === 'string') {
                        images = JSON.parse(images);
                    }
                    aboutPage.team_images = Array.isArray(images) ? images : [images];
                } catch (e) {
                    console.error("Image Data Format Error:", e);
                    aboutPage.team_images = [];
                }
            } else {
                aboutPage.team_images = [];
            }
        }

        setData(aboutPage || {});
      } catch (err) {
        console.error("CMS Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAboutData();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading...</div>;

  const heroBgImage = data?.team_images?.[0]?.url;

  return (
    <div className="flex flex-col bg-white overflow-x-hidden">
      
      {/* SECTION 1: HERO */}
      <section className="relative pt-40 pb-32 px-4 overflow-hidden min-h-[75vh] flex items-center justify-center">
        {/* Background Image Wrapper */}
        <div className="absolute inset-0 z-0">
            {heroBgImage ? (
                <img 
                    src={heroBgImage} 
                    alt="Background" 
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-slate-950" />
            )}
            <div className="absolute inset-0 bg-slate-950/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        </div>

        <div className="container max-w-5xl relative z-10 text-center">
            <span className="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-blue-400/20">
              About Us
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight mb-8 drop-shadow-2xl">
              {data?.headline || "Redefining the Future of Work."}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-medium leading-relaxed max-w-3xl mx-auto">
              QuickHire is the premier ecosystem connecting the world's most ambitious talent with industry-leading organizations.
            </p>
        </div>
      </section>

      {/* SECTION 2: IMPACT METRICS */}
      <section className="relative -mt-24 z-20 px-4 mb-24">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
            {data?.key_statistics?.map((stat: any, i: number) => (
              <div key={i} className="bg-white p-12 text-center hover:bg-slate-50 transition-colors border-r last:border-r-0 border-slate-100">
                <div className="text-5xl font-black text-slate-900 mb-2">{stat.value}</div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: THE STORY */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            <div className="order-2 lg:order-1 max-w-full">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest mb-6">
                <Zap className="w-4 h-4" /> Our Legacy
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
                A platform built on transparency and speed.
              </h2>
              <div 
                className="prose prose-lg text-slate-600 leading-relaxed break-words max-w-full"
                dangerouslySetInnerHTML={{ __html: data?.company_story || "Content loading..." }}
              />
            </div>
            
            <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
              {data?.team_images?.slice(0, 4).map((img: any, i: number) => (
                <div 
                  key={i} 
                  className={`rounded-3xl overflow-hidden shadow-lg border border-slate-100 aspect-[3/4] ${i % 2 !== 0 ? 'mt-8' : ''}`}
                >
                  <img 
                    src={img?.url || ''} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                    alt="Team Member" 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CORE VALUES */}
      <section className="py-32 bg-slate-50 border-y border-slate-100 px-4">
        <div className="container max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">The QuickHire Promise</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4 px-4">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-blue-600"><ShieldCheck size={32} /></div>
              <h3 className="font-bold text-2xl text-slate-900">Verified Trust</h3>
              <p className="text-slate-500 font-medium">Every recruiter is vetted to ensure a safe, high-quality environment for seekers.</p>
            </div>
            <div className="space-y-4 px-4">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-blue-600"><Globe size={32} /></div>
              <h3 className="font-bold text-2xl text-slate-900">Global Reach</h3>
              <p className="text-slate-500 font-medium">Connecting talent across borders to find the perfect cultural and professional fit.</p>
            </div>
            <div className="space-y-4 px-4">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-blue-600"><Heart size={32} /></div>
              <h3 className="font-bold text-2xl text-slate-900">Human Centric</h3>
              <p className="text-slate-500 font-medium">We believe behind every application is a person with a dream and a goal.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}