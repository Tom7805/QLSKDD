import { useRef, useState } from 'react';
import Avatar, { AVATAR_PRESETS, isImageAvatar } from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { CheckIcon } from '../../../components/common/Icons';

/** Cạnh ảnh sau khi nén — vừa đủ nét cho avatar lớn nhất trên giao diện (96px) ở màn 2x */
const OUTPUT_SIZE = 256;
const OUTPUT_QUALITY = 0.82;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/**
 * Cắt vuông giữa ảnh rồi nén xuống JPEG 256×256 ngay trên trình duyệt.
 * Ảnh máy ảnh điện thoại thường 3–8MB, gửi thẳng lên sẽ vượt trần cột TEXT và làm phình
 * bảng users; nén ở client đưa về khoảng 15–30KB, đồng thời tránh phải dựng hạ tầng lưu
 * trữ tệp riêng cho một tính năng nhỏ.
 */
function compressToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh'));
        return;
      }
      // Cắt vuông từ giữa ảnh gốc để không bị méo khi ảnh không vuông
      const side = Math.min(image.width, image.height);
      context.drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );
      resolve(canvas.toDataURL('image/jpeg', OUTPUT_QUALITY));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không đọc được tệp ảnh'));
    };

    image.src = objectUrl;
  });
}

interface AvatarPickerProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

export default function AvatarPicker({ name, value, onChange }: AvatarPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn một tệp ảnh.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('Ảnh quá lớn (tối đa 8MB).');
      return;
    }

    setProcessing(true);
    try {
      onChange(await compressToDataUri(file));
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : 'Không xử lý được ảnh.');
    } finally {
      setProcessing(false);
      // Xoá giá trị input để chọn lại đúng tệp vừa rồi vẫn kích hoạt onChange
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative">
        <Avatar name={name} avatar={value} size="xl" className="shadow-lift" />
        {processing && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/50">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(event) => handleFile(event.target.files?.[0])}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <Button type="button" size="sm" variant="secondary" pill onClick={() => fileRef.current?.click()}>
            Tải ảnh lên
          </Button>
          {isImageAvatar(value) && (
            <Button type="button" size="sm" variant="ghost" pill onClick={() => onChange('')}>
              Gỡ ảnh
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">
          Ảnh được cắt vuông và nén còn 256×256 ngay trên máy bạn trước khi gửi đi.
        </p>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Hoặc chọn màu nền
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn màu ảnh đại diện">
          {AVATAR_PRESETS.map((preset) => {
            const presetValue = `preset:${preset.key}`;
            const selected = value === presetValue;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onChange(presetValue)}
                aria-pressed={selected}
                title={preset.label}
                className={[
                  'relative h-9 w-9 rounded-full bg-gradient-to-br transition-all duration-200',
                  'hover:scale-110 active:scale-95',
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-ink/15',
                  preset.gradient,
                  selected ? 'ring-2 ring-ink ring-offset-2' : '',
                ].join(' ')}
              >
                {selected && (
                  <CheckIcon className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
