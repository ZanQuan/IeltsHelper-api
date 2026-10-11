import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';

type Status = 'checking' | 'Paid' | 'Failed' | 'Pending' | 'Error';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // VNPay quay về kèm các tham số vnp_*
        if (params.get('vnp_TxnRef')) {
          const res = await apiClient.get<{ status: Status }>('/api/Payments/vnpay-return', {
            params: Object.fromEntries(params),
          });
          if (!cancelled) setStatus(res.data.status);
          return;
        }

        // MoMo quay về kèm orderId. IPN có thể đến chậm vài giây nên hỏi lại nhiều lần
        const ref = params.get('orderId');
        if (!ref) { if (!cancelled) setStatus('Error'); return; }

        for (let i = 0; i < 10 && !cancelled; i++) {
          const res = await apiClient.get<{ status: Status }>(`/api/Payments/status/${ref}`);
          if (res.data.status !== 'Pending') {
            if (!cancelled) setStatus(res.data.status);
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
        if (!cancelled) setStatus('Pending');
      } catch {
        if (!cancelled) setStatus('Error');
      }
    }

    check();
    return () => { cancelled = true; };
  }, [params]);

  return (
    <div className="card text-center">
      {status === 'checking' && <p className="muted">Đang xác nhận thanh toán...</p>}

      {status === 'Paid' && (
        <>
          <h2>Thanh toán thành công 🎉</h2>
          <p className="muted">Bạn đã được ghi danh vào khóa học.</p>
          <Link to="/courses" className="btn btn-primary">Vào khóa học</Link>
        </>
      )}

      {status === 'Failed' && (
        <>
          <h2>Thanh toán không thành công</h2>
          <p className="muted">Giao dịch đã bị hủy hoặc bị từ chối.</p>
          <Link to="/courses" className="btn btn-ghost">Quay lại khóa học</Link>
        </>
      )}

      {status === 'Pending' && (
        <>
          <h2>Giao dịch đang được xử lý</h2>
          <p className="muted">Vui lòng kiểm tra lại mục Khóa học sau ít phút.</p>
          <Link to="/courses" className="btn btn-ghost">Về khóa học</Link>
        </>
      )}

      {status === 'Error' && (
        <>
          <h2>Chưa xác nhận được giao dịch</h2>
          <p className="muted">
            Nếu tài khoản ngân hàng hoặc ví của bạn đã bị trừ tiền, khóa học sẽ được mở sau khi hệ thống
            nhận được kết quả. Hãy kiểm tra lại mục Khóa học sau ít phút hoặc liên hệ hỗ trợ.
          </p>
          <Link to="/courses" className="btn btn-ghost">Về khóa học</Link>
        </>
      )}
    </div>
  );
}