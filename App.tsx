import React, { useState, useEffect } from 'react';
import { JobManager } from './components/JobManager';
import { MappingWizard } from './components/MappingWizard';
import { CompetencyMatrix } from './components/CompetencyMatrix';
import { ReportTable } from './components/ReportTable';
import { ChatBot } from './components/ChatBot';
import { Job, Competency, KPIMapping } from './types';
import { Layers, GitMerge, Grid, Database, FileText, Clock, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'mapping' | 'report' | 'matrix'>('jobs');
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync with HTML class and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Global State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [mappings, setMappings] = useState<KPIMapping[]>([]);
  
  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeJob = jobs.find(j => j.id === activeJobId) || null;

  const weekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(currentTime);
  const day = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(currentTime);
  const month = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(currentTime);
  const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(currentTime);
  
  const formattedDate = `${weekday}، ${day} ${month} ${year}`;

  const formattedTime = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(currentTime);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-slate-900 dark:bg-slate-950 text-white p-4 shadow-lg flex justify-between items-center z-20 border-b border-slate-800 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-inner">
            <Layers className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">سامانه طراحی ماتریس شایستگی Pro</h1>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-slate-300">
           {/* Dark Mode Toggle */}
           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="p-2 rounded-full bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 transition-all text-yellow-400 dark:text-blue-300 border border-slate-700"
             title={isDarkMode ? "تغییر به حالت روز" : "تغییر به حالت شب"}
           >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>

           <div className="h-8 w-px bg-slate-700 mx-2"></div>

           <div className="flex flex-col items-end">
              <span className="font-bold">{formattedDate}</span>
              <span className="flex items-center gap-1 font-mono text-blue-200 dir-ltr">
                {formattedTime} <Clock size={12} />
              </span>
           </div>
           <div className="h-8 w-px bg-slate-700 mx-2"></div>
           <div className="bg-blue-900/40 px-2 py-1 rounded text-[10px] border border-blue-800 text-blue-300 font-bold uppercase">v1.2</div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex gap-4 sticky top-0 z-10 shadow-sm overflow-x-auto transition-colors duration-300">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'jobs' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Database size={18} />
          ۱. شغل و شرح شغل
        </button>
        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'mapping' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <GitMerge size={18} />
          ۲. تحلیل و نگاشت
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'report' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText size={18} />
          ۳. جدول گزارش
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'matrix' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Grid size={18} />
          ۴. ماتریس شایستگی
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-hidden h-[calc(100vh-130px)] transition-colors duration-300">
        {activeTab === 'jobs' && (
          <JobManager 
            jobs={jobs} 
            setJobs={setJobs} 
            activeJobId={activeJobId} 
            setActiveJobId={setActiveJobId} 
            mappings={mappings}
            setMappings={setMappings}
          />
        )}
        
        {activeTab === 'mapping' && (
          <MappingWizard 
            activeJob={activeJob}
            competencies={competencies}
            setCompetencies={setCompetencies}
            mappings={mappings}
            setMappings={setMappings}
          />
        )}

        {activeTab === 'report' && (
           <ReportTable 
             jobs={jobs} 
             competencies={competencies} 
             mappings={mappings} 
           />
        )}

        {activeTab === 'matrix' && (
          <CompetencyMatrix 
            activeJob={activeJob}
            competencies={competencies}
            mappings={mappings}
            kpis={activeJob?.kpis || []}
          />
        )}
      </main>
      
      {/* AI ChatBot */}
      <ChatBot />
    </div>
  );
};

export default App;