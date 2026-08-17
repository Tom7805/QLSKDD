import { useEffect, useState } from 'react';
import { getEvents } from '../../events/eventsApi';
import type { EventSummary } from '../../events/eventsTypes';
import SearchInput from '../../../components/common/SearchInput';

export interface ParticipantFilterValue {
  keyword: string;
  eventId: number | '';
}

interface ParticipantFilterProps {
  value: ParticipantFilterValue;
  onChange: (value: ParticipantFilterValue) => void;
  onClear: () => void;
  activeCount: number;
}

const fieldClassName = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-ink/30 focus:ring-4 focus:ring-ink/10';

function FilterFields({ value, onChange, events }: Pick<ParticipantFilterProps, 'value' | 'onChange'> & { events: EventSummary[] }) {
  const update = (field: keyof ParticipantFilterValue, nextValue: string | number) => onChange({ ...value, [field]: nextValue });

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Từ khóa</span>
        <SearchInput value={String(value.keyword)} onChange={(keyword: string) => update('keyword', keyword)} placeholder="Tìm theo họ tên hoặc email..." />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sự kiện</span>
        <select
          className={fieldClassName}
          value={value.eventId}
          onChange={(event) => update('eventId', event.target.value ? Number(event.target.value) : '')}
        >
          <option value="">Tất cả sự kiện</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default function ParticipantFilter({ value, onChange, onClear, activeCount }: ParticipantFilterProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);

  useEffect(() => {
    getEvents(0, 100).then((data) => setEvents(data.content)).catch(() => setEvents([]));
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <FilterFields value={value} onChange={onChange} events={events} />
      <button
        type="button"
        onClick={onClear}
        disabled={activeCount === 0}
        className="h-11 shrink-0 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
