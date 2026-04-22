'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { LearnDashboard } from '@/components/LearnDashboard';
import { ClinicalPage } from '@/components/ClinicalPage';
import { SimulatePage } from '@/components/SimulatePage';
import { LoadingSpinner } from '@/components/common/Common';
import { LogOut, BookOpen, ShieldPlus, Activity } from 'lucide-react';

export default function Home() {
  const { user, loading, logout, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'learn' | 'clinical' | 'simulate'>('learn');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] text-[#212529] font-sans antialiased overflow-hidden">
      {/* Side Navigation */}
      <aside className="w-64 bg-white border-r border-[#DEE2E6] flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-[#DEE2E6]">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-600">PharmAId</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('learn')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'learn' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <BookOpen className="w-5 h-5" /> Learn
          </button>
          <button
            onClick={() => setActiveTab('clinical')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'clinical' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ShieldPlus className="w-5 h-5" /> Clinical Support
          </button>
          <button
            onClick={() => setActiveTab('simulate')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'simulate' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Activity className="w-5 h-5" /> Simulate
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-[#DEE2E6]">
          <div className="flex flex-col gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-blue-500 overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                      {user.email ? user.email.substring(0, 2) : 'U'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || user.email}</p>
                    <p className="text-xs text-gray-500 truncate">Pharmacist</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center justify-center w-full gap-2 px-4 py-2 border border-[#DEE2E6] rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white hover:bg-blue-700 shadow-md transition-colors"
              >
                Sign In to Save
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
         {/* Mobile Header */}
         <div className="md:hidden flex justify-between items-center mb-6 pb-4 border-b border-[#DEE2E6]">
            <span className="text-xl font-bold tracking-tight text-blue-600">PharmAId</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('learn')} 
                className={`p-2 rounded ${activeTab === 'learn' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
                <BookOpen className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => setActiveTab('clinical')} 
                className={`p-2 rounded ${activeTab === 'clinical' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
                <ShieldPlus className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => setActiveTab('simulate')} 
                className={`p-2 rounded ${activeTab === 'simulate' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
                <Activity className="w-5 h-5"/>
              </button>
            </div>
         </div>

        <div className={activeTab === 'learn' ? 'block' : 'hidden'}>
          <LearnDashboard />
        </div>
        <div className={activeTab === 'clinical' ? 'block' : 'hidden'}>
          <ClinicalPage />
        </div>
        <div className={activeTab === 'simulate' ? 'block' : 'hidden'}>
          <SimulatePage />
        </div>
      </main>
    </div>
  );
}
