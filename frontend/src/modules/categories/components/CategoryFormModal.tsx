import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import Modal from '../../../components/common/Modal';
import { createCategory, updateCategory } from '../categoriesApi';
import type { Category, CategoryRequest } from '../categoriesTypes';

type CategoryFormMode = 'create' | 'edit';

interface CategoryFormModalProps {
  open: boolean;
  mode: CategoryFormMode;
  category?: Category | null;
  onClose: () => void;
  onSaved: (category: Category) => void;
  onError?: (message: string) => void;
}

interface FormState {
  name: string;
  description: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ field: keyof FormState; message: string }>;
}

const EMPTY_FORM: FormState = { name: '', description: '' };

function formFromCategory(category?: Category | null): FormState {
  if (!category) return EMPTY_FORM;
  return {
    name: category.name,
    description: category.description ?? '',
  };
}

export default function CategoryFormModal({ open, mode, category, onClose, onSaved, onError }: CategoryFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setForm(formFromCategory(mode === 'edit' ? category : null));
      setError(null);
      setFieldErrors({});
    }
  }, [open, mode, category]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = form.name.trim();

    if (!name) errors.name = 'Tên loại sự kiện là bắt buộc';
    else if (name.length > 100) errors.name = 'Tên loại sự kiện không được vượt quá 100 ký tự';

    return errors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const request: CategoryRequest = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    setSaving(true);
    setError(null);
    try {
      const savedCategory = mode === 'create'
        ? await createCategory(request)
        : await updateCategory(category!.id, request);
      onSaved(savedCategory);
    } catch (err) {
      const response = axios.isAxiosError<ApiErrorResponse>(err) ? err.response : undefined;
      const message = response?.data?.message;
      const fallbackMessage = message ?? 'Không thể lưu loại sự kiện. Vui lòng thử lại.';

      if (response?.status === 409 && message) {
        if (message.toLowerCase().includes('tên loại sự kiện đã tồn tại')) {
          setFieldErrors({ name: 'Tên loại sự kiện đã tồn tại' });
          return;
        }
      }

      if (response?.status === 400 && response.data?.errors?.length) {
        const backendErrors = response.data.errors.reduce<FieldErrors>((errors, item) => {
          errors[item.field] = item.message;
          return errors;
        }, {});
        setFieldErrors((current) => ({ ...current, ...backendErrors }));
        return;
      }

      setError(fallbackMessage);
      onError?.(fallbackMessage);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field: keyof FormState) => `mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    fieldErrors[field]
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-ink/30 focus:ring-ink/10'
  }`;

  const fieldError = (field: keyof FormState) => fieldErrors[field] ? (
    <span id={`${field}-error`} className="mt-1.5 block text-xs font-medium text-red-600">{fieldErrors[field]}</span>
  ) : null;

  return (
    <Modal open={open} title={mode === 'create' ? 'Thêm loại sự kiện' : 'Chỉnh sửa loại sự kiện'} onClose={saving ? () => undefined : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <label className="block text-sm font-medium text-slate-700">
          Tên loại sự kiện <span className="text-red-500">*</span>
          <input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            placeholder="Nhập tên loại sự kiện"
            className={inputClass('name')}
          />
          {fieldError('name')}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Mô tả
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Mô tả ngắn về loại sự kiện"
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ink/30 focus:ring-ink/10"
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
          <button type="submit" disabled={saving} className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-blue-400">
            {saving ? 'Đang lưu...' : mode === 'create' ? 'Lưu loại mới' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
