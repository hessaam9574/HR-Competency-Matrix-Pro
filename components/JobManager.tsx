import React, { useState, useRef } from 'react';
import { Job, KPI, KPIMapping } from '../types';
import { Plus, Trash2, Briefcase, FileText, Link, Upload, FileSpreadsheet, Sparkles, Settings2, Loader2, Pencil, Check, X, AlignLeft } from 'lucide-react';
import { suggestKPIsForJob, suggestIconForText } from '../services/geminiService';
// @ts-ignore
import * as XLSX from 'xlsx';

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  activeJobId: string | null;
  setActiveJobId: (id: string) => void;
  mappings: KPIMapping[];
  setMappings: React.Dispatch<React.SetStateAction<KPIMapping[]>>;
}

export const JobManager: React.FC<Props> = ({ jobs, setJobs, activeJobId, setActiveJobId, mappings, setMappings }) => {
  const [newJobTitle, setNewJobTitle] = useState('');
  
  // Job Description Form State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  
  // AI State
  const [loadingAi, setLoadingAi] = useState(false);
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Edit States
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editJobTitle, setEditJobTitle] = useState('');

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Advanced Excel Import States ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importedRows, setImportedRows] = useState<any[][]>([]);
  const [importedHeaders, setImportedHeaders] = useState<string[]>([]);
  const [colMapJob, setColMapJob] = useState<number>(0);
  const [colMapKpi, setColMapKpi] = useState<number>(1);
  const [colMapDesc, setColMapDesc] = useState<number>(2);
  const [importMergeMode, setImportMergeMode] = useState<'merge' | 'replace'>('merge');
  const [selectedImportJobs, setSelectedImportJobs] = useState<Set<string>>(new Set());
  const [selectedImportKpis, setSelectedImportKpis] = useState<Set<string>>(new Set());

  const activeJob = jobs.find(j => j.id === activeJobId);

  // Initialize default prompt when job changes
  React.useEffect(() => {
    if (activeJob) {
        setAiPrompt(`Analyze the job title: "${activeJob.title}".\nList 5 key responsibilities or tasks for this job description.\n\nOutput Language: Persian (Farsi).`);
    }
  }, [activeJob?.title]);

  const addJob = async () => {
    if (!newJobTitle.trim()) return;
    const tempId = crypto.randomUUID();
    
    // Optimistic UI update with temporary icon
    const newJob: Job = {
      id: tempId,
      title: newJobTitle,
      kpis: [],
      icon: '💼' // Default
    };
    
    setJobs([...jobs, newJob]);
    setNewJobTitle('');
    setActiveJobId(newJob.id);

    // Fetch AI Icon in background
    try {
        const icon = await suggestIconForText(newJob.title);
        setJobs(prev => prev.map(j => j.id === tempId ? { ...j, icon } : j));
    } catch (e) {
        console.error('Failed to fetch icon', e);
    }
  };

  // --- Job Edit Functions ---
  const startEditJob = (job: Job) => {
    setEditingJobId(job.id);
    setEditJobTitle(job.title);
  };

  const saveEditJob = () => {
    if (editingJobId && editJobTitle.trim()) {
      setJobs(jobs.map(j => j.id === editingJobId ? { ...j, title: editJobTitle } : j));
      setEditingJobId(null);
    }
  };

  const cancelEditJob = () => {
    setEditingJobId(null);
  };

  const deleteJob = (id: string) => {
    if (window.confirm('آیا از حذف این شغل اطمینان دارید؟ تمامی موارد شرح شغل و نگاشت‌ها حذف خواهند شد.')) {
      // 1. Cleanup mappings
      const jobToDelete = jobs.find(j => j.id === id);
      if (jobToDelete) {
         const kpiIds = jobToDelete.kpis.map(k => k.id);
         setMappings(prev => prev.filter(m => !kpiIds.includes(m.kpiId)));
      }

      // 2. Remove job
      const remainingJobs = jobs.filter(j => j.id !== id);
      setJobs(remainingJobs);

      // 3. Update selection if needed
      if (activeJobId === id) {
        setActiveJobId(remainingJobs[0]?.id || null);
      }
    }
  };

  // --- Description Item (KPI) Edit Functions ---
  const startEditItem = (item: KPI) => {
    setEditingItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemDesc(item.description || '');
  };

  const saveEditItem = () => {
    if (activeJob && editingItemId && editItemTitle.trim()) {
        const updatedJobs = jobs.map(j => {
            if (j.id === activeJob.id) {
                return {
                    ...j,
                    kpis: j.kpis.map(k => k.id === editingItemId ? { ...k, title: editItemTitle, description: editItemDesc } : k)
                };
            }
            return j;
        });
        setJobs(updatedJobs);
        setEditingItemId(null);
    }
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
  };

  const deleteItem = (itemId: string) => {
    if (!activeJob) return;
    
    if (window.confirm('آیا از حذف این مورد از شرح شغل اطمینان دارید؟')) {
      const updatedJobs = jobs.map(j => {
        if (j.id === activeJob.id) {
          return { ...j, kpis: j.kpis.filter(k => k.id !== itemId) };
        }
        return j;
      });
      setJobs(updatedJobs);
    }
  };

  const addDescriptionToJob = async () => {
    if (!activeJobId || !newItemTitle.trim()) return;
    
    const tempId = crypto.randomUUID();
    const newItem: KPI = {
      id: tempId,
      title: newItemTitle,
      description: newItemDescription,
      icon: '📝' // Default
    };
    
    // Optimistic Update
    const updatedJobs = jobs.map(j => {
      if (j.id === activeJobId) {
        return { ...j, kpis: [...j.kpis, newItem] };
      }
      return j;
    });
    setJobs(updatedJobs);
    setNewItemTitle('');
    setNewItemDescription('');

    // Fetch AI Icon
    try {
        const icon = await suggestIconForText(newItem.title);
        setJobs(prev => prev.map(j => {
            if (j.id === activeJobId) {
                return {
                    ...j,
                    kpis: j.kpis.map(k => k.id === tempId ? { ...k, icon } : k)
                };
            }
            return j;
        }));
    } catch (e) {
        console.error('Failed to fetch item icon', e);
    }
  };

  const handleAiSuggest = async () => {
      if (!activeJob) return;
      setLoadingAi(true);
      try {
          const suggestions = await suggestKPIsForJob(activeJob.title, aiPrompt);
          const newItems = suggestions.map(s => ({
              id: crypto.randomUUID(),
              title: s.title,
              description: s.description || '',
              icon: s.icon || '🔹'
          }));
          
          setJobs(jobs.map(j => {
              if (j.id === activeJob.id) {
                  return { ...j, kpis: [...j.kpis, ...newItems] };
              }
              return j;
          }));
          // Hide settings if they were open, as action is complete
          setShowPromptSettings(false);
      } catch (e) {
          alert('خطا در دریافت پیشنهاد هوش مصنوعی.');
      } finally {
          setLoadingAi(false);
      }
  };

  // --- New Advanced Excel Import Handlers ---
  const downloadSampleExcel = () => {
    try {
      const sampleData = [
        ["عنوان شغل", "عنوان وظیفه / KPI", "شرح و توضیحات تکمیلی"],
        ["مدیر بازاریابی", "تدوین استراتژی بازاریابی دیجیتال", "طراحی کمپین‌های تبلیغاتی آنلاین و تعیین بودجه‌بندی تخصیص یافته به هر کانال"],
        ["مدیر بازاریابی", "تحلیل رفتار مشتریان و رقبا", "استفاده از ابزارهای آنالیتیکس برای رصد نرخ تبدیل و تحلیل روندهای کلی بازار"],
        ["توسعه‌دهنده نرم‌افزار ارشد", "طراحی معماری سیستم و پایگاه داده", "پیاده‌سازی ساختار لایه‌ای پایدار و بهینه‌سازی کوئری‌های پرمصرف دیتابیس"],
        ["توسعه‌دهنده نرم‌افزار ارشد", "ارزیابی و بررسی کدهای تیم (Code Review)", "بررسی استانداردهای نگارشی کد، برطرف کردن خطاهای امنیتی و بهبود عملکرد سرویس‌ها"],
        ["کارشناس منابع انسانی", "فرآیند جذب و استخدام نیروهای جدید", "برنامه‌ریزی، فیلتر رزومه‌ها، مصاحبه اولیه و همراهی همکار در مسیر بدو ورود به سازمان"],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      ws['!cols'] = [
        { wch: 30 },
        { wch: 35 },
        { wch: 55 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "قالب نمونه شرح شغل");
      XLSX.writeFile(wb, "HR_KPI_Template.xlsx");
    } catch (e) {
      console.error('Failed to generate template download', e);
      alert('خطا در دانلود قالب نمونه اکسل.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
         handleExcelParse(file);
      } else {
         alert('لطفاً فقط فایل‌های با فرمت اکسل (.xlsx, .xls) یا CSV بارگذاری کنید.');
      }
    }
  };

  const handleExcelParse = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (rawRows.length === 0) {
          alert('فایل اکسل تهی است یا اطلاعات معتبری ندارد.');
          return;
        }

        const headersRow = rawRows[0] || [];
        const stringHeaders = headersRow.map((h: any, i: number) => {
          return h ? h.toString().trim() : `ستون ${i + 1}`;
        });

        const dataRows = rawRows.slice(1).filter(row => row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''));

        if (dataRows.length === 0) {
          alert('داده‌ای برای بارگذاری یافت نشد (فقط ردیف سربرگ موجود است یا ردیف‌ها خالی هستند).');
          return;
        }

        setImportedHeaders(stringHeaders);
        setImportedRows(dataRows);

        let jobIdx = 0;
        let kpiIdx = 1;
        let descIdx = 2;

        stringHeaders.forEach((h: string, i: number) => {
          const lh = h.toLowerCase();
          if (lh.includes('شغل') || lh.includes('job') || lh.includes('عنوان شغل') || lh.includes('سازمان')) {
            jobIdx = i;
          } else if (lh.includes('شاخص') || lh.includes('kpi') || lh.includes('وظیفه') || lh.includes('مسئولیت') || lh.includes('مسولیت') || lh.includes('عنوان')) {
            kpiIdx = i;
          } else if (lh.includes('توضیح') || lh.includes('شرح') || lh.includes('description') || lh.includes('متن')) {
            descIdx = i;
          }
        });

        setColMapJob(jobIdx < stringHeaders.length ? jobIdx : 0);
        setColMapKpi(kpiIdx < stringHeaders.length ? kpiIdx : Math.min(1, stringHeaders.length - 1));
        setColMapDesc(descIdx < stringHeaders.length ? descIdx : -1);

        const initJobs = new Set<string>();
        const initKpis = new Set<string>();

        dataRows.forEach((row) => {
          const jobTitle = row[jobIdx]?.toString().trim();
          const kpiTitle = row[kpiIdx]?.toString().trim();
          if (jobTitle) {
            initJobs.add(jobTitle);
            if (kpiTitle) {
              initKpis.add(`${jobTitle}|${kpiTitle}`);
            }
          }
        });

        setSelectedImportJobs(initJobs);
        setSelectedImportKpis(initKpis);

      } catch (err) {
        console.error(err);
        alert('خطا در پردازش فایل اکسل. مطمئن شوید که فرمت فایل معتبر است.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const applyExcelImport = () => {
    if (importedRows.length === 0) return;

    const workingJobsMap = new Map<string, Job>();

    if (importMergeMode === 'merge') {
      jobs.forEach(j => {
        workingJobsMap.set(j.title.trim(), {
          ...j,
          kpis: [...j.kpis]
        });
      });
    }

    importedRows.forEach((row) => {
      const jobTitle = row[colMapJob]?.toString().trim();
      const kpiTitle = row[colMapKpi]?.toString().trim();
      const kpiDesc = colMapDesc !== -1 ? row[colMapDesc]?.toString().trim() || '' : '';

      if (!jobTitle || !selectedImportJobs.has(jobTitle)) return;

      let jobObj = workingJobsMap.get(jobTitle);
      if (!jobObj) {
        jobObj = {
          id: crypto.randomUUID(),
          title: jobTitle,
          kpis: [],
          icon: '💼'
        };
        workingJobsMap.set(jobTitle, jobObj);
      }

      if (kpiTitle && selectedImportKpis.has(`${jobTitle}|${kpiTitle}`)) {
        const alreadyExists = jobObj.kpis.some(k => k.title.trim() === kpiTitle);
        if (!alreadyExists) {
          jobObj.kpis.push({
            id: crypto.randomUUID(),
            title: kpiTitle,
            description: kpiDesc,
            icon: '📝'
          });
        }
      }
    });

    const finalJobs = Array.from(workingJobsMap.values());
    setJobs(finalJobs);

    if (finalJobs.length > 0) {
      if (!activeJobId || !finalJobs.some(j => j.id === activeJobId)) {
        setActiveJobId(finalJobs[0].id);
      }
    } else {
      setActiveJobId(null);
    }

    alert('شرح مشاغل انتخابی با موفقیت بارگذاری شدند.');
    closeImportModal();
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportedRows([]);
    setImportedHeaders([]);
    setColMapJob(0);
    setColMapKpi(1);
    setColMapDesc(2);
    setImportMergeMode('merge');
    setSelectedImportJobs(new Set());
    setSelectedImportKpis(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getParsedStructure = () => {
    const struct: { jobTitle: string; kpis: { title: string; description: string }[] }[] = [];
    const tempMap = new Map<string, { title: string; description: string }[]>();

    importedRows.forEach((row) => {
      const jobTitle = row[colMapJob]?.toString().trim();
      const kpiTitle = row[colMapKpi]?.toString().trim();
      const kpiDesc = colMapDesc !== -1 ? row[colMapDesc]?.toString().trim() || '' : '';

      if (jobTitle) {
        if (!tempMap.has(jobTitle)) {
          tempMap.set(jobTitle, []);
        }
        if (kpiTitle) {
          const list = tempMap.get(jobTitle)!;
          if (!list.some(k => k.title === kpiTitle)) {
            list.push({ title: kpiTitle, description: kpiDesc });
          }
        }
      }
    });

    tempMap.forEach((kpis, jobTitle) => {
      struct.push({ jobTitle, kpis });
    });

    return struct;
  };

  const parsedStructure = getParsedStructure();

  const toggleAllJobKpis = (jobTitle: string, checked: boolean) => {
    const newJobs = new Set(selectedImportJobs);
    const newKpis = new Set(selectedImportKpis);

    if (checked) {
      newJobs.add(jobTitle);
      parsedStructure.find(s => s.jobTitle === jobTitle)?.kpis.forEach(k => {
        newKpis.add(`${jobTitle}|${k.title}`);
      });
    } else {
      newJobs.delete(jobTitle);
      parsedStructure.find(s => s.jobTitle === jobTitle)?.kpis.forEach(k => {
        newKpis.delete(`${jobTitle}|${k.title}`);
      });
    }

    setSelectedImportJobs(newJobs);
    setSelectedImportKpis(newKpis);
  };

  const toggleSingleKpi = (jobTitle: string, kpiTitle: string, checked: boolean) => {
    const newKpis = new Set(selectedImportKpis);
    const key = `${jobTitle}|${kpiTitle}`;

    if (checked) {
      newKpis.add(key);
      const newJobs = new Set(selectedImportJobs);
      newJobs.add(jobTitle);
      setSelectedImportJobs(newJobs);
    } else {
      newKpis.delete(key);
    }
    setSelectedImportKpis(newKpis);
  };

  const sortedJobs = [...jobs].sort((a, b) => a.title.localeCompare(b.title, 'fa'));

  return (
    <div className="h-full flex gap-6">
      {/* Sidebar: Job List */}
      <div className="w-1/3 border-l border-slate-200 dark:border-slate-800 pl-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-bold flex items-center gap-2 dark:text-slate-100">
            <Briefcase className="text-blue-600 dark:text-blue-400" />
            لیست مشاغل
          </h3>
          <div className="relative">
             <button 
                onClick={() => setIsImportModalOpen(true)} 
                className="text-xs flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
             >
                <FileSpreadsheet size={14} /> ورود اکسل
             </button>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newJobTitle}
            onChange={(e) => setNewJobTitle(e.target.value)}
            placeholder="عنوان شغل جدید..."
            className="flex-1 border dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button onClick={addJob} className="bg-blue-600 dark:bg-blue-700 text-white p-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto space-y-2">
          {sortedJobs.map(job => {
            const jobKpiIds = job.kpis.map(k => k.id);
            const mappingCount = mappings.filter(m => jobKpiIds.includes(m.kpiId)).length;
            const isEditing = editingJobId === job.id;

            return (
              <div 
                key={job.id}
                onClick={() => !isEditing && setActiveJobId(job.id)}
                className={`p-3 rounded border cursor-pointer transition-all flex justify-between items-center group ${
                  activeJobId === job.id 
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-sm' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800'
                }`}
              >
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                        <input 
                            value={editJobTitle}
                            onChange={(e) => setEditJobTitle(e.target.value)}
                            className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <button onClick={saveEditJob} className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 p-1 rounded"><Check size={16} /></button>
                        <button onClick={cancelEditJob} className="text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 p-1 rounded"><X size={16} /></button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{job.icon || '💼'}</span>
                            <span className="font-medium truncate dark:text-slate-200">{job.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 mr-7">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{job.kpis.length} مورد شرح شغل</span>
                            {mappingCount > 0 && (
                            <span className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                <Link size={10} /> {mappingCount} شایستگی
                            </span>
                            )}
                        </div>
                        </div>

                        {/* Action Buttons for Job */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => startEditJob(job)} className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/40" title="ویرایش">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => deleteJob(job.id)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/40" title="حذف">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </>
                )}
              </div>
            );
          })}
          {jobs.length === 0 && <div className="text-center text-slate-400 dark:text-slate-500 mt-10">هیچ شغلی تعریف نشده است.</div>}
        </div>
      </div>

      {/* Main Content: Job Description */}
      <div className="w-2/3 pr-2">
        {activeJobId ? (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <FileText className="text-emerald-600 dark:text-emerald-400" />
                  شرح شغل برای: <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">{jobs.find(j => j.id === activeJobId)?.icon} {jobs.find(j => j.id === activeJobId)?.title}</span>
                </h3>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowPromptSettings(!showPromptSettings)} 
                        className={`flex items-center justify-center p-2 rounded-full border transition-colors ${showPromptSettings ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-800' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        title="تنظیمات هوش مصنوعی"
                    >
                        <Settings2 size={16} />
                    </button>

                    <button 
                        onClick={handleAiSuggest} 
                        disabled={loadingAi}
                        className="flex items-center gap-2 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                         {loadingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                         پیشنهاد شرح شغل هوشمند
                    </button>
                </div>
            </div>

            {showPromptSettings && (
                <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg border border-violet-200 dark:border-violet-800 mb-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-violet-800 dark:text-violet-300 text-sm flex items-center gap-2"><Settings2 size={16} /> تنظیمات پرامپت هوش مصنوعی</h4>
                    </div>
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full h-24 text-sm p-3 rounded border border-violet-300 dark:border-violet-800 focus:ring-2 focus:ring-violet-500 focus:outline-none mb-3 bg-slate-700 dark:bg-slate-900 text-white placeholder-slate-400 font-mono"
                        dir="ltr"
                    />
                </div>
            )}

            {/* Add Job Description Item Form */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
              <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">افزودن مورد جدید به شرح شغل:</label>
                  <input
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="عنوان وظیفه یا مسئولیت (مثلاً: تدوین استراتژی)"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                  />
                  <textarea 
                    value={newItemDescription} 
                    onChange={(e) => setNewItemDescription(e.target.value)} 
                    placeholder="توضیحات تکمیلی (اختیاری)" 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 min-h-[60px]"
                  />
                  <div className="flex justify-end">
                    <button onClick={addDescriptionToJob} className="bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-2 rounded hover:bg-emerald-700 dark:hover:bg-emerald-600 flex items-center gap-2 whitespace-nowrap text-sm font-bold shadow-md transition-all">
                        <Plus size={16} /> افزودن به شرح شغل
                    </button>
                  </div>
              </div>
            </div>

            {/* Job Description Items List */}
            <div className="flex-1 overflow-auto">
               <div className="space-y-3">
                 {activeJob?.kpis.map((item, index) => {
                   const isEditing = editingItemId === item.id;
                   
                   return (
                   <div 
                      key={item.id} 
                      className={`flex flex-col p-4 rounded border transition-all ${
                        isEditing 
                        ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-100 dark:ring-emerald-900/30' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800'
                      }`}
                   >
                     {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <input 
                                value={editItemTitle} 
                                onChange={(e) => setEditItemTitle(e.target.value)} 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
                                placeholder="عنوان"
                            />
                            <textarea 
                                value={editItemDesc} 
                                onChange={(e) => setEditItemDesc(e.target.value)} 
                                className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[60px]" 
                                placeholder="توضیحات"
                            />
                            <div className="flex justify-end gap-2 mt-1">
                                <button onClick={cancelEditItem} className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600">انصراف</button>
                                <button onClick={saveEditItem} className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">ذخیره تغییرات</button>
                            </div>
                        </div>
                     ) : (
                        <div className="flex gap-3">
                           <div className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded text-xl shrink-0 mt-0.5 shadow-sm border border-slate-100 dark:border-slate-600">
                                {item.icon || '🔸'}
                           </div>
                           <div className="flex-1">
                                <p className="text-slate-800 dark:text-slate-200 text-sm font-bold leading-6 text-justify">{item.title}</p>
                                {item.description && (
                                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-5 text-justify mt-1">{item.description}</p>
                                )}
                           </div>
                           
                           <div className="flex flex-col gap-2 shrink-0">
                                {mappings.filter(m => m.kpiId === item.id).length > 0 && (
                                    <div className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800 flex items-center gap-1 justify-center" title="تعداد شایستگی‌های متصل">
                                        <Link size={10} /> {mappings.filter(m => m.kpiId === item.id).length}
                                    </div>
                                )}
                                <button onClick={() => startEditItem(item)} className="text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors" title="ویرایش">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={() => deleteItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-slate-700 transition-colors" title="حذف">
                                    <Trash2 size={14} />
                                </button>
                           </div>
                        </div>
                     )}
                   </div>
                 );
                })}
                 
                 {activeJob?.kpis.length === 0 && (
                   <div className="text-center text-slate-400 dark:text-slate-500 mt-10 flex flex-col items-center gap-2">
                     <AlignLeft size={48} className="opacity-10" />
                     <p>شرح شغلی برای این عنوان تعریف نشده است.</p>
                     <p className="text-xs">از فرم بالا یا دکمه «ورود اکسل» استفاده کنید.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">یک شغل را انتخاب کنید تا جزئیات آن نمایش داده شود.</div>
        )}
      </div>

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col transition-colors duration-300 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 rounded-t-xl transition-colors duration-300">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 select-none">
                <FileSpreadsheet size={20} />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">ورود گروهی شرح مشاغل از اکسل</h3>
              </div>
              <button 
                onClick={closeImportModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="بستن"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {importedRows.length === 0 ? (
                /* STEP 1: Upload and template view */
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Left explanation and template download */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-105 dark:border-blue-900/50 p-4 rounded-lg space-y-3">
                      <h4 className="font-bold text-blue-800 dark:text-blue-300 text-xs">راهنمای بارگذاری فایل</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                        شما می‌توانید فایلی با پسوند اکسل (<code className="font-mono bg-indigo-50 dark:bg-indigo-900/50 px-1 rounded text-indigo-600 dark:text-indigo-400">.xlsx</code> یا <code className="font-mono bg-indigo-50 dark:bg-indigo-900/50 px-1 rounded text-indigo-600 dark:text-indigo-400">.xls</code>) یا فایلی با فرمت <code className="font-mono bg-indigo-50 dark:bg-indigo-900/50 px-1 rounded text-indigo-600 dark:text-indigo-400">.csv</code> حاوی وظایف شغلی و KPIهای سازمان خود را بارگذاری کنید.
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                        سیستم به صورت هوشمند ستون‌های فایل را شناسایی کرده و امکان تطبیق آن‌ها را فراهم می‌کند. برای راحتی کار، می‌توانید از قالب نمونه پیش‌فرض استفاده نمایید.
                      </p>
                    </div>

                    <button
                      onClick={downloadSampleExcel}
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-300 text-xs font-bold p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                      <Upload size={14} className="rotate-180" />
                      دانلود نمونه قالب استاندارد اکسل
                    </button>
                  </div>

                  {/* Right Drag & Drop Area */}
                  <div className="md:col-span-3">
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                        dragActive 
                        ? 'border-green-500 bg-green-50/30 dark:bg-green-950/10 scale-[0.98]' 
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10 hover:border-green-400 hover:bg-slate-100/30 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleExcelParse(file);
                        }} 
                        accept=".xlsx, .xls, .csv" 
                        className="hidden" 
                      />
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 shadow-sm border border-green-200 dark:border-green-900/40">
                        <Upload size={24} />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">فایل اکسل خود را اینجا رها کنید یا برای مستند پیوست کلیک نمایید</p>
                      <p className="text-[10px] text-slate-400 mt-2">فرمت‌های مجاز: Excel, CSV (حداکثر ۱۰ مگابایت)</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* STEP 2: Custom Mapping & Selection table */
                <div className="space-y-6">
                  {/* Mapping Grid */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg transition-colors">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <Settings2 size={16} className="text-blue-500" />
                      تنظیمات نگاشت ستون‌ها و استراتژی ادغام
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Job title map select */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ستون حاوی «عنوان شغل»:</label>
                        <select
                          value={colMapJob}
                          onChange={(e) => setColMapJob(Number(e.target.value))}
                          className="w-full text-xs font-medium border dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          {importedHeaders.map((head, idx) => (
                            <option key={idx} value={idx}>{head}</option>
                          ))}
                        </select>
                      </div>

                      {/* KPI title map select */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ستون حاوی «عنوان شاخص / KPI»:</label>
                        <select
                          value={colMapKpi}
                          onChange={(e) => setColMapKpi(Number(e.target.value))}
                          className="w-full text-xs font-medium border dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          {importedHeaders.map((head, idx) => (
                            <option key={idx} value={idx}>{head}</option>
                          ))}
                        </select>
                      </div>

                      {/* KPI description map select */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ستون حاوی «شرح و توضیحات تکمیلی»:</label>
                        <select
                          value={colMapDesc}
                          onChange={(e) => setColMapDesc(Number(e.target.value))}
                          className="w-full text-xs font-medium border dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="-1">-- عدم انتخاب (فقط عنوان وارد شود) --</option>
                          {importedHeaders.map((head, idx) => (
                            <option key={idx} value={idx}>{head}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-4"></div>

                    {/* Conflict Strategy selection */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">نحوه برخورد با اطلاعات فعلی سیستم:</div>
                        <div className="text-[10px] text-slate-500">مشخص کنید سیستم با اضافه کردن داده‌های تازه به بانک مشاغل چگونه رفتار کند.</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImportMergeMode('merge')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                            importMergeMode === 'merge'
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          ادغام با مشاغل فعلی (حفظ داده‌های قبلی)
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportMergeMode('replace')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                            importMergeMode === 'replace'
                            ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          پاک‌سازی و بازنشانی کامل مشاغل قبلی
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preloaded structure list */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        پیش‌نمایش شرح کارهای استخراج‌شده ({parsedStructure.length} عنوان شغل، {importedRows.length} ردیف داده اکسل)
                      </span>
                      <div className="flex gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            const newJobs = new Set<string>();
                            const newKpis = new Set<string>();
                            parsedStructure.forEach(p => {
                              newJobs.add(p.jobTitle);
                              p.kpis.forEach(k => newKpis.add(`${p.jobTitle}|${k.title}`));
                            });
                            setSelectedImportJobs(newJobs);
                            setSelectedImportKpis(newKpis);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                        >
                          انتخاب همه
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImportJobs(new Set());
                            setSelectedImportKpis(new Set());
                          }}
                          className="text-slate-500 dark:text-slate-400 hover:underline font-bold"
                        >
                          لغو انتخاب همه
                        </button>
                      </div>
                    </div>

                    {/* Hierarchy Previewer */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-64 overflow-y-auto bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                      {parsedStructure.map((structJob, sIdx) => {
                        const isJobChecked = selectedImportJobs.has(structJob.jobTitle);
                        const jobKpiCount = structJob.kpis.length;
                        const checkedKpisCount = structJob.kpis.filter(k => selectedImportKpis.has(`${structJob.jobTitle}|${k.title}`)).length;

                        return (
                          <div key={sIdx} className="p-3 space-y-2">
                            {/* Job Row Header with summary */}
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isJobChecked}
                                  onChange={(e) => toggleAllJobKpis(structJob.jobTitle, e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                                />
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  💼 {structJob.jobTitle}
                                </span>
                              </label>
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-500 px-2 py-0.5 rounded font-medium direction-ltr">
                                {checkedKpisCount} از {jobKpiCount} شاخص انتخاب شده
                              </span>
                            </div>

                            {/* Sub KPI Rows */}
                            {isJobChecked && structJob.kpis.length > 0 && (
                              <div className="mr-6 pr-3 border-r border-slate-200 dark:border-slate-800 space-y-2 py-1">
                                {structJob.kpis.map((kpi, kIdx) => {
                                  const kpiKey = `${structJob.jobTitle}|${kpi.title}`;
                                  const isKpiChecked = selectedImportKpis.has(kpiKey);

                                  return (
                                    <div key={kIdx} className="text-xs flex gap-2 items-start py-0.5 group">
                                      <input
                                        type="checkbox"
                                        checked={isKpiChecked}
                                        onChange={(e) => toggleSingleKpi(structJob.jobTitle, kpi.title, e.target.checked)}
                                        className="rounded text-green-600 focus:ring-green-500 border-slate-300 dark:border-slate-600 mt-1"
                                      />
                                      <div className="flex-1">
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">{kpi.title}</p>
                                        {kpi.description && (
                                          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 leading-relaxed">{kpi.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-950 rounded-b-xl transition-colors duration-300">
              <div>
                {importedRows.length > 0 && (
                  <button
                    onClick={() => {
                      setImportedRows([]);
                      setImportedHeaders([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-all border border-slate-200 dark:border-slate-700"
                  >
                    بارگذاری مجدد فایل دیگر
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeImportModal}
                  className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-md transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                {importedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={applyExcelImport}
                    disabled={selectedImportJobs.size === 0}
                    className="px-5 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-md transition-all duration-150 shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={14} />
                    بارگذاری اطلاعات به سیستم
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};