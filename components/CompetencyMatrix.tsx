import React, { useRef, useState } from 'react';
import { Competency, Job, KPI, KPIMapping } from '../types';
import { IMPACT_LEVELS, FUNCTION_LEVELS, ROLE_TYPES, IMPORTANCE_LEVELS, getCompetencyColorClass } from '../constants';
import { Info, Download, Filter, Check, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Minus, User, Users, Building2, Globe2, ArrowRightFromLine, RefreshCw, Box, LogOut, Target, Zap } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import jsPDF from 'jspdf';

interface Props {
  activeJob: Job | null;
  competencies: Competency[];
  mappings: KPIMapping[];
  kpis: KPI[];
}

export const CompetencyMatrix: React.FC<Props> = ({ activeJob, competencies, mappings, kpis }) => {
  const matrixRef = useRef<HTMLDivElement>(null);
  const [filterRoles, setFilterRoles] = useState<string[]>(ROLE_TYPES.map(r => r.id));
  const [filterImportance, setFilterImportance] = useState<string[]>(IMPORTANCE_LEVELS.map(i => i.id));

  if (!activeJob) return <div className="p-10 text-center text-gray-500 dark:text-slate-400">لطفا ابتدا یک شغل را انتخاب کنید.</div>;

  const jobKpiIds = activeJob.kpis.map(k => k.id);
  const relevantMappings = mappings.filter(m => jobKpiIds.includes(m.kpiId));
  const mappedCompetencyIds = relevantMappings.map(m => m.competencyId);
  const jobCompetencies = competencies.filter(c => mappedCompetencyIds.includes(c.id));

  const handleDownloadPdf = async () => {
    if (!matrixRef.current) return;
    try {
        const canvas = await html2canvas(matrixRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        pdf.addImage(imgData, 'PNG', (pdfWidth - imgWidth * ratio) / 2, 10, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`Matrix-${activeJob.title}.pdf`);
    } catch (error) { alert("خطا در ایجاد PDF"); }
  };

  const getImportanceIcon = (level: string) => {
    switch (level) {
      case 'Very High': return <ChevronsUp size={14} strokeWidth={3} />;
      case 'High': return <ChevronUp size={14} strokeWidth={3} />;
      case 'Low': return <ChevronDown size={14} strokeWidth={3} />;
      case 'Very Low': return <ChevronsDown size={14} strokeWidth={3} />;
      default: return <Minus size={14} />;
    }
  };

  const getFunctionIcon = (level: string) => {
    switch (level) {
        case 'Individual': return <User size={20} className="mb-1 opacity-60" />;
        case 'Team': return <Users size={20} className="mb-1 opacity-60" />;
        case 'Organizational': return <Building2 size={20} className="mb-1 opacity-60" />;
        case 'Social': return <Globe2 size={20} className="mb-1 opacity-60" />;
        default: return null;
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
        case 'Input': return <ArrowRightFromLine size={20} className="mb-2 opacity-60" />;
        case 'Process': return <RefreshCw size={20} className="mb-2 opacity-60" />;
        case 'Product': return <Box size={20} className="mb-2 opacity-60" />;
        case 'Output': return <LogOut size={20} className="mb-2 opacity-60" />;
        case 'Outcome': return <Target size={20} className="mb-2 opacity-60" />;
        case 'Impact': return <Zap size={20} className="mb-2 opacity-60" />;
        default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">ماتریس شایستگی: {activeJob.title}</h2>
            <div className="flex items-center gap-4">
                <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded hover:bg-slate-700 dark:hover:bg-slate-600 text-sm"><Download size={16} /> دانلود PDF</button>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Info size={16} /><span>تعداد: {jobCompetencies.length}</span></div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-x-8 gap-y-2 items-center transition-colors">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 border-l dark:border-slate-800 pl-4"><Filter size={16} className="text-blue-600" />فیلترها:</div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">نقش:</span>
                {ROLE_TYPES.map(role => (
                    <button key={role.id} onClick={() => setFilterRoles(p => p.includes(role.id) ? p.filter(x => x !== role.id) : [...p, role.id])} className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 transition-all ${filterRoles.includes(role.id) ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-slate-800 dark:text-slate-200 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                        {role.label.split('(')[0]}
                        {filterRoles.includes(role.id) && <Check size={12} />}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto border dark:border-slate-800 rounded-lg shadow-sm bg-white dark:bg-slate-950" ref={matrixRef}>
        <div className="min-w-[1000px] p-4 bg-white dark:bg-slate-950">
          <div className="grid grid-cols-5 border-b dark:border-slate-800 sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 shadow-sm transition-colors">
            <div className="p-3 font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center border-l dark:border-slate-800">اثرگذاری / کارکرد</div>
            {FUNCTION_LEVELS.map(func => (
              <div key={func.id} className={`p-3 text-center border-l dark:border-slate-800 last:border-l-0 ${func.color} dark:bg-slate-800/40 flex flex-col items-center justify-center`}>
                {getFunctionIcon(func.id)}
                <div className="font-bold text-sm dark:text-slate-200">{func.label}</div>
              </div>
            ))}
          </div>

          {IMPACT_LEVELS.map((impact) => (
            <div key={impact.id} className="grid grid-cols-5 border-b dark:border-slate-800 last:border-b-0">
              <div className={`p-3 font-semibold text-sm ${impact.color} dark:bg-slate-800/20 border-l dark:border-slate-800 flex flex-col justify-center items-center text-center`}>
                {getImpactIcon(impact.id)}
                <span className="font-bold dark:text-slate-200">{impact.label}</span>
              </div>

              {FUNCTION_LEVELS.map((func) => {
                const cellCompetencies = jobCompetencies.filter(c => {
                  const mapping = relevantMappings.find(m => m.competencyId === c.id);
                  return c.impactLevel === impact.id && c.functionLevel === func.id && mapping && filterRoles.includes(mapping.roleType) && filterImportance.includes(mapping.importance);
                });

                return (
                  <div key={`${impact.id}-${func.id}`} className="p-2 border-l dark:border-slate-800 last:border-l-0 min-h-[120px] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex flex-wrap gap-2">
                      {cellCompetencies.map(comp => {
                        const mapping = relevantMappings.find(m => m.competencyId === comp.id);
                        const colorClass = mapping ? getCompetencyColorClass(mapping.roleType, mapping.importance) : 'bg-gray-100';
                        return (
                          <div key={comp.id} className="group/item relative w-full">
                            <div className={`p-2 rounded border shadow-sm text-sm cursor-pointer transition-all ${colorClass} flex flex-col justify-between min-h-[60px] dark:opacity-90`}>
                              <div className="font-bold mb-1 leading-snug flex gap-1"><span>{comp.icon}</span>{comp.title}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};