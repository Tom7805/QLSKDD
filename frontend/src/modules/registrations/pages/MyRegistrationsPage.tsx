import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Pagination from '../../../components/common/Pagination';
import { useToast } from '../../../components/common/Toast';
import { cancelRegistration, getMyRegistrations } from '../registrationsApi';
import type { MyRegistration, RegistrationsPage } from '../registrationsTypes';

const PAGE_SIZE = 10;
const EMPTY_PAGE: RegistrationsPage = { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true };

const readPage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
};

export default function MyRegistrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams.get('page'));
  const { showToast } = useToast();
  const [result, setResult] = useState<RegistrationsPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingRegistration, setPendingRegistration] = useState<MyRegistration | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.resolve(getMyRegistrations(page, PAGE_SIZE))
      .then((data) => {
        if (!active) return;
        setResult(data ?? EMPTY_PAGE);
        if ((data?.totalPages ?? 0) > 0 && page >= (data?.totalPages ?? 0)) {
          setSearchParams({ page: String(data?.totalPages ?? 0) }, { replace: true });
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message
          : undefined;
        setError(message ?? 'Không thể tải danh sách đăng ký của bạn.');
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [page, reloadKey, setSearchParams]);

  const handleCancel = async () => {
    if (!pendingRegistration || cancelling) return;

    setCancelling(true);
    try {
      await Promise.resolve(cancelRegistration(pendingRegistration.registrationId));
      showToast('Đã huỷ đăng ký', 'success');
      setPendingRegistration(null);
      setReloadKey((key) => key + 1);
    } catch (requestError) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      showToast(message ?? 'Không thể huỷ đăng ký', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const changePage = (nextPage: number) => {
    setSearchParams(nextPage === 0 ? {} : { page: String(nextPage + 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <p className="text-sm font-semibold text-blue-600">Đăng ký</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Sự kiện của tôi</h1>
          <p className="mt-2 text-sm text-slate-500">Theo dõi các sự kiện bạn đã đăng ký và huỷ đăng ký khi cần.</p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
            <p className="font-medium text-red-700">{error}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-semibold text-blue-700">
              Thử lại
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4" aria-label="Đang tải danh sách đăng ký">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : result.content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">Bạn chưa đăng ký sự kiện nào</p>
            <p className="mt-1 text-sm text-slate-500">Danh sách các sự kiện bạn tham gia sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {result.content.map((item) => (
                <article key={item.registrationId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{item.eventName}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {item.registrationStatus === 'CANCELLED' ? 'Đã huỷ' : 'Đang hoạt động'}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <p className="font-medium text-slate-500">Địa điểm</p>
                          <p className="mt-1">{item.location}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-500">Thời gian</p>
                          <p className="mt-1">{formatDateTime(item.startAt)} — {formatDateTime(item.endAt)}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">Đăng ký lúc: {formatDateTime(item.registeredAt)}</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-[12rem]">
                      {item.canCancel ? (
                        <button
                          type="button"
                          onClick={() => setPendingRegistration(item)}
                          className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Huỷ đăng ký
                        </button>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm text-slate-500">
                          Không thể huỷ
                        </div>
                      )}
                      <p className="text-center text-xs text-slate-500">Mã đăng ký: {item.code}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8">
              <Pagination page={page} totalPages={result.totalPages} onChange={changePage} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingRegistration !== null}
        title="Huỷ đăng ký"
        message={`Huỷ đăng ký sự kiện '${pendingRegistration?.eventName ?? ''}'? Chỗ của bạn sẽ được nhường lại.`}
        confirmLabel="Huỷ đăng ký"
        cancelLabel="Không"
        onConfirm={handleCancel}
        onCancel={() => setPendingRegistration(null)}
        loading={cancelling}
      />
    </div>
  );
}
