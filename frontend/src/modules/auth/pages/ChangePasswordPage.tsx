import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { changePassword } from '../authApi';
import type { ChangePasswordRequest } from '../authTypes';
import { useAppDispatch } from '../../../stores/store';
import { logout } from '../../../stores/slices/authSlice';
import { useToast } from '../../../components/common/Toast';
import { ROUTES } from '../../../constants/routes';

type PasswordField = keyof ChangePasswordRequest;
type FieldErrors = Partial<Record<PasswordField, string>>;

interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

interface PasswordInputProps {
  id: PasswordField;
  label: string;
  value: string;
  autoComplete: 'current-password' | 'new-password';
  placeholder: string;
  error?: string;
  descriptionId?: string;
  onChange: (value: string) => void;
}

const EMPTY_FORM: ChangePasswordRequest = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.847 0 1.669-.105 2.454-.303M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PasswordInput({
  id,
  label,
  value,
  autoComplete,
  placeholder,
  error,
  descriptionId,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className={`block min-h-11 w-full rounded-xl border px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-300 focus:border-ink/30 focus:ring-ink/10'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center rounded-r-xl text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ink/30"
          aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
        >
          <EyeIcon hidden={visible} />
        </button>
      </div>
      {error && <p id={errorId} className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: 'Chưa nhập', color: 'bg-slate-200' };

  let score = 1;
  if (password.length >= 8) score = 2;
  if (password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)) score = 3;
  if (score === 3 && (password.length >= 12 || /[^A-Za-z0-9]/.test(password))) score = 4;

  const levels = [
    { label: 'Yếu', color: 'bg-red-500' },
    { label: 'Trung bình', color: 'bg-amber-500' },
    { label: 'Khá', color: 'bg-slate-500' },
    { label: 'Mạnh', color: 'bg-emerald-500' },
  ];

  return { score, ...levels[score - 1] };
}

function isPasswordField(field: string): field is PasswordField {
  return field === 'oldPassword' || field === 'newPassword' || field === 'confirmPassword';
}

export default function ChangePasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState<ChangePasswordRequest>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const strength = getPasswordStrength(form.newPassword);

  const updateField = (field: PasswordField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!form.oldPassword.trim()) {
      errors.oldPassword = 'Mật khẩu hiện tại là bắt buộc';
    }

    if (!form.newPassword.trim()) {
      errors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm ít nhất 1 chữ và 1 số';
    } else if (form.newPassword === form.oldPassword) {
      errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    if (!form.confirmPassword.trim()) {
      errors.confirmPassword = 'Xác nhận mật khẩu mới là bắt buộc';
    } else if (form.confirmPassword !== form.newPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp với mật khẩu mới';
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const message = await changePassword(form);
      showToast(message, 'success');
      void dispatch(logout());
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (requestError) {
      const response = axios.isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response
        : undefined;
      const backendFieldErrors = response?.data?.errors?.reduce<FieldErrors>((errors, item) => {
        if (isPasswordField(item.field)) errors[item.field] = item.message;
        return errors;
      }, {});

      if (backendFieldErrors && Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((current) => ({ ...current, ...backendFieldErrors }));
      } else {
        setError(response?.data?.message ?? 'Không thể đổi mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-workspace px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Đổi mật khẩu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cập nhật mật khẩu để tăng cường bảo mật cho tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-3xl bg-white p-5 shadow-float sm:p-7">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <PasswordInput
            id="oldPassword"
            label="Mật khẩu hiện tại"
            value={form.oldPassword}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu hiện tại"
            error={fieldErrors.oldPassword}
            onChange={(value) => updateField('oldPassword', value)}
          />

          <div>
            <PasswordInput
              id="newPassword"
              label="Mật khẩu mới"
              value={form.newPassword}
              autoComplete="new-password"
              placeholder="Nhập mật khẩu mới"
              error={fieldErrors.newPassword}
              descriptionId="password-strength"
              onChange={(value) => updateField('newPassword', value)}
            />
            <div id="password-strength" className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-500">Độ mạnh mật khẩu</span>
                <span className="font-medium text-slate-700">{strength.label}</span>
              </div>
              <div
                role="progressbar"
                aria-label="Độ mạnh mật khẩu"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={strength.score}
                className="grid grid-cols-4 gap-1.5"
              >
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`h-1.5 rounded-full ${level <= strength.score ? strength.color : 'bg-slate-200'}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Dùng ít nhất 8 ký tự, gồm ít nhất 1 chữ và 1 số.
              </p>
            </div>
          </div>

          <PasswordInput
            id="confirmPassword"
            label="Xác nhận mật khẩu mới"
            value={form.confirmPassword}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            error={fieldErrors.confirmPassword}
            onChange={(value) => updateField('confirmPassword', value)}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={() => navigate(ROUTES.HOME)}
              className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {submitting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
