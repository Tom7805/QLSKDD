import type { CheckInParticipant } from '../checkinTypes';

interface CheckInTableProps {
  participants: CheckInParticipant[];
  pendingIds: Set<number>;
  onCheckIn: (participant: CheckInParticipant) => void;
}

const formatTime = (value?: string) => value
  ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : null;

const statusBadge = (participant: CheckInParticipant) => participant.checkedIn ? (
  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Đã đến{formatTime(participant.checkedInAt) ? ` · ${formatTime(participant.checkedInAt)}` : ''}</span>
) : (
  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Chưa đến</span>
);

export default function CheckInTable({ participants, pendingIds, onCheckIn }: CheckInTableProps) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {participants.map((participant) => (
          <article key={participant.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-900">{participant.fullName}</h2>
                <p className="mt-1 truncate text-sm text-slate-600">{participant.email}</p>
              </div>
              {statusBadge(participant)}
            </div>
            {!participant.checkedIn && (
              <button type="button" disabled={pendingIds.has(participant.id)} onClick={() => onCheckIn(participant)} className="mt-4 min-h-12 w-full rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                {pendingIds.has(participant.id) ? 'Đang điểm danh…' : 'Điểm danh'}
              </button>
            )}
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700"><tr><th className="px-5 py-3">Họ tên</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-200">
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td className="px-5 py-4 font-medium text-slate-900">{participant.fullName}</td><td className="px-5 py-4 text-slate-600">{participant.email}</td><td className="px-5 py-4">{statusBadge(participant)}</td>
                <td className="px-5 py-4 text-right">{!participant.checkedIn && <button type="button" disabled={pendingIds.has(participant.id)} onClick={() => onCheckIn(participant)} className="min-h-12 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{pendingIds.has(participant.id) ? 'Đang xử lý…' : 'Điểm danh'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
