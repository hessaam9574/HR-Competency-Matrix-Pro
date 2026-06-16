import React, { useRef, useState } from 'react';
import { Job, Competency, KPIMapping } from '../types';
import { ROLE_TYPES, IMPACT_LEVELS, FUNCTION_LEVELS, IMPORTANCE_LEVELS } from '../constants';
import { FileText, BrainCircuit, Zap, CheckCircle2, TrendingUp, Download, BarChart3, Loader2, User, Users, Building2, Globe2, ArrowRightFromLine, RefreshCw, Box, LogOut, Target, ShieldCheck, Rocket, Siren, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import jsPDF from 'jspdf';

interface Props {
  jobs: Job[];
  competencies: Competency[];
  mappings: KPIMapping[];
}

export const ReportTable: React.FC<Props> = ({ jobs, competencies, mappings }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'Critical': return <Siren size={14} />;
      case 'Enabler': return <ShieldCheck size={14} />;
      case 'Enhancer': return <Rocket size={14} />;
      default: return null;
    }
  };

  const getImportanceIcon = (level: string) => {
    switch (level) {
      case 'Very High': return <ChevronsUp size={14} />;
      case 'High': return <ChevronUp size={14} />;
      case 'Low': return <ChevronDown size={14} />;
      case 'Very Low': return <ChevronsDown size={14} />;
      default: return <BarChart3 size={14} />;
    }
  };

  const handleDownloadPdf = async () => {
    if (!tableRef.current) return;
    setIsGeneratingPdf(true);
    try {
        const element = tableRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeightInPdf = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightInPdf);
        pdf.save(`HR-Competency-Report.pdf`);
    } catch (error) { alert("خطا در ایجاد PDF"); } finally { setIsGeneratingPdf(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <FileText className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">جدول گزارش تحلیلی شایستگی‌ها</h2>
        </div>
        <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded hover:bg-slate-700 dark:hover:bg-slate-600 text-sm transition-all shadow-md">
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isGeneratingPdf ? 'در حال ایجاد PDF...' : 'دانلود گزارش'}
        </button>
      </div>

      <div className="flex-1 overflow-auto border dark:border-slate-800 rounded-lg shadow-sm bg-white dark:bg-slate-900">
        <div className="p-4 bg-white dark:bg-slate-950 min-w-[800px]" ref={tableRef}>
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border border-slate-200 dark:border-slate-700 w-1/6 font-bold text-slate-700 dark:text-slate-200">شغل</th>
              <th className="p-4 border border-slate-200 dark:border-slate-700 w-1/4 font-bold text-slate-700 dark:text-slate-200">شرح شغل</th>
              <th className="p-4 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">شایستگی‌های مرتبط و استدلال</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <React.Fragment key={job.id}>
                {job.kpis.map((kpi, index) => {
                    const kpiMappings = mappings.filter(m => m.kpiId === kpi.id);
                    return (
                      <tr key={kpi.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {index === 0 && (
                          <td className="p-4 border border-slate-200 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900 align-top text-slate-800 dark:text-slate-200" rowSpan={job.kpis.length}>
                            <div className="flex items-center gap-2"><span>{job.icon}</span>{job.title}</div>
                          </td>
                        )}
                        <td className="p-4 border border-slate-200 dark:border-slate-700 align-top dark:text-slate-300">
                          <div className="font-semibold flex gap-2"><span>{kpi.icon}</span>{kpi.title}</div>
                        </td>
                        <td className="p-4 border border-slate-200 dark:border-slate-700 align-top">
                          <div className="space-y-4">
                              {kpiMappings.map(map => {
                                const comp = competencies.find(c => c.id === map.competencyId);
                                if (!comp) return null;
                                return (
                                  <div key={map.id} className="border dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2"><span>{comp.icon}</span>{comp.title}</span>
                                    </div>
                                    <div className="mt-3 border dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 p-3 text-sm dark:text-slate-400">
                                        <div className="flex items-center gap-2 mb-1 text-violet-600 dark:text-violet-400 font-bold"><BrainCircuit size={14} /> استدلال اتصال:</div>
                                        {map.reasoning}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};