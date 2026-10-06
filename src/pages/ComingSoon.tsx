import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description: string;
  features: string[];
}

/**
 * Backend API hali tayyor bo'lmagan modullar uchun placeholder.
 * Mock ma'lumotlarni ko'rsatmaslik uchun ishlatiladi.
 */
export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description, features }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 font-medium">{description}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-5">
          <Construction className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          Modul ishlab chiqilmoqda
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mb-6">
          Bu bo'lim uchun backend API hali tayyor emas. Quyidagi funksiyalar keyingi
          bosqichda qo'shiladi:
        </p>
        <ul className="text-left space-y-2 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {f}
            </li>
          ))}
        </ul>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
};
