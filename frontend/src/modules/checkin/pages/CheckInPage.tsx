import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SearchInput from '../../../components/common/SearchInput';
import { useToast } from '../../../components/common/Toast';
import { getEventRegistrations } from '../../registrations/registrationsApi';
import { checkInParticipant } from '../checkinApi';
import type { CheckInErrorResponse, CheckInParticipant } from '../checkinTypes';
import CheckInTable from '../components/CheckInTable';

const FETCH_SIZE = 1000;

export default function CheckInPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const numericEventId = Number(eventId);
  const [participants, setParticipants] = useState<CheckInParticipant[]>([]);
  const [query, setQuery] = useState('');
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!Number.isInteger(numericEventId) || numericEventId <= 0) { setError('Không tìm thấy sự kiện.'); setLoading(false); return; }
    let active = true;
    setLoading(true); setError(null);
    getEventRegistrations(numericEventId, 0, FETCH_SIZE)
      .then((data) => active && setParticipants(data.registrations.content.filter((item) => item.status === 'ACTIVE')))
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message : undefined;
        setError(message ?? 'Không thể tải danh sách điểm danh.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [numericEventId, reloadKey]);

  const visibleParticipants = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return normalized ? participants.filter((item) => item.fullName.toLocaleLowerCase('vi-VN').includes(normalized)) : participants;
  }, [participants, query]);

  const handleCheckIn = async (participant: CheckInParticipant) => {
    if (pendingIds.has(participant.id)) return;
    setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, checkedIn: true } : item));
    setPendingIds((current) => new Set(current).add(participant.id));
    try {
      const result = await checkInParticipant({ registrationId: participant.id, eventId: numericEventId });
      setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, checkedInAt: result.checkedInAt } : item));
      showToast(`✓ Điểm danh thành công — ${result.participantName || participant.fullName}`, 'success');
    } catch (requestError: unknown) {
      setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, checkedIn: false } : item));
      const payload = axios.isAxiosError<CheckInErrorResponse>(requestError) ? requestError.response?.data : undefined;
      if (payload?.errorCode === 'ALREADY_CHECKED_IN') {
        setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, checkedIn: true } : item));
        showToast(payload.message ?? 'Người này đã điểm danh.', 'warning');
      } else {
        showToast(payload?.message ?? 'Điểm danh thất bại. Vui lòng thử lại.', 'error');
      }
    } finally {
      setPendingIds((current) => { const next = new Set(current); next.delete(participant.id); return next; });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigate(`/events/${numericEventId}/registrations`)} className="mb-4 text-sm font-semibold text-blue-700">← Danh sách đăng ký</button>
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-blue-600">Điểm danh sự kiện</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Danh sách người tham gia</h1><p className="mt-2 text-sm text-slate-500">{participants.filter((item) => item.checkedIn).length}/{participants.length} người đã đến</p></div><button type="button" onClick={() => navigate(`/events/${numericEventId}/attendance`)} className="min-h-12 rounded-xl border border-blue-200 bg-white px-5 font-semibold text-blue-700 hover:bg-blue-50">Xem tổng hợp có mặt / vắng</button></header>
        <div className="sticky top-0 z-10 -mx-4 mb-5 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border"><SearchInput value={query} onChange={setQuery} placeholder="Tìm nhanh theo họ tên" /></div>
        {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-blue-700">Thử lại</button></div>
          : loading ? <div aria-label="Đang tải danh sách điểm danh" className="space-y-3">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}</div>
          : visibleParticipants.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{query ? 'Không tìm thấy người tham gia phù hợp.' : 'Chưa có đăng ký đang hoạt động.'}</div>
          : <CheckInTable participants={visibleParticipants} pendingIds={pendingIds} onCheckIn={handleCheckIn} />}
      </div>
    </div>
  );
}
