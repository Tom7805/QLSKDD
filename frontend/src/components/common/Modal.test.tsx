import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';
import Modal from './Modal';

/**
 * Hộp thoại phải được dựng THẲNG vào <body>, không nằm trong cây DOM của trang.
 *
 * Lý do là một lỗi đã gặp thật: khung bọc nội dung trang có hiệu ứng chuyển cảnh dùng
 * transform, mà phần tử cha có transform sẽ khiến `position: fixed` bên trong neo theo
 * chính nó thay vì theo màn hình — hộp thoại rơi xuống giữa chiều cao toàn trang, người
 * dùng phải cuộn xuống mới thấy. Portal ra body làm hộp thoại miễn nhiễm với việc đó.
 */
describe('Modal', () => {
  it('dựng nội dung ra ngoài cây DOM của trang, không nằm trong phần tử cha', () => {
    const { container } = render(
      <div style={{ transform: 'translateY(10px)' }}>
        <Modal open title="Vé tham dự" onClose={() => {}}>
          <p>Nội dung vé</p>
        </Modal>
      </div>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Vé tham dự' });
    expect(dialog).toBeInTheDocument();
    // Không nằm trong phần tử cha có transform
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('đóng khi nhấn Esc và khi bấm ra nền ngoài', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Vé tham dự" onClose={onClose}>
        <p>Nội dung vé</p>
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByRole('dialog', { name: 'Vé tham dự' }).parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('bấm vào bên trong hộp thoại thì không đóng', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Vé tham dự" onClose={onClose}>
        <p>Nội dung vé</p>
      </Modal>,
    );

    fireEvent.mouseDown(screen.getByText('Nội dung vé'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('ConfirmDialog', () => {
  it('cũng dựng ra ngoài cây DOM của trang', () => {
    const { container } = render(
      <div style={{ transform: 'scale(0.99)' }}>
        <ConfirmDialog open title="Huỷ đăng ký" message="Bạn chắc chứ?" onConfirm={() => {}} onCancel={() => {}} />
      </div>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Huỷ đăng ký' });
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('nhấn Esc thì huỷ, nhưng không huỷ khi đang xử lý', () => {
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog open title="Huỷ đăng ký" message="Bạn chắc chứ?" onConfirm={() => {}} onCancel={onCancel} />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Đang gọi API dở thì Esc không được cắt ngang
    rerender(
      <ConfirmDialog open loading title="Huỷ đăng ký" message="Bạn chắc chứ?" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
