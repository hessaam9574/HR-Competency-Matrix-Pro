import { ImpactLevel, FunctionLevel, ImportanceLevel } from './types';

export const IMPACT_LEVELS: { id: ImpactLevel; label: string; description: string; color: string }[] = [
  { 
    id: 'Input', 
    label: 'درون‌داد (Input)', 
    description: 'توانمندی‌ها، ویژگی‌ها و منابعی که فرد با آن وارد کار می‌شود (سواد حرفه‌ای پایه، ابزار و مواد اولیه).', 
    color: 'bg-cyan-50 border-cyan-200 text-cyan-900' 
  },
  { 
    id: 'Process', 
    label: 'فرآیند (Process)', 
    description: 'نحوه انجام کار مطابق استانداردها، دستورالعمل‌ها و رویه‌های عملیاتی (SOP). تمرکز بر "درست انجام دادن کار" است.', 
    color: 'bg-cyan-100 border-cyan-300 text-cyan-950' 
  },
  { 
    id: 'Product', 
    label: 'محصول (Product)', 
    description: 'خروجی مستقیم، ملموس و قابل تحویلِ شغل (قبل از مصرف سازمانی). آنچه فرد تولید می‌کند.', 
    color: 'bg-sky-100 border-sky-300 text-sky-900' 
  },
  { 
    id: 'Output', 
    label: 'برون‌داد (Output)', 
    description: 'نتیجه استفاده سازمان از محصول شغلی. اثرگذاری بر زنجیره ارزش داخلی و دیگر واحدها.', 
    color: 'bg-sky-200 border-sky-400 text-sky-950' 
  },
  { 
    id: 'Outcome', 
    label: 'پیامد (Outcome)', 
    description: 'تغییر قابل مشاهده و پایدار در عملکرد، کیفیت، امنیت، رضایت و شاخص‌های کلیدی.', 
    color: 'bg-blue-100 border-blue-300 text-blue-900' 
  },
  { 
    id: 'Impact', 
    label: 'تأثیر (Impact)', 
    description: 'اثر پایدار، راهبردی یا اجتماعی فراتر از واحد اجرا (سودآوری، شهرت برند، مسئولیت اجتماعی).', 
    color: 'bg-blue-200 border-blue-400 text-blue-950' 
  },
];

export const FUNCTION_LEVELS: { id: FunctionLevel; label: string; width: string; description: string; color: string }[] = [
  { 
    id: 'Individual', 
    label: 'فردی (Individual)', 
    width: 'w-1/4',
    description: 'تمرکز بر خود فرد و عملکرد مستقل او (مدیریت خود، رشد شخصی، تفکر و انجام مستقل کارها).',
    color: 'bg-amber-50 border-amber-200 text-amber-900'
  },
  { 
    id: 'Team', 
    label: 'گروهی (Team)', 
    width: 'w-1/4',
    description: 'تمرکز بر تعاملات و همکاری‌های درون یک تیم (کار مؤثر با دیگران به عنوان بخشی از یک گروه).',
    color: 'bg-amber-100 border-amber-300 text-amber-950'
  },
  { 
    id: 'Organizational', 
    label: 'سازمانی (Organizational)', 
    width: 'w-1/4',
    description: 'تمرکز بر هماهنگی، مدیریت و تأثیرگذاری در درون ساختار سازمان (درک ساختارها، فرآیندها و فرهنگ).',
    color: 'bg-orange-100 border-orange-300 text-orange-900'
  },
  { 
    id: 'Social', 
    label: 'اجتماعی (Social)', 
    width: 'w-1/4',
    description: 'تمرکز بر تعامل با محیط بیرون از سازمان (ارتباط با ذینفعان خارجی، بازار، جامعه یا صنعت).',
    color: 'bg-orange-200 border-orange-400 text-orange-950'
  },
];

export const ROLE_TYPES = [
  { id: 'Enabler', label: 'توانمندساز (Enabler)', description: 'امکان تحقق KPI را فراهم می‌کند', baseColor: 'green' },
  { id: 'Enhancer', label: 'بهبوددهنده (Enhancer)', description: 'کیفیت تحقق KPI را افزایش می‌دهد', baseColor: 'orange' },
  { id: 'Critical', label: 'حیاتی (Critical)', description: 'بدون این شایستگی KPI محقق نمی‌شود', baseColor: 'red' },
];

export const IMPORTANCE_LEVELS: { id: ImportanceLevel; label: string; value: number }[] = [
  { id: 'Very High', label: 'خیلی زیاد', value: 4 },
  { id: 'High', label: 'زیاد', value: 3 },
  { id: 'Low', label: 'کم', value: 2 },
  { id: 'Very Low', label: 'خیلی کم', value: 1 },
];

// Helper to get color class based on Role and Importance
export const getCompetencyColorClass = (roleType: string, importance: ImportanceLevel) => {
  const role = ROLE_TYPES.find(r => r.id === roleType);
  if (!role) return 'bg-slate-100 text-slate-800 border-slate-300';

  const base = role.baseColor; // red, orange, green

  // Tailwind shade mapping: Very High -> 600 (Dark/White text), High -> 400 (Medium/White), Low -> 200 (Light/Dark), Very Low -> 50 (Very Light/Dark)
  switch (importance) {
    case 'Very High':
      return `bg-${base}-600 text-white border-${base}-700 shadow-md`;
    case 'High':
      return `bg-${base}-400 text-white border-${base}-500`;
    case 'Low':
      return `bg-${base}-200 text-${base}-900 border-${base}-300`;
    case 'Very Low':
      return `bg-${base}-50 text-${base}-800 border-${base}-200`;
    default:
      return `bg-${base}-100 text-${base}-800 border-${base}-200`;
  }
};