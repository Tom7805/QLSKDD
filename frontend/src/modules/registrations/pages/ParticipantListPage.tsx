import { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Pagination from '../../../components/common/Pagination';
import SearchInput from '../../../components/common/SearchInput';
import { useToast } from '../../../components/common/Toast';
import { useDebounce } from '../../../hooks/useDebounce';
import ParticipantFormModal from '../components/ParticipantFormModal';
import { deleteParticipant, getParticipants } from '../registrationsApi';
import type { Participant, ParticipantPage } from '../registrationsTypes';

const SIZE = 10;
const EMPTY: ParticipantPage = { content: [], page: 0, size: SIZE, totalElements: 0, totalPages: 0, last: true };
const apiMessage = (error: unknown, fallback: string) => axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? fallback : fallback;

export default function ParticipantListPage() {
  const { showToast } = useToast();
  const [keyword, setKeyword] = useState(''); const search = useDebounce(keyword.trim(), 400);
  const [page, setPage] = useState(0); const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Participant | null>(null); const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null); const [deleting, setDeleting] = useState(false); const [reload, setReload] = useState(0);
  useEffect(() => setPage(0), [search]);
  useEffect(() => { let active = true; setLoading(true); setError(null); getParticipants({ keyword: search || undefined, page, size: SIZE }).then((data) => active && setResult(data)).catch((err) => active && setError(apiMessage(err, 'Không thể tải danh sách người tham gia.'))).finally(() => active && setLoading(false)); return () => { active = false; }; }, [search, page, reload]);
  const remove = async () => { if (!deleteTarget || deleting) return; setDeleting(true); try { await deleteParticipant(deleteTarget.id); showToast('Đã xoá người tham gia', 'success'); setDeleteTarget(null); setReload((x) => x + 1); } catch (err) { showToast(apiMessage(err, 'Không thể xoá người tham gia.'), 'error'); } finally { setDeleting(false); } };
  const actions = (item: Participant) => <div className="flex gap-2"><button type="button" onClick={() => { setEditing(item); setFormOpen(true); }} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700">Sửa</button><button type="button" onClick={() => setDeleteTarget(item)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Xoá</button></div>;
  return <div className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl"><header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-blue-600">Đăng ký sự kiện</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Quản lý người tham gia</h1><p className="mt-1 text-sm text-slate-500">Cập nhật thông tin và theo dõi số sự kiện đã đăng ký.</p></div><button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">＋ Thêm người tham gia</button></header>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><SearchInput value={keyword} onChange={setKeyword} placeholder="Tìm theo họ tên hoặc email..."/><span className="text-sm text-slate-500">{result.totalElements} người tham gia</span></div>
      {error ? <div className="p-10 text-center"><p role="alert" className="text-red-600">{error}</p><button type="button" onClick={() => setReload((x) => x + 1)} className="mt-3 font-semibold text-blue-600">Thử lại</button></div> : loading ? <div role="status" className="flex min-h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"/><span className="sr-only">Đang tải</span></div> : !result.content.length ? <div className="p-12 text-center text-slate-600">Không tìm thấy người tham gia.</div> : <><div className="hidden overflow-x-auto md:block"><table className="min-w-full divide-y"><thead className="bg-slate-50"><tr>{['Họ tên','Email','SĐT','Số sự kiện đã đăng ký','Thao tác'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y">{result.content.map((item) => <tr key={item.id}><td className="px-4 py-4 font-semibold text-slate-900">{item.fullName}</td><td className="px-4 py-4 text-sm text-slate-600">{item.email}</td><td className="px-4 py-4 text-sm text-slate-600">{item.phone || '—'}</td><td className="px-4 py-4 text-sm text-slate-600">{item.registeredEventCount}</td><td className="px-4 py-4">{actions(item)}</td></tr>)}</tbody></table></div><div className="divide-y md:hidden">{result.content.map((item) => <article key={item.id} className="p-4"><h2 className="font-semibold text-slate-900">{item.fullName}</h2><p className="mt-1 break-all text-sm text-slate-600">{item.email}</p><dl className="my-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-400">Số điện thoại</dt><dd>{item.phone || '—'}</dd></div><div><dt className="text-xs text-slate-400">Sự kiện đã đăng ký</dt><dd>{item.registeredEventCount}</dd></div></dl>{actions(item)}</article>)}</div></>}
      {!loading && !error && result.totalPages > 1 && <div className="border-t p-4"><Pagination page={page} totalPages={result.totalPages} onPageChange={setPage}/></div>}</section></div>
    <ParticipantFormModal open={formOpen} participant={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); showToast(editing ? 'Đã cập nhật người tham gia' : 'Đã thêm người tham gia', 'success'); setReload((x) => x + 1); }} onError={(message) => showToast(message, 'error')}/>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Xác nhận xoá người tham gia" message={<>Bạn có chắc muốn xoá <strong>{deleteTarget?.fullName}</strong>?</>} confirmLabel="Xoá" loading={deleting} onConfirm={remove} onCancel={() => !deleting && setDeleteTarget(null)}/></div>;
}
