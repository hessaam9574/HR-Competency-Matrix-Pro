import React, { useState, useRef, useEffect } from 'react';
import { Competency, Job, KPI, KPIMapping, ImpactLevel, FunctionLevel, ImportanceLevel } from '../types';
import { IMPACT_LEVELS, FUNCTION_LEVELS, ROLE_TYPES, IMPORTANCE_LEVELS } from '../constants';
import { suggestCompetenciesForKPI, suggestIconForText } from '../services/geminiService';
import { ArrowLeft, Check, Sparkles, Trash, FileSpreadsheet, Settings2, Loader2, Pencil, X, AlignLeft, CheckSquare, Square, Layers, User, Users, Building2, Globe2, ArrowRightFromLine, RefreshCw, Box, LogOut, Target, Zap, ShieldCheck, Rocket, Siren, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Briefcase } from 'lucide-react';
// @ts-ignore
import * as XLSX from 'xlsx';

interface Props {
  activeJob: Job | null;
  competencies: Competency[];
  setCompetencies: React.Dispatch<React.SetStateAction<Competency[]>>;
  mappings: KPIMapping[];
  setMappings: React.Dispatch<React.SetStateAction<KPIMapping[]>>;
}

export const MappingWizard: React.FC<Props> = ({ activeJob, competencies, setCompetencies, mappings, setMappings }) => {
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Prompt State
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Form State
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [impact, setImpact] = useState<ImpactLevel>('Input');
  const [func, setFunc] = useState<FunctionLevel>('Individual');
  const [reasoning, setReasoning] = useState('');
  const [roleType, setRoleType] = useState<string>('Enabler');
  const [importance, setImportance] = useState<ImportanceLevel>('High');
  const [compIcon, setCompIcon] = useState('🔹');

  // Edit State
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);

  // Bulk Edit State
  const [selectedMappingIds, setSelectedMappingIds] = useState<Set<string>>(new Set());
  const [bulkRoleType, setBulkRoleType] = useState<string>('Enabler');
  const [bulkImportance, setBulkImportance] = useState<ImportanceLevel>('High');

  if (!activeJob) return <div className="p-10 text-center text-gray-500 dark:text-slate-400">لطفا ابتدا یک شغل را انتخاب کنید.</div>;

  const selectedItem = activeJob.kpis.find(k => k.id === selectedKpiId);
  const selectedFuncLevel = FUNCTION_LEVELS.find(f => f.id === func);
  const selectedImpactLevel = IMPACT_LEVELS.find(i => i.id === impact);

  // Helper for icons
  const getIcon = (type: string, id: string, size = 16) => {
    switch(type) {
        case 'function':
            if (id === 'Individual') return <User size={size} />;
            if (id === 'Team') return <Users size={size} />;
            if (id === 'Organizational') return <Building2 size={size} />;
            if (id === 'Social') return <Globe2 size={size} />;
            break;
        case 'impact':
            if (id === 'Input') return <ArrowRightFromLine size={size} />;
            if (id === 'Process') return <RefreshCw size={size} />;
            if (id === 'Product') return <Box size={size} />;
            if (id === 'Output') return <LogOut size={size} />;
            if (id === 'Outcome') return <Target size={size} />;
            if (id === 'Impact') return <Zap size={size} />;
            break;
        case 'role':
            if (id === 'Enabler') return <ShieldCheck size={size} />;
            if (id === 'Enhancer') return <Rocket size={size} />;
            if (id === 'Critical') return <Siren size={size} />;
            break;
        case 'importance':
            if (id === 'Very High') return <ChevronsUp size={size} />;
            if (id === 'High') return <ChevronUp size={size} />;
            if (id === 'Low') return <ChevronDown size={size} />;
            if (id === 'Very Low') return <ChevronsDown size={size} />;
            break;
    }
    return null;
  };

  useEffect(() => {
    if (selectedItem) {
        setAiPrompt(`Analyze the following Job Description item: "${selectedItem.title}".\nBased on professional HR standards, suggest 3 key Competencies required to fulfill this responsibility.\n\nIMPORTANT: Return results in Persian.`);
        setSelectedMappingIds(new Set());
    }
  }, [selectedItem?.id]);

  const handleAiSuggest = async () => {
    if (!selectedItem) return;
    setLoadingAi(true);
    try {
      const existingTitles = competencies.map(c => c.title);
      const suggestions = await suggestCompetenciesForKPI(selectedItem, existingTitles, aiPrompt);
      if (suggestions.length > 0) {
        const s = suggestions[0];
        setCompTitle(s.title);
        setCompDesc(s.description);
        setImpact(s.impactLevel);
        setFunc(s.functionLevel);
        setReasoning(s.reasoning);
        setImportance(s.importance);
        setCompIcon(s.icon || '🔹');
      }
      setShowPromptSettings(false);
    } catch (e) {
      alert('Error fetching AI suggestions. Check API Key.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!selectedKpiId || !compTitle) return;

    if (editingMappingId) {
        const existingMapping = mappings.find(m => m.id === editingMappingId);
        if (!existingMapping) return;

        const compId = existingMapping.competencyId;
        
        setCompetencies(prev => prev.map(c => c.id === compId ? {
            ...c,
            title: compTitle,
            description: compDesc,
            impactLevel: impact,
            functionLevel: func,
            icon: compIcon
        } : c));

        setMappings(prev => prev.map(m => m.id === editingMappingId ? {
            ...m,
            reasoning: reasoning,
            roleType: roleType as any,
            importance: importance
        } : m));

        setEditingMappingId(null);
    } else {
        let compId = '';
        const existingComp = competencies.find(c => c.title === compTitle && c.impactLevel === impact && c.functionLevel === func);
        
        if (existingComp) {
            compId = existingComp.id;
        } else {
            let finalIcon = compIcon;
            if (compIcon === '🔹') {
                try {
                    finalIcon = await suggestIconForText(compTitle);
                } catch(e) {}
            }

            const newComp: Competency = {
                id: crypto.randomUUID(),
                title: compTitle,
                description: compDesc,
                impactLevel: impact,
                functionLevel: func,
                icon: finalIcon
            };
            setCompetencies([...competencies, newComp]);
            compId = newComp.id;
        }

        const newMapping: KPIMapping = {
            id: crypto.randomUUID(),
            kpiId: selectedKpiId,
            competencyId: compId,
            reasoning,
            roleType: roleType as any,
            importance: importance
        };

        setMappings([...mappings, newMapping]);
    }
    resetForm();
  };

  const startEditMapping = (mapping: KPIMapping) => {
    const comp = competencies.find(c => c.id === mapping.competencyId);
    if (!comp) return;

    setEditingMappingId(mapping.id);
    setCompTitle(comp.title);
    setCompDesc(comp.description || '');
    setImpact(comp.impactLevel);
    setFunc(comp.functionLevel);
    setReasoning(mapping.reasoning);
    setRoleType(mapping.roleType);
    setImportance(mapping.importance);
    setCompIcon(comp.icon || '🔹');
  };

  const resetForm = () => {
      setEditingMappingId(null);
      setCompTitle('');
      setCompDesc('');
      setReasoning('');
      setCompIcon('🔹');
  };

  const deleteMapping = (id: string) => {
    if(confirm('آیا از حذف این نگاشت شایستگی اطمینان دارید؟')) {
        setMappings(mappings.filter(m => m.id !== id));
        if (editingMappingId === id) resetForm();
        if (selectedMappingIds.has(id)) {
            const newSet = new Set(selectedMappingIds);
            newSet.delete(id);
            setSelectedMappingIds(newSet);
        }
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedMappingIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedMappingIds(newSet);
  };

  const toggleSelectAll = (currentMappings: KPIMapping[]) => {
    if (selectedMappingIds.size === currentMappings.length) {
        setSelectedMappingIds(new Set());
    } else {
        const newSet = new Set<string>();
        currentMappings.forEach(m => newSet.add(m.id));
        setSelectedMappingIds(newSet);
    }
  };

  const applyBulkEdit = () => {
    if (selectedMappingIds.size === 0) return;
    if (confirm(`آیا از اعمال تغییرات روی ${selectedMappingIds.size} مورد انتخاب شده اطمینان دارید؟`)) {
        setMappings(prevMappings => prevMappings.map(m => {
            if (selectedMappingIds.has(m.id)) {
                return { ...m, roleType: bulkRoleType as any, importance: bulkImportance };
            }
            return m;
        }));
        setSelectedMappingIds(new Set());
    }
  };

  const deleteBulkMappings = () => {
    if (selectedMappingIds.size === 0) return;
    if (confirm(`آیا از حذف ${selectedMappingIds.size} مورد انتخاب شده اطمینان دارید؟`)) {
        setMappings(prev => prev.filter(m => !selectedMappingIds.has(m.id)));
        if (editingMappingId && selectedMappingIds.has(editingMappingId)) {
            resetForm();
        }
        setSelectedMappingIds(new Set());
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeJob) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        let newCompetencies = [...competencies];
        let newMappings = [...mappings];
        let count = 0;
        data.forEach((row: any) => {
            const kpiTitle = row['Job Description'] || row['description'] || row['شرح شغل'] || row['KPI']; 
            const compTitle = row['Competency'] || row['competency'] || row['شایستگی'];
            if (!kpiTitle || !compTitle) return;
            const targetItem = activeJob.kpis.find(k => k.title.trim() === kpiTitle.trim());
            if (!targetItem) return;
            const rowImpact = (row['Impact'] || 'Input') as ImpactLevel;
            const rowFunc = (row['Function'] || 'Individual') as FunctionLevel;
            const rowReasoning = row['Reasoning'] || row['reasoning'] || row['استدلال'] || '';
            const rowRole = (row['Role'] || 'Enabler') as 'Enabler' | 'Enhancer' | 'Critical';
            const rowImportance = (row['Importance'] || 'High') as ImportanceLevel;
            const rowDesc = row['Description'] || row['description'] || row['توضیحات'] || '';
            let compId = '';
            const existing = newCompetencies.find(c => c.title === compTitle && c.impactLevel === rowImpact && c.functionLevel === rowFunc);
            if (existing) {
                compId = existing.id;
            } else {
                const newComp: Competency = {
                    id: crypto.randomUUID(), title: compTitle, description: rowDesc, impactLevel: rowImpact, functionLevel: rowFunc, icon: '⭐'
                };
                newCompetencies.push(newComp);
                compId = newComp.id;
            }
            const exists = newMappings.find(m => m.kpiId === targetItem.id && m.competencyId === compId);
            if (!exists) {
                newMappings.push({
                    id: crypto.randomUUID(), kpiId: targetItem.id, competencyId: compId, reasoning: rowReasoning, roleType: rowRole, importance: rowImportance
                });
                count++;
            }
        });
        setCompetencies(newCompetencies);
        setMappings(newMappings);
        alert(`${count} نگاشت جدید با موفقیت از اکسل اضافه شد.`);
      } catch (error) {
        alert('خطا در پردازش فایل اکسل.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const currentMappings = mappings.filter(m => m.kpiId === selectedKpiId);

  return (
    <div className="h-full flex gap-4">
      <div className="w-1/4 border-l dark:border-slate-800 pl-4 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">۱. انتخاب مورد شرح شغل</h3>
          <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-1.5 rounded border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center gap-1" title="آپلود اکسل">
            <FileSpreadsheet size={16} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx,.csv" className="hidden" />
        </div>
        
        <div className="space-y-2">
          {activeJob.kpis.map(item => {
            const mapCount = mappings.filter(m => m.kpiId === item.id).length;
            return (
              <div key={item.id} onClick={() => setSelectedKpiId(item.id)} className={`p-3 rounded border cursor-pointer transition-colors ${selectedKpiId === item.id ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <div className="font-medium text-sm line-clamp-2 flex gap-2">
                    <span>{item.icon || '🔸'}</span>
                    {item.title}
                </div>
                <div className={`text-xs mt-1 ${selectedKpiId === item.id ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>{mapCount} شایستگی متصل شده</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {selectedItem ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">شرح شغل انتخاب شده</span>
                        <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 leading-6 mt-1 flex gap-2 items-center">
                            <span className="text-xl">{selectedItem.icon || '🔸'}</span>
                            {selectedItem.title}
                        </h2>
                    </div>
                    <button onClick={() => setShowPromptSettings(!showPromptSettings)} className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 bg-violet-50 dark:bg-violet-900/30 px-3 py-1.5 rounded-full border border-violet-100 dark:border-violet-800 transition-colors ml-4 shrink-0">
                        <Settings2 size={14} /> {showPromptSettings ? 'بستن تنظیمات AI' : 'تنظیم پرامپت هوش مصنوعی'}
                    </button>
                </div>
            </div>

            {showPromptSettings && (
                 <div className="bg-violet-50 dark:bg-violet-900/20 p-4 border-b border-violet-200 dark:border-violet-800 animate-in slide-in-from-top-2">
                     <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full h-24 text-sm p-3 rounded border border-violet-300 dark:border-violet-800 focus:ring-2 focus:ring-violet-500 focus:outline-none mb-2 bg-slate-700 dark:bg-slate-950 text-white font-mono" dir="ltr" />
                     <div className="flex justify-end">
                        <button onClick={handleAiSuggest} disabled={loadingAi} className="bg-violet-600 text-white px-4 py-2 rounded text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
                            {loadingAi ? <><Loader2 size={16} className="animate-spin" /> ...</> : <><Sparkles size={16} /> اعمال</>}
                        </button>
                     </div>
                 </div>
            )}
            
            <div className="p-2 border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                <button onClick={handleAiSuggest} disabled={loadingAi} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
                    {loadingAi ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> پیشنهاد هوش مصنوعی</>}
                </button>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1 text-slate-700 dark:text-slate-300">
                     <label className="text-sm font-bold">عنوان شایستگی</label>
                     {editingMappingId && <span className="text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">حالت ویرایش</span>}
                  </div>
                  <div className="flex gap-2">
                      <div className="w-12 h-11 border border-slate-300 dark:border-slate-600 rounded-md flex items-center justify-center text-2xl bg-white dark:bg-slate-800 shrink-0 shadow-sm">
                          {compIcon}
                      </div>
                      <input value={compTitle} onChange={e => setCompTitle(e.target.value)} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" placeholder="مثال: تفکر انتقادی" />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">توضیحات شایستگی</label>
                  <textarea value={compDesc} onChange={e => setCompDesc(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none h-20 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" placeholder="توضیحات تکمیلی..." />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    {getIcon('function', func)} سطح کارکرد
                  </label>
                  <select value={func} onChange={e => setFunc(e.target.value as FunctionLevel)} className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {FUNCTION_LEVELS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    {getIcon('impact', impact)} سطح اثرگذاری
                  </label>
                  <select value={impact} onChange={e => setImpact(e.target.value as ImpactLevel)} className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {IMPACT_LEVELS.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">استدلال اتصال</label>
                  <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none h-24 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed" placeholder="چرا این شایستگی لازم است؟" />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نقش شایستگی</label>
                        <div className="flex flex-col gap-2">
                            {ROLE_TYPES.map(role => (
                            <label key={role.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                <input type="radio" name="roleType" value={role.id} checked={roleType === role.id} onChange={() => setRoleType(role.id)} className="text-blue-600 focus:ring-blue-500" />
                                <span className="flex items-center gap-1.5 text-sm dark:text-slate-300">{getIcon('role', role.id)} {role.label}</span>
                            </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">میزان اهمیت</label>
                        <div className="grid grid-cols-2 gap-2">
                            {IMPORTANCE_LEVELS.map(imp => (
                                <label key={imp.id} className={`cursor-pointer px-2 py-2 rounded text-center text-sm border transition-all flex items-center justify-center gap-2 ${importance === imp.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
                                    <input type="radio" name="importance" value={imp.id} checked={importance === imp.id} onChange={() => setImportance(imp.id as ImportanceLevel)} className="hidden" />
                                    {getIcon('importance', imp.id)} {imp.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                 {editingMappingId && (
                     <button onClick={resetForm} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 font-bold flex items-center gap-2">
                        <X size={18} /> انصراف
                     </button>
                 )}
                <button onClick={handleSaveMapping} disabled={!compTitle} className={`${editingMappingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 disabled:bg-slate-300 transition-colors`}>
                  <Check size={18} /> {editingMappingId ? 'بروزرسانی تغییرات' : 'ثبت در ماتریس'}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t dark:border-slate-800">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        شایستگی‌های ثبت شده ({currentMappings.length})
                    </h4>
                </div>
                
                {selectedMappingIds.size > 0 && (
                    <div className="bg-blue-600 text-white p-3 rounded-lg mb-4 shadow-lg animate-in slide-in-from-top-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Layers size={18} /> {selectedMappingIds.size} مورد انتخاب شده
                        </div>
                        <div className="flex items-center gap-3">
                             <button onClick={deleteBulkMappings} className="bg-white text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold transition-colors flex items-center gap-1">
                                <Trash size={14} /> حذف
                             </button>
                             <button onClick={applyBulkEdit} className="bg-white text-blue-700 hover:bg-blue-50 px-3 py-1 rounded text-sm font-bold transition-colors">اعمال تغییرات</button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                  {currentMappings.map(mapping => {
                    const comp = competencies.find(c => c.id === mapping.competencyId);
                    const isEditingThis = editingMappingId === mapping.id;
                    const isSelected = selectedMappingIds.has(mapping.id);

                    return (
                      <div key={mapping.id} className={`flex justify-between items-center p-3 rounded border transition-colors ${isEditingThis ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300' : isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex items-start gap-3 overflow-hidden">
                           <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(mapping.id)} className="w-4 h-4 text-blue-600 mt-1 cursor-pointer" />
                           <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{comp?.icon || '⭐'}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{comp?.title}</span>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate max-w-md">{mapping.reasoning}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => startEditMapping(mapping)} className="text-slate-400 dark:text-slate-500 hover:text-blue-500 p-1.5 rounded" title="ویرایش"><Pencil size={16} /></button>
                            <button onClick={() => deleteMapping(mapping.id)} className="text-red-500 hover:text-red-700 p-1" title="حذف"><Trash size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <AlignLeft size={48} className="mb-4 opacity-20" />
            <p>لطفا یک مورد از شرح شغل را انتخاب کنید.</p>
          </div>
        )}
      </div>
    </div>
  );
};