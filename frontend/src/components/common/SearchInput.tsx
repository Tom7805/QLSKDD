import { useState } from 'react';
import { SearchIcon } from './Icons';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 'sm' = cao 40px, khớp hàng với các nút/viên thuốc cùng thanh công cụ */
  size?: 'sm' | 'md';
}

/**
 * Ô tìm kiếm bo tròn hết cỡ (viên thuốc). Vi tương tác: khi focus thì viền đậm lên, nền
 * chuyển từ xám sang trắng và icon kính lúp đổi sang màu mực — báo rõ ô đang nhận gõ mà
 * không cần thêm nhãn hay đường viền dày.
 */
export default function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...', size = 'md' }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const height = size === 'sm' ? 'h-10' : 'h-11';

  return (
    <div className="relative w-full sm:max-w-sm">
      <SearchIcon
        className={`pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 transition-colors duration-200 ${
          focused ? 'text-ink' : 'text-slate-400'
        }`}
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={[
          height,
          'w-full rounded-full border pl-11 pr-11 text-sm text-ink outline-none',
          'transition-all duration-200 placeholder:text-slate-400',
          'focus:ring-4 focus:ring-ink/[0.07]',
          focused ? 'border-ink/25 bg-white' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300',
        ].join(' ')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa nội dung tìm kiếm"
          title="Xóa tìm kiếm"
          className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-ink active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
