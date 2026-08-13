import { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useToast } from '../../../components/common/Toast';
import { deleteCategory, getCategories } from '../categoriesApi';
import CategoryFormModal from '../components/CategoryFormModal';
import type { Category } from '../categoriesTypes';

const EMPTY_CATEGORIES: Category[] = [];

export default function CategoryListPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>(EMPTY_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getCategories()
      .then((data) => {
        if (!active) return;
        setCategories(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message
          : undefined;
        setError(message ?? 'Không thể tải danh sách loại sự kiện. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const openCreateForm = () => {
    setFormMode('create');
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setFormMode('edit');
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleSaved = (category: Category) => {
    setIsFormOpen(false);
    showToast(formMode === 'create' ? `Đã tạo loại sự kiện ${category.name}` : `Đã cập nhật loại sự kiện ${category.name}`, 'success');
    setReloadKey((key) => key + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      showToast(`Đã xoá loại sự kiện ${deleteTarget.name}`, 'success');
      setDeleteTarget(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      showToast(message ?? 'Không thể xoá loại sự kiện.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Quản trị sự kiện</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Quản lý loại sự kiện</h1>
            <p className="mt-1 text-sm text-slate-500">Thêm, sửa hoặc xoá loại sự kiện. Loại đang có sự kiện không thể xoá.</p>
          </div>
          <button type="button" onClick={openCreateForm} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <span className="text-xl leading-none" aria-hidden="true">＋</span> Thêm loại mới
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <p className="text-sm text-slate-500">Có {categories.length} loại sự kiện.</p>
          </div>

          {error ? (
            <div className="p-10 text-center">
              <p role="alert" className="text-sm font-medium text-red-600">{error}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 text-sm font-semibold text-blue-600">Thử lại</button>
            </div>
          ) : loading ? (
            <div className="flex min-h-[20rem] items-center justify-center" role="status">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <span className="sr-only">Đang tải loại sự kiện</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-700">Chưa có loại sự kiện nào.</p>
              <p className="mt-1 text-sm text-slate-500">Nhấn Thêm loại mới để bắt đầu.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full table-fixed divide-y divide-slate-200">
                  <colgroup>
                    <col className="w-[8%]" />
                    <col className="w-[20%]" />
                    <col className="w-[32%]" />
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                  </colgroup>
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">STT</th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tên loại</th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mô tả</th>
                      <th className="whitespace-nowrap px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Số sự kiện</th>
                      <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {categories.map((category, index) => (
                      <tr key={category.id} className="hover:bg-slate-50/80">
                        <td className="truncate px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                        <td className="truncate px-6 py-4 text-sm font-semibold text-slate-900">{category.name}</td>
                        <td className="truncate px-6 py-4 text-sm text-slate-600">{category.description || '—'}</td>
                        <td className="truncate px-6 py-4 text-center text-sm text-slate-700">{category.eventCount}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          <button type="button" onClick={() => openEditForm(category)} className="font-semibold text-blue-600 hover:text-blue-800">Sửa</button>
                          <span className="mx-2 text-slate-300">|</span>
                          <button type="button" onClick={() => setDeleteTarget(category)} className="font-semibold text-red-600 hover:text-red-800">Xoá</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-200 md:hidden">
                {categories.map((category, index) => (
                  <article key={category.id} className="border-b border-slate-200 px-4 py-4 last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">#{index + 1}</p>
                        <h2 className="mt-1 truncate text-base font-semibold text-slate-900">{category.name}</h2>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{category.eventCount} sự kiện</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEditForm(category)} className="min-w-[120px] rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Sửa</button>
                      <button type="button" onClick={() => setDeleteTarget(category)} className="min-w-[120px] rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Xoá</button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <CategoryFormModal
        open={isFormOpen}
        mode={formMode}
        category={selectedCategory}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        onError={(message) => showToast(message, 'error')}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xoá loại sự kiện"
        message={deleteTarget ? <span>Bạn có chắc muốn xoá loại sự kiện <strong className="text-slate-900">{deleteTarget.name}</strong>?</span> : null}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
