import { useEffect, useState } from 'react';
import { getCategories } from '../../categories/categoriesApi';
import type { Category } from '../../categories/categoriesTypes';

export interface EventFilterValue {
  categoryId: string;
  status: string;
  from: string;
  to: string;
}

interface EventFilterProps {
  value: EventFilterValue;
  onChange: (value: EventFilterValue) => void;
  onClear: () => void;
  activeCount: number;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
];

const fieldClassName = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

function FilterFields({ value, onChange, categories }: Pick<EventFilterProps, 'value' | 'onChange'> & { categories: Category[] }) {
  const update = (field: keyof EventFilterValue, nextValue: string) => onChange({ ...value, [field]: nextValue });

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Loại sự kiện</span>
        <select className={fieldClassName} value={value.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
          <option value="">Tất cả loại</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Từ ngày</span>
        <input className={fieldClassName} type="date" value={value.from} max={value.to || undefined} onChange={(event) => update('from', event.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Đến ngày</span>
        <input className={fieldClassName} type="date" value={value.to} min={value.from || undefined} onChange={(event) => update('to', event.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</span>
        <select className={fieldClassName} value={value.status} onChange={(event) => update('status', event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
  );
}

export default function EventFilter({ value, onChange, onClear, activeCount }: EventFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => { if (!mobileOpen) setDraft(value); }, [mobileOpen, value]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);

  return (
    <>
      <div className="hidden items-end gap-3 lg:flex">
        <FilterFields value={value} onChange={onChange} categories={categories} />
        <button type="button" onClick={onClear} disabled={activeCount === 0} className="mb-0 inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
          Xóa bộ lọc
        </button>
      </div>

      <button type="button" onClick={() => setMobileOpen(true)} className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 lg:hidden" aria-expanded={mobileOpen}>
        <span className="inline-flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10m-7 6h4" /></svg>
          Bộ lọc
        </span>
        {activeCount > 0 && <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{activeCount}</span>}
      </button>

      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <button type="button" aria-label="Đóng bộ lọc" onClick={() => setMobileOpen(false)} className={`absolute inset-0 bg-slate-950/35 backdrop-blur-[2px] transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside role="dialog" aria-modal="true" aria-label="Bộ lọc sự kiện" className={`absolute inset-y-0 right-0 flex w-[min(90vw,24rem)] flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <div><h2 className="text-lg font-bold text-slate-900">Bộ lọc sự kiện</h2><p className="mt-0.5 text-xs text-slate-500">Thu hẹp danh sách theo nhu cầu</p></div>
            <button type="button" aria-label="Đóng bộ lọc" onClick={() => setMobileOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5"><FilterFields value={draft} onChange={setDraft} categories={categories} /></div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4">
            <button type="button" onClick={() => { setDraft({ categoryId: '', status: '', from: '', to: '' }); onClear(); setMobileOpen(false); }} className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Xóa bộ lọc</button>
            <button type="button" onClick={() => { onChange(draft); setMobileOpen(false); }} className="h-11 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Áp dụng</button>
          </div>
        </aside>
      </div>
    </>
  );
}
