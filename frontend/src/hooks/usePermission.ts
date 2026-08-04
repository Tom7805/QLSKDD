import { useAppSelector } from '../stores/store';
import { selectRole } from '../stores/slices/authSlice';

/**
 * Trả về true nếu vai trò hiện tại nằm trong danh sách được phép — dùng chung
 * cho cả RoleRoute (chặn route) lẫn ẩn/hiện nút bấm theo quyền (B1.3-T6).
 */
export function usePermission(allow: string | string[]): boolean {
  const role = useAppSelector(selectRole);
  const allowList = Array.isArray(allow) ? allow : [allow];

  if (allowList.length === 0) return true; // không khai báo quyền = ai cũng dùng được
  return role !== null && allowList.includes(role);
}
