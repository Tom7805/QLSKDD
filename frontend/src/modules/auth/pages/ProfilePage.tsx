import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyIcon, ShieldUserIcon, UsersIcon } from '../../../components/common/Icons';
import { useToast } from '../../../components/common/Toast';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import SortableGrid from '../../../components/ui/SortableGrid';
import { ROLE_LABELS } from '../../../constants/roles';
import { ROUTES } from '../../../constants/routes';
import { selectUser, setProfile } from '../../../stores/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../stores/store';
import { updateProfile } from '../authApi';
import AvatarPicker from '../components/AvatarPicker';

/** Quyền của từng vai trò — nêu đúng những gì hệ thống thực sự cho phép */
const ROLE_CAPABILITIES: Record<string, string[]> = {
  ROLE_ADMIN: [
    'Quản lý toàn bộ tài khoản người dùng',
    'Quản lý loại sự kiện',
    'Tạo, sửa và huỷ mọi sự kiện',
    'Xem thống kê và xuất báo cáo',
  ],
  ROLE_ORGANIZER: [
    'Tạo, sửa và huỷ sự kiện',
    'Quản lý người tham gia',
    'Điểm danh và theo dõi tham dự',
    'Xem thống kê và xuất báo cáo',
  ],
  ROLE_USER: [
    'Xem và tìm kiếm sự kiện',
    'Đăng ký và huỷ đăng ký tham gia',
    'Nhận mã QR để điểm danh',
  ],
};

const fieldClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-ink outline-none transition-all duration-200 hover:border-slate-300 focus:border-ink/25 focus:ring-4 focus:ring-ink/[0.07] disabled:bg-slate-50 disabled:text-slate-400';

/** Khoá localStorage nhớ thứ tự các thẻ ở cột phải */
const PROFILE_ORDER_KEY = 'qlskdd.profile.cardOrder';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const user = useAppSelector(selectUser);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Nạp giá trị từ store khi phiên được khôi phục xong
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? '');
    setPhone(user.phone ?? '');
    setAvatar(user.avatar ?? '');
  }, [user]);

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      fullName !== (user.fullName ?? '') ||
      phone !== (user.phone ?? '') ||
      avatar !== (user.avatar ?? '')
    );
  }, [user, fullName, phone, avatar]);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const capabilities = ROLE_CAPABILITIES[user.role] ?? [];

  const handleReset = () => {
    setFullName(user.fullName ?? '');
    setPhone(user.phone ?? '');
    setAvatar(user.avatar ?? '');
    setFieldErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Họ tên không được để trống';
    if (phone.trim() && !/^[0-9+\-\s]{8,15}$/.test(phone.trim())) errors.phone = 'Số điện thoại không hợp lệ';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateProfile({ fullName: fullName.trim(), phone: phone.trim(), avatar });
      dispatch(setProfile(updated));
      showToast('Đã cập nhật hồ sơ', 'success');
    } catch (requestError: unknown) {
      // Backend trả lỗi theo từng trường (Bean Validation) -> ánh xạ vào đúng ô nhập
      if (axios.isAxiosError<{ message?: string; errors?: Record<string, string> }>(requestError)) {
        const data = requestError.response?.data;
        if (data?.errors) setFieldErrors(data.errors);
        showToast(data?.message ?? 'Không thể cập nhật hồ sơ.', 'error');
      } else {
        showToast('Không thể cập nhật hồ sơ.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-workspace p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[26px]">Hồ sơ của tôi</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Cập nhật thông tin hiển thị và ảnh đại diện của bạn.</p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="animate-rise space-y-5">
            <Card floating>
              <CardHeader title="Ảnh đại diện" subtitle="Tải ảnh của bạn hoặc chọn một màu nền" />
              <CardBody>
                <AvatarPicker name={fullName || user.username} value={avatar} onChange={setAvatar} />
              </CardBody>
            </Card>

            <Card floating>
              <CardHeader title="Thông tin cá nhân" subtitle="Những mục có thể chỉnh sửa" />
              <CardBody className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Họ và tên
                  </span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={fieldClassName}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                  />
                  {fieldErrors.fullName && (
                    <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">
                      {fieldErrors.fullName}
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Số điện thoại
                  </span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Chưa cập nhật"
                    className={fieldClassName}
                    aria-invalid={Boolean(fieldErrors.phone)}
                  />
                  {fieldErrors.phone && (
                    <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">
                      {fieldErrors.phone}
                    </span>
                  )}
                </label>

                {/* Ba trường khoá: nêu rõ lý do ngay tại chỗ để người dùng không loay
                    hoay tìm cách sửa một thứ vốn không cho sửa */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Tên đăng nhập
                    </span>
                    <input value={user.username} disabled className={fieldClassName} />
                    <span className="mt-1.5 block text-xs text-slate-400">Không đổi được — dùng để đăng nhập</span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Email
                    </span>
                    <input value={user.email} disabled className={fieldClassName} />
                    <span className="mt-1.5 block text-xs text-slate-400">Liên hệ quản trị viên để thay đổi</span>
                  </label>
                </div>
              </CardBody>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline px-4 py-3 sm:px-5">
                <Button type="button" variant="ghost" onClick={handleReset} disabled={!dirty || saving}>
                  Hoàn tác
                </Button>
                <Button type="submit" loading={saving} disabled={!dirty}>
                  Lưu thay đổi
                </Button>
              </div>
            </Card>
          </form>

          {/*
            Cột phải là ba thẻ độc lập, cùng bề rộng nên xếp kiểu nào cũng vừa cột —
            người dùng kéo để đưa thẻ hay dùng lên trên. Cột trái KHÔNG cho đổi chỗ vì
            nó là một biểu mẫu: đổi chỗ sẽ tách nút "Lưu thay đổi" khỏi phần nhập liệu.
          */}
          <SortableGrid
            storageKey={PROFILE_ORDER_KEY}
            ariaLabel="Thẻ thông tin tài khoản"
            className="animate-rise grid grid-cols-1 gap-5"
            blocks={[
              {
                id: 'account',
                title: 'Tài khoản',
                content: (
            <Card floating>
              <CardBody className="text-center">
                <Avatar name={user.fullName} avatar={user.avatar} size="lg" className="mx-auto shadow-card" />
                <p className="mt-3 truncate text-[15px] font-bold text-ink">{user.fullName}</p>
                <p className="truncate text-xs text-ink-muted">{user.email}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                  <ShieldUserIcon className="h-3.5 w-3.5" />
                  {roleLabel}
                </span>
              </CardBody>
            </Card>
                ),
              },
              {
                id: 'capabilities',
                title: 'Quyền của bạn',
                content: (
            <Card floating>
              <CardHeader icon={<UsersIcon className="h-4 w-4" />} title="Quyền của bạn" subtitle={roleLabel} />
              <CardBody>
                <ul className="space-y-2.5">
                  {capabilities.map((capability) => (
                    <li key={capability} className="flex gap-2.5 text-[13px] leading-5 text-ink-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/30" aria-hidden="true" />
                      {capability}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
                ),
              },
              {
                id: 'password',
                title: 'Đổi mật khẩu',
                content: (
            <Card floating>
              <CardBody>
                <Link
                  to={ROUTES.CHANGE_PASSWORD}
                  className="group flex items-center gap-3 rounded-xl p-1 transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-ink-muted transition-colors duration-200 group-hover:bg-ink group-hover:text-white">
                    <KeyIcon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-ink group-hover:underline">Đổi mật khẩu</span>
                    <span className="block text-xs text-ink-muted">Bảo mật tài khoản của bạn</span>
                  </span>
                </Link>
              </CardBody>
            </Card>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
