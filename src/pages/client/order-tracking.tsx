import { useEffect, useState } from 'react';
import { App, Badge, Button, Card, Divider, Empty, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { cancelMyOrderAPI, confirmOrderReceivedAPI, getOrdersAPI, requestReturnAPI } from '@/services/api';
import { FORMATE_DATE_VN } from '@/services/helper';

type OrderStatus = 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'RECEIVED' | 'CANCELED' | 'RETURNED' | 'RETURN_RECEIVED';
type OrderItem = { _id: string; quantity: number; productName: string };
type Order = {
    _id: string;
    createdAt: string;
    totalPrice: number;
    status: OrderStatus;
    detail: OrderItem[];
};

const statusColor: Record<OrderStatus, string> = {
    PENDING: 'orange',
    SHIPPING: 'blue',
    DELIVERED: 'geekblue',
    RECEIVED: 'green',
    CANCELED: 'red',
    RETURNED: 'magenta',
    RETURN_RECEIVED: 'purple',
};

const money = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function OrderTrackingPage() {
    const { message, notification } = App.useApp();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<'ALL' | OrderStatus>('ALL');

    const requestReturn = async (o: Order) => {
        const res = await requestReturnAPI(o._id);
        if (res?.data) {
            message.success('Yêu cầu hoàn hàng thành công');
            setOrders(prev => prev.map(x => x._id === o._id ? { ...x, status: 'RETURNED' } : x));
        } else {
            notification.error({ message: 'Hoàn hàng thất bại', description: res?.message });
        }
    };

    const refresh = async () => {
        setLoading(true);
        try {
            const res = await getOrdersAPI('current=1&pageSize=100&sort=-createdAt');
            const raw = (res?.data?.result ?? []) as any[];
            const list: Order[] = raw.map((o) => ({
                _id: String(o._id ?? ''),
                createdAt: o.createdAt ?? '',
                totalPrice: Number(o.totalPrice ?? 0),
                status: o.status ?? 'PENDING',
                detail: o.detail ?? [],
            }));
            setOrders(list);
        } catch (err: any) {
            notification.error({ message: 'Lỗi tải đơn hàng', description: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const cancelOrder = async (o: Order) => {
        const res = await cancelMyOrderAPI(o._id);
        if (res?.data) {
            message.success('Đã hủy đơn hàng');
            setOrders((prev) => prev.map((x) => (x._id === o._id ? { ...x, status: 'CANCELED' } : x)));
        } else {
            notification.error({ message: 'Hủy đơn thất bại', description: res?.message });
        }
    };

    const confirmReceived = async (o: Order) => {
        const res = await confirmOrderReceivedAPI(o._id);
        if (res?.data) {
            message.success('Cảm ơn bạn đã xác nhận!');
            setOrders((prev) => prev.map((x) => (x._id === o._id ? { ...x, status: 'RECEIVED' } : x)));
        } else {
            notification.error({ message: 'Xác nhận thất bại', description: res?.message });
        }
    };

    const filteredOrders =
        filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

    // ⬇ Giao diện phần return như ở trên
    return (
        <div style={{ maxWidth: 960, margin: '30px auto', padding: '0 16px' }}>
            <h3 style={{ marginBottom: 12 }}>Đơn hàng của tôi</h3>

            {/* Thanh filter trạng thái */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    marginBottom: 20,
                    background: '#fff',
                    borderRadius: 6,
                    padding: '10px 0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflowX: 'auto',
                }}
            >
                {[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'PENDING', label: 'Chờ xác nhận' },
                    { key: 'SHIPPING', label: 'Đang giao hàng' },
                    { key: 'DELIVERED', label: 'Đã giao' },
                    { key: 'RECEIVED', label: 'Đã nhận hàng' },
                    { key: 'CANCELED', label: 'Đã hủy' },
                    { key: 'RETURNED', label: 'Trả hàng' },
                ].map((tab) => (
                    <Button
                        key={tab.key}
                        type={filter === tab.key ? 'primary' : 'text'}
                        onClick={() => setFilter(tab.key as any)}
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            {/* Danh sách đơn hàng */}
            {!loading && filteredOrders.length === 0 ? (
                <Empty description="Không có đơn hàng nào" />
            ) : (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    {filteredOrders.map((o) => {
                        const allowCancel = o.status === 'PENDING';
                        const allowConfirmReceived = o.status === 'DELIVERED';
                        return (
                            <Card key={o._id} bodyStyle={{ padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                    <Space>
                                        <Badge status="processing" />
                                        <strong>Đơn #{o._id.slice(-6).toUpperCase()}</strong>
                                        <span>• {dayjs(o.createdAt).format(FORMATE_DATE_VN)}</span>
                                    </Space>
                                    <Tag color={statusColor[o.status]} style={{ fontWeight: 600 }}>
                                        {o.status === 'PENDING' && 'Chờ xác nhận'}
                                        {o.status === 'SHIPPING' && 'Đang giao hàng'}
                                        {o.status === 'DELIVERED' && 'Đã giao tới'}
                                        {o.status === 'RECEIVED' && 'Đã nhận hàng'}
                                        {o.status === 'CANCELED' && 'Đã hủy'}
                                        {o.status === 'RETURNED' && 'Trả hàng'}
                                    </Tag>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {o.detail?.map((it, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <div style={{ opacity: 0.9 }}>
                                                • {it.productName} <span style={{ opacity: 0.7 }}>x {it.quantity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </Space>

                                <Divider style={{ margin: '12px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ opacity: 0.8 }}>Tổng tiền</div>
                                    <div style={{ fontWeight: 700 }}>{money(o.totalPrice)}</div>
                                </div>

                                <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    {allowCancel && <Button danger onClick={() => cancelOrder(o)}>Hủy đơn</Button>}
                                    {o.status === 'DELIVERED' && (
                                        <>
                                            <Button type="primary" onClick={() => confirmReceived(o)}>Đã nhận hàng</Button>
                                            <Button onClick={() => requestReturn(o)}>Hoàn hàng</Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </Space>
            )}
        </div>
    );
}
