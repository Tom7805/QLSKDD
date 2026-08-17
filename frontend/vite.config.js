import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        clearMocks: true,
        /*
         * Nhiều test phải chờ đồng hồ thật (debounce 400ms của ô tìm kiếm, userEvent gõ từng
         * ký tự). Vitest chạy 14 file song song, nên khi máy bận thì các file tranh CPU và
         * hàng loạt test hết giờ ở mốc mặc định 5s dù code không có gì sai — chạy tuần tự thì
         * pass hết. Nới lên 20s: test hỏng thật vẫn đỏ, chỉ là báo muộn hơn.
         */
        testTimeout: 20000,
    },
});
