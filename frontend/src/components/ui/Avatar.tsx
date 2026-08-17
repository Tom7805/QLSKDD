/**
 * Ảnh đại diện. Nhận hai dạng giá trị (khớp với cột users.avatar ở backend):
 *  - "preset:<màu>" — chữ cái đầu trên nền gradient theo màu đã chọn
 *  - data URI / URL ảnh — hiện ảnh thật
 * Không có gì thì tự chọn màu theo tên, nên mỗi người vẫn có một sắc riêng ổn định
 * thay vì đồng loạt xám xịt giống nhau.
 */

export const AVATAR_PRESETS = [
  { key: 'ink', label: 'Mực', gradient: 'from-slate-700 to-slate-900' },
  { key: 'violet', label: 'Tím', gradient: 'from-violet-500 to-indigo-600' },
  { key: 'sky', label: 'Xanh biển', gradient: 'from-sky-400 to-blue-600' },
  { key: 'emerald', label: 'Xanh lá', gradient: 'from-emerald-400 to-teal-600' },
  { key: 'amber', label: 'Hổ phách', gradient: 'from-amber-400 to-orange-500' },
  { key: 'rose', label: 'Hồng', gradient: 'from-rose-400 to-pink-600' },
  { key: 'fuchsia', label: 'Cánh sen', gradient: 'from-fuchsia-500 to-purple-600' },
  { key: 'teal', label: 'Ngọc', gradient: 'from-teal-400 to-cyan-600' },
] as const;

export type AvatarPresetKey = (typeof AVATAR_PRESETS)[number]['key'];

const PRESET_BY_KEY = new Map(AVATAR_PRESETS.map((preset) => [preset.key, preset]));

const SIZES = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-[13px]',
  md: 'h-11 w-11 text-[15px]',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-4xl',
} as const;

export type AvatarSize = keyof typeof SIZES;

/** Chọn màu ổn định theo tên khi người dùng chưa tự đặt — cùng tên luôn ra cùng màu */
function fallbackPreset(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }
  return AVATAR_PRESETS[hash % AVATAR_PRESETS.length];
}

export function isImageAvatar(avatar: string | null | undefined): boolean {
  return Boolean(avatar && !avatar.startsWith('preset:'));
}

interface AvatarProps {
  name: string;
  avatar?: string | null;
  size?: AvatarSize;
  /** Vòng viền trắng quanh ảnh — dùng khi avatar đặt trên nền màu/ảnh */
  ring?: boolean;
  className?: string;
}

export default function Avatar({ name, avatar, size = 'sm', ring = false, className = '' }: AvatarProps) {
  const base = [
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold',
    'transition-transform duration-200',
    ring ? 'ring-2 ring-white' : '',
    SIZES[size],
    className,
  ].join(' ');

  if (isImageAvatar(avatar)) {
    return (
      <span className={base}>
        <img src={avatar as string} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  const presetKey = avatar?.startsWith('preset:') ? avatar.slice('preset:'.length) : null;
  const preset = (presetKey && PRESET_BY_KEY.get(presetKey as AvatarPresetKey)) || fallbackPreset(name);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`${base} bg-gradient-to-br ${preset.gradient} text-white`} aria-hidden="true">
      {initial}
    </span>
  );
}
