interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index).filter(
    (item) => item === 0 || item === totalPages - 1 || Math.abs(item - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Phân trang">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Trước
      </button>
      {pages.map((item, index) => (
        <span key={item} className="flex items-center gap-1">
          {index > 0 && pages[index - 1] !== item - 1 && <span className="px-1 text-slate-400">…</span>}
          <button
            type="button"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium ${
              item === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item + 1}
          </button>
        </span>
      ))}
      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sau
      </button>
    </nav>
  );
}
