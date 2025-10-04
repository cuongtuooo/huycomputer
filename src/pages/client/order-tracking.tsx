import { useEffect, useState } from 'react';
import { App, Badge, Button, Card, Divider, Empty, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import {  cancelMyOrderAPI, confirmOrderReceivedAPI, getOrdersAPI } from '@/services/api';
import { FORMATE_DATE_VN } from '@/services/helper';

type OrderStatus = 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'RECEIVED' | 'CANCELED';
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
};
type APIOrder = Partial<IOrderTable> & {
    status?: OrderStatus;
    detail?: OrderItem[];
    createdAt?: string;
    totalPrice?: number;
    _id?: string;
};


const money = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function OrderTrackingPage() {
    const { message, notification } = App.useApp();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    
    const refresh = async () => {
        setLoading(true);
        const res = await getOrdersAPI('current=1&pageSize=50&sort=-createdAt');
        // axios.customize trả thẳng response.data của server:
        // { statusCode, message, data: { meta, result } }
        // 👉 THÊM 3 DÒNG NÀY ĐỂ SOI PAYLOAD

        // payload thực tế của bạn là: { meta, result }
        const raw: APIOrder[] = (res?.data?.result ?? []) as APIOrder[];

        const list: Order[] = raw.map((o) => ({
            _id: String(o._id ?? ''),
            createdAt: o.createdAt ?? '',
            totalPrice: Number(o.totalPrice ?? 0),
            status: (o.status as OrderStatus) ?? 'PENDING',
            detail: (o.detail as OrderItem[]) ?? [],
        }));

        console.log("check list order tracking", list);


        setOrders(list);
        setLoading(false);
        
    };

    useEffect(() => { refresh(); }, []);

    const cancelOrder = async (o: Order) => {
        const res = await cancelMyOrderAPI(o._id);
        if (res?.data) {
            message.success('Đã hủy đơn hàng');
            setOrders(prev => prev.map(x => x._id === o._id ? { ...x, status: 'CANCELED' } : x));
        } else {
            notification.error({ message: 'Hủy đơn thất bại', description: res?.message });
        }
    };

    const confirmReceived = async (o: Order) => {
        const res = await confirmOrderReceivedAPI(o._id);
        if (res?.data) {
            message.success('Cảm ơn bạn đã xác nhận đã nhận hàng!');
            setOrders(prev => prev.map(x => x._id === o._id ? { ...x, status: 'RECEIVED' } : x));
        } else {
            notification.error({ message: 'Xác nhận thất bại', description: res?.message });
        }
    };

    if (!loading && !orders.length) {
        return (
            <div style={{ maxWidth: 960, margin: '30px auto', padding: '0 16px' }}>
                <Empty description="Chưa có đơn hàng nào" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 960, margin: '30px auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Theo dõi đơn hàng</h3>
                <Button onClick={refresh} loading={loading}>Tải lại</Button>
            </div>
            <Divider style={{ margin: '12px 0 16px' }} />
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {orders.map((o) => {
                    const allowCancel = o.status === 'PENDING';
                    const allowConfirmReceived = o.status === 'DELIVERED';
                    return (
                        <Card key={o._id} bodyStyle={{ padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <Space wrap>
                                    <Badge status="processing" />
                                    <strong>Đơn hàng #{o._id.slice(-6).toUpperCase()}</strong>
                                    <span>•</span>
                                    <span>Ngày tạo: {dayjs(o.createdAt).format(FORMATE_DATE_VN)}</span>
                                </Space>
                                <Tag color={statusColor[o.status]} style={{ fontWeight: 600 }}>
                                    {o.status === 'PENDING' && 'Chờ duyệt'}
                                    {o.status === 'SHIPPING' && 'Đang giao hàng'}
                                    {o.status === 'DELIVERED' && 'Đã giao tới'}
                                    {o.status === 'RECEIVED' && 'Đã nhận hàng'}
                                    {o.status === 'CANCELED' && 'Đã hủy'}
                                </Tag>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            <Space direction="vertical" style={{ width: '100%' }}>
                                {o.detail?.map((it, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        fontSize: 13
                                    }}>
                                        <div style={{ opacity: .9 }}>
                                            • {it.productName} <span style={{ opacity: .7 }}>x {it.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </Space>

                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ opacity: .8 }}>Tổng tiền</div>
                                <div style={{ fontWeight: 700 }}>{money(o.totalPrice)}</div>
                            </div>

                            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                {allowCancel && (
                                    <Button danger onClick={() => cancelOrder(o)}>Hủy đơn</Button>
                                )}
                                {allowConfirmReceived && (
                                    <Button type="primary" onClick={() => confirmReceived(o)}>Đã nhận hàng</Button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </Space>
        </div>
    );
}
