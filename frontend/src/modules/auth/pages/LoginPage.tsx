import { useEffect, useState } from 'react';
import LoginForm from '../components/LoginForm';

const FEATURES = [
  {
    number: '01',
    title: 'Lập lịch dễ dàng',
    eyebrow: 'Tổ chức thông minh',
    description: 'Tạo lịch, cập nhật thông tin và theo dõi trạng thái mọi sự kiện trên một dòng thời gian trực quan.',
    detail: 'Không bỏ lỡ cột mốc quan trọng',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M8 14h3M8 17h6" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Điểm danh tức thì',
    eyebrow: 'Nhanh và chính xác',
    description: 'Quét mã QR hoặc tìm người tham gia để ghi nhận hiện diện chỉ trong vài giây, ngay tại sự kiện.',
    detail: 'Giảm thời gian chờ tại khu vực đón khách',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM19 14h1v3h-3v3h-3v-2" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Báo cáo rõ ràng',
    eyebrow: 'Dữ liệu có ý nghĩa',
    description: 'Nắm bắt lượt đăng ký, tỷ lệ tham dự và hiệu quả sự kiện bằng dashboard cùng báo cáo trực quan.',
    detail: 'Ra quyết định tốt hơn từ số liệu thực tế',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
];

function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Tự giới thiệu lần lượt từng chức năng; khi người dùng đang tương tác thì dừng lại
  // để nội dung không đổi giữa lúc họ đọc hoặc điều hướng bằng bàn phím.
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FEATURES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeIndex, paused]);

  const activeFeature = FEATURES[activeIndex];

  return (
    <div
      className="mt-9 w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div role="tablist" aria-label="Các chức năng nổi bật" className="mx-auto grid w-full max-w-xl grid-cols-3 gap-3">
        {FEATURES.map((feature, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={feature.title}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="feature-description"
              onClick={() => setActiveIndex(index)}
              className={`group relative min-h-[126px] overflow-hidden rounded-2xl border p-4 text-left transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 ${
                active
                  ? '-translate-y-1 border-indigo-300 bg-white shadow-[0_20px_40px_-18px_rgba(79,70,229,.45)]'
                  : 'border-white/90 bg-white/60 shadow-[0_10px_28px_-20px_rgba(79,70,229,.3)] hover:-translate-y-1 hover:border-indigo-200 hover:bg-white/90 hover:shadow-lg'
              }`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-black transition-all duration-300 ${active ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25' : 'bg-indigo-50 text-indigo-600 group-hover:scale-105'}`}>
                  {feature.number}
                </span>
                <span className={`grid h-8 w-8 place-items-center rounded-xl transition-all duration-300 ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                  {feature.icon}
                </span>
              </span>
              <span className={`mt-4 block text-[13px] font-extrabold leading-5 transition-colors sm:text-sm ${active ? 'text-indigo-700' : 'text-slate-700'}`}>
                {feature.title}
              </span>
              {active && !paused && <span key={activeIndex} className="feature-progress absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-400" />}
            </button>
          );
        })}
      </div>

      <div id="feature-description" role="tabpanel" aria-live="polite" className="mx-auto mt-4 min-h-[116px] w-full max-w-xl rounded-2xl border border-white/90 bg-white/65 p-5 text-left shadow-[0_14px_34px_-22px_rgba(30,64,175,.4)] backdrop-blur-md">
        <div key={activeFeature.title} className="feature-content-enter flex gap-4">
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            {activeFeature.icon}
          </span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-indigo-600">{activeFeature.eyebrow}</p>
            <p className="mt-1.5 text-sm font-medium leading-6 text-slate-600">{activeFeature.description}</p>
            <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
              {activeFeature.detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-slate-50 to-sky-100 p-0 sm:p-4 lg:p-6">
      <div aria-hidden="true" className="animate-drift-soft absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-indigo-300/45 blur-3xl" />
      <div aria-hidden="true" className="animate-float-soft absolute -bottom-56 -right-32 h-[38rem] w-[38rem] rounded-full bg-sky-300/45 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1440px] overflow-hidden border border-white/90 bg-gradient-to-br from-[#f8faff] via-[#edf2ff] to-[#e4f5ff] shadow-[0_32px_90px_-32px_rgba(49,46,129,.35)] backdrop-blur-xl sm:min-h-[calc(100vh-2rem)] sm:rounded-[20px] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.15fr_.85fr]">
        <div aria-hidden="true" className="absolute inset-0 opacity-[.22] [background-image:linear-gradient(rgba(99,102,241,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,.13)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div aria-hidden="true" className="animate-float-soft absolute -right-20 top-0 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl" />
        <div aria-hidden="true" className="animate-drift-soft absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-300/35 blur-3xl" />

        <section className="relative hidden overflow-hidden p-10 text-slate-900 lg:flex lg:flex-col xl:p-14">

          <div className="group relative flex w-fit items-center gap-3 rounded-2xl p-1 transition-transform duration-300 hover:translate-x-1">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-105 group-hover:shadow-xl">Q</span>
            <div>
              <p className="text-sm font-black tracking-[.025em] text-slate-900 xl:text-base">QUẢN LÝ SỰ KIỆN VÀ ĐIỂM DANH</p>
              <p className="text-xs font-medium text-slate-500">Nền tảng quản lý tập trung</p>
            </div>
          </div>

          <div className="relative my-auto flex max-w-2xl flex-col items-center py-8 text-center">
            <span className="mb-6 inline-flex rounded-full border border-indigo-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur">Không gian quản lý tập trung</span>
            <h1 className="text-balance max-w-[620px] text-[40px] font-black leading-[1.08] tracking-[-0.045em] text-slate-950 xl:text-[52px]">Mỗi sự kiện, một trải nghiệm đáng nhớ.</h1>
            <p className="mt-5 max-w-xl text-[15px] font-medium leading-7 text-slate-600 xl:text-base">Từ khâu lập kế hoạch đến lúc đón khách, mọi thao tác đều liền mạch, rõ ràng và dễ kiểm soát.</p>

            <FeatureShowcase />
          </div>

          <p className="relative text-center text-xs font-semibold text-slate-500">Một nền tảng thống nhất cho toàn bộ hành trình sự kiện.</p>
        </section>

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-10 lg:px-10 xl:px-16">
          <div className="surface-glass w-full max-w-[470px] animate-rise rounded-[20px] p-7 shadow-[0_24px_70px_-30px_rgba(79,70,229,.4)] sm:p-9">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-500/25">Q</span>
              <div>
                <p className="text-sm font-black leading-tight text-slate-900">QUẢN LÝ SỰ KIỆN</p>
                <p className="text-xs font-bold text-indigo-600">VÀ ĐIỂM DANH</p>
              </div>
            </div>
            <div className="mb-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Chào mừng trở lại</p>
              <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-[34px]">Đăng nhập tài khoản</h2>
              <p className="mt-2.5 text-sm leading-6 text-slate-500">Nhập thông tin của bạn để tiếp tục quản lý sự kiện.</p>
            </div>
            <LoginForm />
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>Quản lý sự kiện và điểm danh · An toàn</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
