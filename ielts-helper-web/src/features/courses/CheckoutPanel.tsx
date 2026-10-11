import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import './checkout.css';
import vnpayLogo from '@/assets/payment/vnpay.png';
import momoLogo from '@/assets/payment/momo.png';
type Provider = 'VnPay' | 'Momo';

interface Buyer {
    name: string;
    email: string;
}

interface Props {
    course: {
        title: string;
        price: number;
        teacherName: string;
        targetBand: string;
        lessonCount: number;
    };
    paying: boolean;
    error: string;
    onPay: (provider: Provider) => void;
}

const METHODS: { id: Provider; name: string; desc: string; logo: string }[] = [
    {
        id: 'VnPay',
        name: 'VNPay',
        desc: 'Thẻ ATM nội địa, thẻ quốc tế, VNPay-QR',
        logo: vnpayLogo,
    },
    {
        id: 'Momo',
        name: 'Ví MoMo',
        desc: 'Thanh toán nhanh bằng ứng dụng MoMo',
        logo: momoLogo,
    },
];

const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')} đ`;

export default function CheckoutPanel({ course, paying, error, onPay }: Props) {
    const [buyer, setBuyer] = useState<Buyer | null>(null);
    const [selected, setSelected] = useState<Provider>('VnPay');

    useEffect(() => {
        let cancelled = false;
        apiClient
            .get<Buyer>('/api/Auth/me')
            .then((res) => {
                if (!cancelled) setBuyer(res.data);
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, []);

    const method = METHODS.find((m) => m.id === selected)!;

    return (
        <div className="checkout">
            <div className="checkout-main">
                <section className="card checkout-section">
                    <h3>Thông tin người mua</h3>
                    {buyer ? (
                        <div className="checkout-buyer">
                            <span className="checkout-avatar">{buyer.name.charAt(0).toUpperCase()}</span>
                            <div className="checkout-buyer-info">
                                <strong>{buyer.name}</strong>
                                <span>{buyer.email}</span>
                            </div>
                            <Link to="/settings" className="checkout-edit">Chỉnh sửa</Link>
                        </div>
                    ) : (
                        <p className="muted mb-0">Đang tải thông tin...</p>
                    )}
                    <p className="muted checkout-hint">
                        Khóa học sẽ được mở ngay trong tài khoản này sau khi thanh toán thành công.
                    </p>
                </section>

                <section className="card checkout-section">
                    <h3>Phương thức thanh toán</h3>
                    <div className="checkout-methods" role="radiogroup" aria-label="Phương thức thanh toán">
                        {METHODS.map((m) => (
                            <label
                                key={m.id}
                                className={`checkout-method ${selected === m.id ? 'is-selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="payment-method"
                                    value={m.id}
                                    checked={selected === m.id}
                                    onChange={() => setSelected(m.id)}
                                />
                                <span className="checkout-logo">
                                    <img src={m.logo} alt={`Logo ${m.name}`} />
                                </span>
                                <span className="checkout-method-body">
                                    <strong>{m.name}</strong>
                                    <span>{m.desc}</span>
                                </span>
                                <span className="checkout-radio" aria-hidden="true" />
                            </label>
                        ))}
                    </div>
                </section>
            </div>

            <aside className="card checkout-summary">
                <h3>Tóm tắt đơn hàng</h3>
                <p className="checkout-course-title">{course.title}</p>
                <span className="badge badge-primary">Band {course.targetBand}</span>

                <dl className="checkout-rows">
                    <div><dt>Giáo viên</dt><dd>{course.teacherName}</dd></div>
                    <div><dt>Số bài học</dt><dd>{course.lessonCount}</dd></div>
                    <div><dt>Thanh toán qua</dt><dd>{method.name}</dd></div>
                </dl>

                <div className="checkout-total">
                    <span>Tổng thanh toán</span>
                    <strong>{formatVnd(course.price)}</strong>
                </div>

                {error && <p className="error-text">{error}</p>}

                <button
                    className="btn btn-primary btn-full"
                    disabled={paying}
                    onClick={() => onPay(selected)}
                >
                    {paying ? 'Đang chuyển hướng...' : `Thanh toán ${formatVnd(course.price)}`}
                </button>

                <p className="muted checkout-secure">
                    Giao dịch được xử lý bởi {method.name}. Whale English không lưu thông tin thẻ của bạn.
                </p>
            </aside>
        </div>
    );
}