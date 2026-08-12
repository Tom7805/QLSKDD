import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../components/common/Toast';
import CategoryListPage from './CategoryListPage';
import authReducer from '../../../stores/slices/authSlice';
import * as categoriesApi from '../categoriesApi';

vi.mock('../categoriesApi');

const mockedGetCategories = vi.mocked(categoriesApi.getCategories);
const mockedCreateCategory = vi.mocked(categoriesApi.createCategory);
const mockedDeleteCategory = vi.mocked(categoriesApi.deleteCategory);

const categoriesMock = [
  { id: 1, name: 'Hội thảo', description: 'Sự kiện chia sẻ kiến thức', eventCount: 3 },
  { id: 2, name: 'Workshop', description: null, eventCount: 0 },
];

function renderCategoryPage() {
  const store = configureStore({ reducer: { auth: authReducer } });

  render(
    <Provider store={store}>
      <ToastProvider>
        <CategoryListPage />
      </ToastProvider>
    </Provider>,
  );

  return store;
}

describe('CategoryListPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hiển thị danh sách loại sự kiện và số lượng sự kiện', async () => {
    mockedGetCategories.mockResolvedValueOnce(categoriesMock);

    renderCategoryPage();

    // Trang có 2 view song song cho responsive (bảng desktop `md:block` + danh
    // sách card mobile `md:hidden`) — jsdom không tính CSS/media query nên cả
    // hai đều nằm trong DOM cùng lúc. Scope truy vấn vào bảng desktop để tránh
    // "Found multiple elements" khi tên loại sự kiện xuất hiện ở cả 2 nơi.
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Hội thảo')).toBeInTheDocument();
    expect(within(table).getByText('Sự kiện chia sẻ kiến thức')).toBeInTheDocument();
    expect(within(table).getByText('3')).toBeInTheDocument();
    expect(within(table).getByText('Workshop')).toBeInTheDocument();
    expect(within(table).getByText('0')).toBeInTheDocument();
  });

  it('mở modal thêm mới và hiển thị lỗi khi tên trống', async () => {
    mockedGetCategories.mockResolvedValueOnce(categoriesMock);
    renderCategoryPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Thêm loại mới' }));

    expect(screen.getByRole('heading', { name: 'Thêm loại sự kiện' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Lưu loại mới' }));

    expect(await screen.findByText('Tên loại sự kiện là bắt buộc')).toBeInTheDocument();
    expect(mockedCreateCategory).not.toHaveBeenCalled();
  });

  it('hiển thị toast lỗi khi xoá loại đang có sự kiện', async () => {
    mockedGetCategories.mockResolvedValueOnce(categoriesMock);
    mockedDeleteCategory.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { message: 'Không thể xoá: đang có 3 sự kiện thuộc loại này' } },
    });

    renderCategoryPage();

    // Nút "Xoá" xuất hiện ở cả bảng desktop lẫn card mobile cho mỗi dòng —
    // scope vào bảng desktop rồi lấy nút của dòng đầu tiên (Hội thảo).
    const table = await screen.findByRole('table');
    await userEvent.click(within(table).getAllByRole('button', { name: /Xoá/i })[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/Bạn có chắc muốn xoá loại sự kiện/i);

    // ConfirmDialog chỉ overlay chứ không gỡ danh sách phía sau khỏi DOM, nên
    // vẫn còn các nút "Xoá" khác — scope vào chính dialog để bấm đúng nút xác nhận.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Xoá' }));

    expect(await screen.findByText('Không thể xoá: đang có 3 sự kiện thuộc loại này')).toBeInTheDocument();
  });

  it('tạo loại sự kiện mới và tải lại danh sách', async () => {
    mockedGetCategories.mockResolvedValueOnce(categoriesMock);
    mockedCreateCategory.mockResolvedValueOnce({ id: 3, name: 'Gala', description: 'Tiệc tri ân', eventCount: 0 });
    mockedGetCategories.mockResolvedValueOnce([...categoriesMock, { id: 3, name: 'Gala', description: 'Tiệc tri ân', eventCount: 0 }]);

    renderCategoryPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Thêm loại mới' }));
    await userEvent.type(screen.getByLabelText('Tên loại sự kiện *'), 'Gala');
    await userEvent.type(screen.getByLabelText('Mô tả'), 'Tiệc tri ân');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu loại mới' }));

    expect(await screen.findByText('Đã tạo loại sự kiện Gala')).toBeInTheDocument();
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Gala')).toBeInTheDocument();
  });
});
