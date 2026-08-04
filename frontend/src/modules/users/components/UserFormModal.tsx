import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import Modal from '../../../components/common/Modal';
import { createUser, updateUser } from '../usersApi';
import type { User, UserRequest } from '../usersTypes';

type UserFormMode = 'create' | 'edit';

interface UserFormModalProps {
  open: boolean;
  mode: UserFormMode;
  user?: User | null;
  onClose: () => void;
  onSaved: (user: User) => void;
  onError?: (message: string) => void;
}

interface FormState {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  password: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ field: keyof FormState; message: string }>;
}

// Backend hiện chưa có API lấy danh sách role. Các ID này khớp thứ tự role được
// tạo trong DataSeeder: ADMIN, ORGANIZER, USER.
const ROLE_OPTIONS = [
  { id: '1', name: 'Quản trị viên', code: 'ROLE_ADMIN' },
  { id: '2', name: 'Ban tổ chức', code: 'ROLE_ORGANIZER' },
  { id: '3', name: 'Người dùng', code: 'ROLE_USER' },
] as const;

const EMPTY_FORM: FormState = {
  username: '', fullName: '', email: '', phone: '', roleId: '3', password: '',
};

function formFromUser(user?: User | null): FormState {
  if (!user) return EMPTY_FORM;
  const role = ROLE_OPTIONS.find((item) => item.code === user.role);
  return {
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? '',
    roleId: role?.id ?? '3',
    password: '',
  };
}

export default function UserFormModal({ open, mode, user, onClose, onSaved, onError }: UserFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setForm(formFromUser(mode === 'edit' ? user : null));
      setError(null);
      setFieldErrors({});
    }
  }, [open, mode, user]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const username = form.username.trim();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!username) errors.username = 'Tên đăng nhập là bắt buộc';
    else if (username.length < 4 || username.length > 50) errors.username = 'Tên đăng nhập phải từ 4 đến 50 ký tự';

    if (!fullName) errors.fullName = 'Họ và tên là bắt buộc';

    if (!email) errors.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email không đúng định dạng';

    if (phone && !/^0\d{9}$/.test(phone)) errors.phone = 'Số điện thoại phải có 10 số và bắt đầu bằng 0';

    if (!form.roleId) errors.roleId = 'Vai trò là bắt buộc';

    if (mode === 'create') {
      if (!form.password) errors.password = 'Mật khẩu là bắt buộc';
      else if (form.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || (mode === 'edit' && !user)) return;

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const request: UserRequest = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      roleId: Number(form.roleId),
      ...(mode === 'create' ? { password: form.password } : {}),
    };

    setSaving(true);
    setError(null);
    try {
      const savedUser = mode === 'create'
        ? await createUser(request)
        : await updateUser(user!.id, request);
      onSaved(savedUser);
    } catch (err) {
      const response = axios.isAxiosError<ApiErrorResponse>(err) ? err.response : undefined;
      const message = response?.data?.message;
      const fallbackMessage = message ?? 'Không thể lưu tài khoản. Vui lòng thử lại.';
      onError?.(fallbackMessage);

      if (response?.status === 409 && message) {
        const normalizedMessage = message.toLowerCase();
        if (normalizedMessage.includes('username') || normalizedMessage.includes('tên đăng nhập')) {
          setFieldErrors((current) => ({ ...current, username: 'Tên đăng nhập đã tồn tại' }));
          return;
        }
        if (normalizedMessage.includes('email')) {
          setFieldErrors((current) => ({ ...current, email: 'Email đã tồn tại' }));
          return;
        }
      }

      if (response?.status === 400 && response.data.errors?.length) {
        const backendErrors = response.data.errors.reduce<FieldErrors>((errors, item) => {
          errors[item.field] = item.message;
          return errors;
        }, {});
        setFieldErrors((current) => ({ ...current, ...backendErrors }));
        return;
      }

      setError(fallbackMessage);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field: keyof FormState) => `mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
    fieldErrors[field]
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
  }`;

  const fieldError = (field: keyof FormState) => fieldErrors[field] ? (
    <span id={`${field}-error`} className="mt-1.5 block text-xs font-medium text-red-600">{fieldErrors[field]}</span>
  ) : null;

  return (
    <Modal open={open} title={mode === 'create' ? 'Thêm tài khoản mới' : 'Chỉnh sửa tài khoản'} onClose={saving ? () => undefined : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Tên đăng nhập <span className="text-red-500">*</span>
            <input value={form.username} onChange={(e) => updateField('username', e.target.value)} aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'username-error' : undefined} autoComplete="username" placeholder="Nhập tên đăng nhập" className={inputClass('username')} />
            {fieldError('username')}
          </label>
          <label className="text-sm font-medium text-slate-700">
            Họ và tên <span className="text-red-500">*</span>
            <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined} autoComplete="name" placeholder="Nhập họ và tên" className={inputClass('fullName')} />
            {fieldError('fullName')}
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Email <span className="text-red-500">*</span>
          <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} autoComplete="email" placeholder="name@example.com" className={inputClass('email')} />
          {fieldError('email')}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Số điện thoại
            <input type="tel" inputMode="numeric" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} autoComplete="tel" placeholder="0901234567" className={inputClass('phone')} />
            {fieldError('phone')}
          </label>
          <label className="text-sm font-medium text-slate-700">
            Vai trò <span className="text-red-500">*</span>
            <select value={form.roleId} onChange={(e) => updateField('roleId', e.target.value)} aria-invalid={Boolean(fieldErrors.roleId)} aria-describedby={fieldErrors.roleId ? 'roleId-error' : undefined} className={inputClass('roleId')}>
              {ROLE_OPTIONS.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            {fieldError('roleId')}
          </label>
        </div>

        {mode === 'create' && (
          <label className="block text-sm font-medium text-slate-700">
            Mật khẩu <span className="text-red-500">*</span>
            <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" className={inputClass('password')} />
            {fieldError('password')}
          </label>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
          <button type="submit" disabled={saving} className="inline-flex min-w-24 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400">
            {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
