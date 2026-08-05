import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../categories/categoriesApi';
import type { Category } from '../../categories/categoriesTypes';
import { useToast } from '../../../components/common/Toast';
import { createEvent, updateEvent } from '../eventsApi';
import type { EventCreateRequest, EventDetail } from '../eventsTypes';
import { ROUTES } from '../../../constants/routes';

interface FormState {
  name: string;
  description: string;
  location: string;
  capacity: string;
  startAt: string;
  endAt: string;
  categoryId: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  location: '',
  capacity: '1',
  startAt: '',
  endAt: '',
  categoryId: '',
};

function inputClass(field: keyof FormState, fieldErrors: FieldErrors) {
  return `mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    fieldErrors[field]
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
  }`;
}

interface EventFormProps {
  initialEvent?: EventDetail;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function EventForm({ initialEvent, onDirtyChange }: EventFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(() => initialEvent ? {
    name: initialEvent.name,
    description: initialEvent.description ?? '',
    location: initialEvent.location,
    capacity: String(initialEvent.capacity),
    startAt: initialEvent.startAt.slice(0, 16),
    endAt: initialEvent.endAt.slice(0, 16),
    categoryId: String(initialEvent.categoryId),
  } : EMPTY_FORM);
  const [dirty, setDirty] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let active = true;
    setLoadingCategories(true);
    setError(null);

    getCategories()
      .then((data) => {
        if (!active) return;
        setCategories(data);
        if (data.length > 0) {
          setForm((current) => ({ ...current, categoryId: current.categoryId || String(data[0].id) }));
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message
          : undefined;
        setError(message ?? 'Không thể tải danh sách loại sự kiện. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
    setDirty(true);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = form.name.trim();
    const location = form.location.trim();
    const capacity = Number(form.capacity);
    const startAt = form.startAt;
    const endAt = form.endAt;

    if (!name) {
      errors.name = 'Tên sự kiện là bắt buộc';
    } else if (name.length > 255) {
      errors.name = 'Tên sự kiện tối đa 255 ký tự';
    }

    if (!location) {
      errors.location = 'Địa điểm là bắt buộc';
    }

    if (!form.capacity) {
      errors.capacity = 'Sức chứa là bắt buộc';
    } else if (Number.isNaN(capacity) || capacity <= 0) {
      errors.capacity = 'Sức chứa phải lớn hơn 0';
    }

    if (!startAt) {
      errors.startAt = 'Thời gian bắt đầu là bắt buộc';
    }

    if (!endAt) {
      errors.endAt = 'Thời gian kết thúc là bắt buộc';
    }

    if (startAt && endAt) {
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      if (endDate <= startDate) {
        errors.endAt = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }

    if (!form.categoryId) {
      errors.categoryId = 'Loại sự kiện là bắt buộc';
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const request: EventCreateRequest = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      location: form.location.trim(),
      capacity: Number(form.capacity),
      startAt: form.startAt,
      endAt: form.endAt,
      categoryId: Number(form.categoryId),
    };

    setSaving(true);
    setError(null);

    try {
      const savedEvent = initialEvent
        ? await updateEvent(initialEvent.id, request)
        : await createEvent(request);
      setDirty(false);
      onDirtyChange?.(false);
      showToast(initialEvent ? 'Cập nhật sự kiện thành công' : 'Tạo sự kiện thành công', 'success');
      navigate(ROUTES.EVENT_DETAIL.replace(':id', String(savedEvent.id)), { state: savedEvent });
    } catch (err) {
      const response = axios.isAxiosError<ApiErrorResponse>(err) ? err.response : undefined;
      const message = response?.data?.message;
      const fallbackMessage = message ?? (initialEvent
        ? 'Không thể cập nhật sự kiện. Vui lòng thử lại.'
        : 'Không thể tạo sự kiện. Vui lòng thử lại.');

      if (response?.status === 400 && response.data?.errors?.length) {
        const backendErrors = response.data.errors.reduce<FieldErrors>((acc, item) => {
          acc[item.field as keyof FormState] = item.message;
          return acc;
        }, {});
        setFieldErrors((current) => ({ ...current, ...backendErrors }));
      } else if (response?.status === 409) {
        const conflictMessage = message ?? 'Sức chứa không thể nhỏ hơn số người đã đăng ký.';
        setError(conflictMessage);
        showToast(conflictMessage, 'error');
      } else {
        setError(fallbackMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: keyof FormState) =>
    fieldErrors[field] ? (
      <span id={`${field}-error`} className="mt-1.5 block text-xs font-medium text-red-600">
        {fieldErrors[field]}
      </span>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 sm:pb-0">
      {error && (
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Tên sự kiện <span className="text-red-500">*</span>
          <input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            placeholder="Nhập tên sự kiện"
            className={inputClass('name', fieldErrors)}
          />
          {fieldError('name')}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Loại sự kiện <span className="text-red-500">*</span>
          <select
            value={form.categoryId}
            onChange={(e) => updateField('categoryId', e.target.value)}
            aria-invalid={Boolean(fieldErrors.categoryId)}
            aria-describedby={fieldErrors.categoryId ? 'categoryId-error' : undefined}
            className={inputClass('categoryId', fieldErrors)}
            disabled={loadingCategories || categories.length === 0}
          >
            <option value="">Chọn loại sự kiện</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldError('categoryId')}
        </label>

        <label className="sm:col-span-2 block text-sm font-medium text-slate-700">
          Mô tả
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            placeholder="Mô tả ngắn về sự kiện"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Địa điểm <span className="text-red-500">*</span>
          <input
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            aria-invalid={Boolean(fieldErrors.location)}
            aria-describedby={fieldErrors.location ? 'location-error' : undefined}
            placeholder="Nhập địa điểm tổ chức"
            className={inputClass('location', fieldErrors)}
          />
          {fieldError('location')}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Sức chứa <span className="text-red-500">*</span>
          <input
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => updateField('capacity', e.target.value)}
            aria-invalid={Boolean(fieldErrors.capacity)}
            aria-describedby={fieldErrors.capacity ? 'capacity-error' : undefined}
            placeholder="Nhập số lượng tối đa"
            className={inputClass('capacity', fieldErrors)}
          />
          {fieldError('capacity')}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Thời gian bắt đầu <span className="text-red-500">*</span>
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => updateField('startAt', e.target.value)}
            aria-invalid={Boolean(fieldErrors.startAt)}
            aria-describedby={fieldErrors.startAt ? 'startAt-error' : undefined}
            className={inputClass('startAt', fieldErrors)}
          />
          {fieldError('startAt')}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Thời gian kết thúc <span className="text-red-500">*</span>
          <input
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => updateField('endAt', e.target.value)}
            aria-invalid={Boolean(fieldErrors.endAt)}
            aria-describedby={fieldErrors.endAt ? 'endAt-error' : undefined}
            className={inputClass('endAt', fieldErrors)}
          />
          {fieldError('endAt')}
        </label>
      </div>

      <div className="hidden justify-end gap-3 sm:flex">
        <button
          type="submit"
          disabled={saving || loadingCategories}
          className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {saving ? 'Đang lưu...' : initialEvent ? 'Lưu thay đổi' : 'Lưu sự kiện'}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center bg-white px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] sm:hidden">
        <button
          type="submit"
          disabled={saving || loadingCategories}
          className="min-w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {saving ? 'Đang lưu...' : initialEvent ? 'Lưu thay đổi' : 'Lưu sự kiện'}
        </button>
      </div>
    </form>
  );
}
