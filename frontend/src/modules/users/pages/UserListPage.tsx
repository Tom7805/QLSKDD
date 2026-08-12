import { useEffect, useState } from 'react';
import axios from 'axios';
import Pagination from '../../../components/common/Pagination';
import SearchInput from '../../../components/common/SearchInput';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useToast } from '../../../components/common/Toast';
import { useDebounce } from '../../../hooks/useDebounce';
import { getUsers, toggleStatus } from '../usersApi';
import type { PageResponse, User } from '../usersTypes';
import UserFormModal from '../components/UserFormModal';
import { ROLE_LABELS } from '../../../constants/roles';

const PAGE_SIZE = 10;
const EMPTY_PAGE: PageResponse<User> = {
  content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true,
};

export default function UserListPage() {
  const { showToast } = useToast();
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword.trim(), 400);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<PageResponse<User>>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => setPage(0), [debouncedKeyword]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getUsers({ keyword: debouncedKeyword || undefined, page, size: PAGE_SIZE })
      .then((data) => active && setResult(data))
      .catch((err: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message
          : undefined;
        setError(message ?? 'Không thể tải danh sách tài khoản. Vui lòng thử lại.');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [debouncedKeyword, page, reloadKey]);

  const openEditForm = (user: User) => {
    setFormMode('edit');
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!statusTarget || toggling) return;
    setToggling(true);
    try {
      const updated = await toggleStatus(statusTarget.id);
      showToast(`Đã ${updated.enabled ? 'mở khóa' : 'khóa'} tài khoản ${updated.username}`, 'success');
      setStatusTarget(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      showToast(message ?? 'Không thể cập nhật trạng thái tài khoản', 'error');
    } finally {
      setToggling(false);
    }
  };

  const roleLabel = (role: string) => ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role.replace('ROLE_', '');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Danh sách tài khoản</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý thông tin và trạng thái người dùng trong hệ thống.</p>
          </div>
          <button type="button" onClick={() => { setFormMode('create'); setSelectedUser(null); setIsFormOpen(true); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <span className="text-xl leading-none">＋</span> Thêm mới
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={keyword} onChange={setKeyword} placeholder="Tìm theo tên đăng nhập, họ tên..." />
            <p className="text-sm text-slate-500">{result.totalElements} tài khoản</p>
          </div>

          {error ? (
            <div className="p-10 text-center">
              <p role="alert" className="text-sm font-medium text-red-600">{error}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 text-sm font-semibold text-blue-600">Thử lại</button>
            </div>
          ) : loading ? (
            <div className="flex min-h-64 items-center justify-center" role="status">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <span className="sr-only">Đang tải danh sách tài khoản</span>
            </div>
          ) : result.content.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-700">Không tìm thấy tài khoản</p>
              <p className="mt-1 text-sm text-slate-500">Hãy thử từ khóa khác hoặc thêm tài khoản mới.</p>
            </div>
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full table-fixed divide-y divide-slate-200">
                <colgroup>
                  <col className="w-[6%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[26%]" />
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>{['STT', 'Tên đăng nhập', 'Họ tên', 'Email', 'Vai trò', 'Thao tác'].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {result.content.map((user, index) => (
                    <tr key={user.id} className="hover:bg-slate-50/80">
                      <td className="truncate px-4 py-4 text-sm text-slate-500">{page * PAGE_SIZE + index + 1}</td>
                      <td className="truncate px-4 py-4 text-sm font-semibold text-slate-900">{user.username}</td>
                      <td className="truncate px-4 py-4 text-sm text-slate-700">{user.fullName}</td>
                      <td className="truncate px-4 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="truncate px-4 py-4 text-sm text-slate-600">{roleLabel(user.role)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <button type="button" onClick={() => openEditForm(user)} className="font-semibold text-blue-600 hover:text-blue-800">Sửa</button>
                        <span className="mx-2 text-slate-300">|</span>
                        <button type="button" onClick={() => setStatusTarget(user)} className={`font-semibold ${user.enabled ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'}`}>{user.enabled ? 'Khóa' : 'Mở khóa'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-200 md:hidden">
              {result.content.map((user, index) => (
                <article key={user.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-400">#{page * PAGE_SIZE + index + 1}</p>
                      <h2 className="mt-1 truncate font-semibold text-slate-900">{user.fullName}</h2>
                      <p className="truncate text-sm text-slate-500">@{user.username}</p>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div><dt className="text-xs text-slate-400">Email</dt><dd className="mt-0.5 break-all text-slate-700">{user.email}</dd></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><dt className="text-xs text-slate-400">Vai trò</dt><dd className="mt-0.5 text-slate-700">{roleLabel(user.role)}</dd></div>
                      <div><dt className="text-xs text-slate-400">Số điện thoại</dt><dd className="mt-0.5 text-slate-700">{user.phone || '—'}</dd></div>
                    </div>
                  </dl>
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => openEditForm(user)} className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Sửa</button>
                    <button type="button" onClick={() => setStatusTarget(user)} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${user.enabled ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>{user.enabled ? 'Khóa' : 'Mở khóa'}</button>
                  </div>
                </article>
              ))}
            </div>
            </>
          )}

          {!loading && !error && result.totalPages > 1 && (
            <div className="border-t border-slate-200 p-4"><Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} /></div>
          )}
        </div>
      </div>
      <UserFormModal
        open={isFormOpen}
        mode={formMode}
        user={selectedUser}
        onClose={() => setIsFormOpen(false)}
        onSaved={(savedUser) => {
          setIsFormOpen(false);
          showToast(formMode === 'create' ? `Đã tạo tài khoản ${savedUser.username}` : `Đã cập nhật tài khoản ${savedUser.username}`, 'success');
          setReloadKey((key) => key + 1);
        }}
        onError={(message) => showToast(message, 'error')}
      />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.enabled ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
        message={statusTarget ? <span>Bạn có chắc muốn {statusTarget.enabled ? 'khóa' : 'mở khóa'} tài khoản <strong className="text-slate-900">{statusTarget.username}</strong>?</span> : null}
        confirmLabel={statusTarget?.enabled ? 'Khóa tài khoản' : 'Mở khóa'}
        onConfirm={handleToggleStatus}
        onCancel={() => !toggling && setStatusTarget(null)}
        loading={toggling}
      />
    </div>
  );
}
