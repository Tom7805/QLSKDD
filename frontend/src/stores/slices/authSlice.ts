import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getMe, logout as logoutApi } from '../../modules/auth/authApi';
import type { User } from '../../modules/auth/authTypes';
import type { RootState } from '../store';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  isLoggedIn: false,
  loading: Boolean(localStorage.getItem('accessToken')),
  error: null,
};

// Khi app khởi động: đọc token đã lưu trong localStorage và gọi /auth/me để khôi phục phiên
export const restoreSession = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      return await getMe();
    } catch {
      return rejectWithValue('Không thể khôi phục phiên đăng nhập');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = true;
      state.error = null;
      localStorage.setItem('accessToken', action.payload.token);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      localStorage.removeItem('accessToken');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isLoggedIn = true;
        state.loading = false;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isLoggedIn = false;
        state.loading = false;
        state.error = action.payload ?? 'Phiên đăng nhập đã hết hạn';
        localStorage.removeItem('accessToken');
      });
  },
});

export const { setCredentials, clearCredentials, setLoading, setError } = authSlice.actions;

// Đăng xuất: xoá token + reset state ngay ở client, sau đó gọi API logout theo kiểu
// best-effort. JWT stateless nên không được giữ người dùng chờ phản hồi từ server.
// Các slice khác (nếu về sau có cache dữ liệu người dùng) nên tự lắng nghe
// `logout.fulfilled` trong extraReducers của mình để xoá cache theo, tránh lộ dữ liệu
// của người dùng trước sang phiên đăng nhập tiếp theo trên cùng một máy.
export const logout = createAsyncThunk<void, void>('auth/logout', async (_, { dispatch }) => {
  dispatch(clearCredentials());
  try {
    await logoutApi();
  } catch {
    // Bỏ qua lỗi gọi API — vẫn đăng xuất bình thường ở phía client
  }
});

export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn;
export const selectUser = (state: RootState) => state.auth.user;
export const selectRole = (state: RootState) => state.auth.user?.role ?? null;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
