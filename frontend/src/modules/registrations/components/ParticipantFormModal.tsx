import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import Modal from '../../../components/common/Modal';
import { createParticipant, updateParticipant } from '../registrationsApi';
import type { Participant, ParticipantRequest } from '../registrationsTypes';

interface Props { open: boolean; participant: Participant | null; onClose: () => void; onSaved: () => void; onError: (message: string) => void; }
type Form = { username: string; fullName: string; email: string; phone: string; password: string };
type Errors = Partial<Record<keyof Form, string>>;
const EMPTY: Form = { username: '', fullName: '', email: '', phone: '', password: '' };

export default function ParticipantFormModal({ open, participant, onClose, onSaved, onError }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setForm(participant ? { username: participant.username, fullName: participant.fullName, email: participant.email, phone: participant.phone ?? '', password: '' } : EMPTY); setErrors({}); } }, [open, participant]);
  const change = (name: keyof Form, value: string) => { setForm((old) => ({ ...old, [name]: value })); setErrors((old) => ({ ...old, [name]: undefined })); };
  const validate = () => {
    const next: Errors = {};
    if (!form.username.trim()) next.username = 'Tên đăng nhập là bắt buộc'; else if (form.username.trim().length < 4 || form.username.trim().length > 50) next.username = 'Tên đăng nhập phải từ 4 đến 50 ký tự';
    if (!form.fullName.trim()) next.fullName = 'Họ tên là bắt buộc';
    if (!form.email.trim()) next.email = 'Email là bắt buộc'; else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email.trim())) next.email = 'Email không đúng định dạng';
    if (form.phone.trim() && !/^0\d{9}$/.test(form.phone.trim())) next.phone = 'Số điện thoại phải có 10 số và bắt đầu bằng 0';
    if (!participant && !form.password) next.password = 'Mật khẩu là bắt buộc'; else if (form.password && form.password.length < 8) next.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    return next;
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); const next = validate(); setErrors(next); if (Object.keys(next).length || saving) return;
    const body: ParticipantRequest = { username: form.username.trim(), fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() || null, ...(form.password ? { password: form.password } : {}) };
    setSaving(true);
    try { participant ? await updateParticipant(participant.id, body) : await createParticipant(body); onSaved(); }
    catch (error) { const response = axios.isAxiosError<{ message?: string; errors?: Array<{ field: keyof Form; message: string }> }>(error) ? error.response : undefined; const message = response?.data?.message ?? 'Không thể lưu người tham gia.'; if (response?.status === 409 && message.toLowerCase().includes('email')) setErrors((old) => ({ ...old, email: message })); if (response?.status === 400 && response.data.errors) setErrors((old) => ({ ...old, ...Object.fromEntries(response.data.errors!.map((item) => [item.field, item.message])) })); onError(message); }
    finally { setSaving(false); }
  };
  const input = (name: keyof Form) => `mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus:ring-4 ${errors[name] ? 'border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-ink/30 focus:ring-ink/10'}`;
  const field = (name: keyof Form, label: string, type = 'text', required = false) => <label className="block text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}<input type={type} value={form[name]} onChange={(e) => change(name, e.target.value)} className={input(name)} aria-invalid={Boolean(errors[name])}/>{errors[name] && <span className="mt-1 block text-xs font-medium text-red-600">{errors[name]}</span>}</label>;
  return <Modal open={open} title={participant ? 'Chỉnh sửa người tham gia' : 'Thêm người tham gia'} onClose={saving ? () => undefined : onClose}><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{field('username', 'Tên đăng nhập', 'text', true)}{field('fullName', 'Họ tên', 'text', true)}</div>{field('email', 'Email', 'email', true)}{field('phone', 'Số điện thoại', 'tel')}{!participant && field('password', 'Mật khẩu', 'password', true)}<div className="flex justify-end gap-3 border-t pt-5"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Hủy</button><button disabled={saving} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button></div></form></Modal>;
}
