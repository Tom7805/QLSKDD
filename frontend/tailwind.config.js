/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nền xám của "bàn làm việc" — khung ứng dụng bo tròn nổi lên trên nền này
        canvas: '#e9edf5',
        // Mực chính: gần đen nhưng ám xanh, dùng cho nút chính / chip đang chọn / chữ đậm
        ink: {
          DEFAULT: '#16181d',
          soft: '#2a2d35',
          muted: '#5b616e',
        },
        // Đường kẻ/viền thống nhất toàn hệ thống
        hairline: '#e7eaf0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        /*
<<<<<<< HEAD
=======
         * Nền của các trang có thẻ nổi. Một dải xanh lạnh rất nhạt, cộng một quầng sáng
         * trắng lớn ở góc trên bên trái để mặt nền không phẳng lì.
         *
         * Cố ý CHỈ dùng một họ màu (xanh): bản trước pha thêm hồng ở đáy, mà tím nhạt gặp
         * hồng nhạt thì ra một sắc xám đục — nền trông bẩn chứ không dịu.
         */
        workspace:
          'radial-gradient(900px 500px at 8% -10%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0) 66%), radial-gradient(700px 440px at 100% 0%, rgba(199,210,254,0.42), transparent 64%), linear-gradient(155deg, #f4f7fc 0%, #e9eef8 52%, #eef2f8 100%)',
        /** Dải chào ở trang chủ — đậm hơn nền một nấc để vẫn tách ra khỏi nó */
        welcome: 'linear-gradient(112deg, #dde6fb 0%, #e5e6fa 46%, #e9f0fd 100%)',
        /*
>>>>>>> 85ff8f49043fe298082949bc3d77c59c4588f808
         * Nền của trang chủ kính mờ, dựng hoàn toàn bằng CSS — không tải thêm file ảnh.
         *
         * Cố ý để SÁNG chứ không tối: chữ trên trang này là chữ đậm màu mực, nên nếu vì
         * lý do gì mà lớp nền không nạp được (cache CSS cũ, config chưa build lại) thì
         * trang rơi về nền trắng và vẫn đọc được bình thường. Bản nền tối trước đó thì
         * ngược lại — mất nền là mất luôn toàn bộ chữ.
         */
        scene: [
          'radial-gradient(1200px 700px at 6% -12%, rgba(255,255,255,0.95), transparent 58%)',
          'radial-gradient(900px 620px at 96% 4%, rgba(199,210,254,0.75), transparent 60%)',
          'radial-gradient(1000px 720px at 72% 106%, rgba(186,230,253,0.60), transparent 58%)',
          'radial-gradient(700px 520px at 22% 100%, rgba(233,213,255,0.45), transparent 60%)',
          'linear-gradient(155deg, #eff1f6 0%, #e6eaf2 52%, #edeff5 100%)',
        ].join(', '),
      },
      boxShadow: {
        // Bóng rất nhẹ cho thẻ nổi trên nền trắng (tránh viền cứng)
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -18px rgba(30, 41, 59, 0.24)',
        // Bóng khi thẻ được hover / nhấc lên
        lift: '0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.04)',
        // Bóng của cả khung ứng dụng
        shell: '0 24px 70px -28px rgba(30, 41, 59, 0.34), 0 4px 18px -10px rgba(30, 41, 59, 0.16)',
        // Bóng của mục điều hướng / tab đang chọn (viên thuốc trắng)
        pill: '0 1px 2px rgba(16, 24, 40, 0.06), 0 2px 6px rgba(16, 24, 40, 0.05)',
        // Bóng của popover / menu thả xuống
        pop: '0 8px 28px rgba(16, 24, 40, 0.12), 0 2px 6px rgba(16, 24, 40, 0.06)',
        // Bóng của thẻ nổi trên nền bg-workspace — ám xanh tím cùng tông với nền nên
        // trông như thẻ lơ lửng phía trên, không phải một hình chữ nhật dán phẳng
        float: '0 18px 45px -26px rgba(49, 46, 129, 0.42), 0 2px 8px -4px rgba(15,23,42,.1)',
        'float-lg': '0 24px 50px -22px rgba(49, 46, 129, 0.55)',
        /*
         * Thẻ kính mờ: một bóng đổ mềm bên dưới CỘNG một vệt sáng trắng mảnh chạy dọc
         * mép trên (inset). Vệt sáng đó mới là thứ làm tấm kính trông có bề dày — thiếu
         * nó thì thẻ chỉ như một hình chữ nhật trắng mờ dán lên nền.
         */
        glass: '0 12px 34px -14px rgba(15, 23, 42, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.90)',
        'glass-lg': '0 20px 44px -16px rgba(15, 23, 42, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        /** Thẻ trắng đặc lồng bên trong tấm kính */
        inset: '0 6px 18px -8px rgba(15, 23, 42, 0.18)',
        /** Nút bấm nhô lên khỏi mặt phẳng — đậm hơn bóng thẻ vì nút nhỏ, cần rõ mép */
        raise: '0 8px 20px -8px rgba(15, 23, 42, 0.30)',
        'raise-lg': '0 14px 30px -10px rgba(15, 23, 42, 0.42)',
      },
    },
  },
  plugins: [],
};
