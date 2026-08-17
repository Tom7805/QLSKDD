import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SearchInput from '../../../components/common/SearchInput';
import { useToast } from '../../../components/common/Toast';
import { getEventRegistrations } from '../../registrations/registrationsApi';
import { checkInByCode, checkInParticipant } from '../checkinApi';
import type { CheckInErrorResponse, CheckInParticipant } from '../checkinTypes';
import CheckInTable from '../components/CheckInTable';
import QrScanner from '../components/QrScanner';

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
  const [ticketCode, setTicketCode] = useState('');
  const [codePending, setCodePending] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(true);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);

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

  const playSuccessSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.16);
    } catch { /* Trình duyệt có thể chặn âm thanh tự động. */ }
  };

  const submitCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || codePending) return;
    setCodePending(true);
    try {
      const result = await checkInByCode({ code, eventId: numericEventId });
      if (participants.some((item) => item.id === result.registrationId)) {
        setParticipants((current) => current.map((item) =>
          item.id === result.registrationId ? { ...item, checkedIn: true, checkedInAt: result.checkedInAt } : item,
        ));
      } else {
        // Không khớp được registrationId (VD: backend đang chạy bản cũ chưa có field này) ->
        // tải lại toàn bộ danh sách để dòng không bị kẹt ở trạng thái "Chưa đến" sai sự thật.
        setReloadKey((key) => key + 1);
      }
      playSuccessSound();
      showToast(`✓ Điểm danh thành công — ${result.participantName}`, 'success');
    } catch (requestError: unknown) {
      const payload = axios.isAxiosError<CheckInErrorResponse>(requestError) ? requestError.response?.data : undefined;
      showToast(payload?.message ?? 'Mã vé không hợp lệ hoặc không thuộc sự kiện này.', payload?.errorCode === 'ALREADY_CHECKED_IN' ? 'warning' : 'error');
    } finally {
      setTicketCode('');
      setCodePending(false);
    }
  };

  return (
    <div className="min-h-full bg-workspace p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigate(`/events/${numericEventId}/registrations`)} className="mb-4 text-sm font-semibold text-ink">← Danh sách đăng ký</button>
        <header className="mb-5"><p className="text-sm font-semibold text-ink">Điểm danh sự kiện</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Danh sách người tham gia</h1><p className="mt-2 text-sm text-slate-500">{participants.filter((item) => item.checkedIn).length}/{participants.length} người đã đến</p></header>
        <section className="mb-6 overflow-hidden rounded-3xl bg-white shadow-float">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 px-5 py-5 text-white sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Check-in nhanh</p><h2 className="mt-1 text-xl font-extrabold">Quét QR hoặc nhập mã vé</h2><p className="mt-1 text-sm text-blue-100">Sẵn sàng cho người tiếp theo ngay sau mỗi lần điểm danh.</p></div>
              <button type="button" onClick={() => { setCameraOpen((open) => !open); setCameraMessage(null); }} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold backdrop-blur transition hover:bg-white/20">{cameraOpen ? 'Ẩn camera' : 'Mở camera'}</button>
            </div>
          </div>
          <div className={`grid gap-5 p-4 sm:p-6 ${cameraOpen ? 'lg:grid-cols-[minmax(18rem,0.85fr)_minmax(20rem,1.15fr)]' : ''}`}>
            {cameraOpen && <QrScanner onScan={submitCode} disabled={codePending} onUnavailable={(message) => { setCameraMessage(message); setCameraOpen(false); }} />}
            <div className="flex flex-col justify-center">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-xl text-ink" aria-hidden="true">⌨</div>
              <h3 className="text-lg font-extrabold text-slate-900">Nhập mã thủ công</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">Dùng khi vé giấy khó quét hoặc người tham gia chỉ có mã chữ.</p>
              {cameraMessage && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{cameraMessage}</p>}
              <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void submitCode(ticketCode); }}>
                <label className="sr-only" htmlFor="ticket-code">Mã đăng ký</label>
                <input id="ticket-code" autoComplete="off" autoCapitalize="characters" value={ticketCode} onChange={(event) => setTicketCode(event.target.value.toUpperCase())} placeholder="VD: A1B2C3D4" disabled={codePending} className="min-h-14 min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 font-mono text-lg font-bold uppercase tracking-widest text-slate-900 outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-medium placeholder:normal-case placeholder:tracking-normal focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-ink/10 disabled:opacity-60" />
                <button type="submit" aria-label="Điểm danh bằng mã" disabled={!ticketCode.trim() || codePending} className="min-h-14 rounded-xl bg-ink px-6 font-bold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-ink-soft disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none">{codePending ? 'Đang xử lý…' : 'Điểm danh'}</button>
              </form>
              <p className="mt-2 text-xs text-slate-400">Nhấn Enter để gửi · Ô nhập tự xoá sau mỗi lần xử lý</p>
            </div>
          </div>
        </section>
        <div className="sticky top-0 z-10 -mx-4 mb-5 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border"><SearchInput value={query} onChange={setQuery} placeholder="Tìm nhanh theo họ tên" /></div>
        {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-ink">Thử lại</button></div>
          : loading ? <div aria-label="Đang tải danh sách điểm danh" className="space-y-3">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}</div>
          : visibleParticipants.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">{query ? 'Không tìm thấy người tham gia phù hợp.' : 'Chưa có đăng ký đang hoạt động.'}</div>
          : <CheckInTable participants={visibleParticipants} pendingIds={pendingIds} onCheckIn={handleCheckIn} />}
      </div>
    </div>
  );
}
