import { useEffect, useState } from "react";
import { App, Divider, Drawer, Empty, Table, Tag } from "antd";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { FORMATE_DATE_VN } from "@/services/helper";
import { getOrdersAPI } from "@/services/api";
import { useCurrentApp } from "@/components/context/app.context";

type OrderStatus = "PENDING" | "SHIPPING" | "DELIVERED" | "RECEIVED" | "CANCELED";
type IHistoryItem = { _id: string; quantity: number; productName: string };

type IHistory = {
    _id: string;
    createdAt: string;
    totalPrice: number;
    status: OrderStatus;
    detail: IHistoryItem[];
    createdBy?: { _id?: string; email?: string };
};

type APIOrder = Partial<IHistory> & { _id?: string }; // map từ API sang IHistory

const statusColor: Record<OrderStatus, string> = {
    PENDING: "orange",
    SHIPPING: "blue",
    DELIVERED: "geekblue",
    RECEIVED: "green",
    CANCELED: "red",
};

const money = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const HistoryPage = () => {
    const { notification } = App.useApp();
    const { user } = useCurrentApp();

    const [dataHistory, setDataHistory] = useState<IHistory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [openDetail, setOpenDetail] = useState<boolean>(false);
    const [dataDetail, setDataDetail] = useState<IHistory | null>(null);

    const columns: TableProps<IHistory>["columns"] = [
        { title: "STT", dataIndex: "index", key: "index", render: (_, __, index) => index + 1 },
        { title: "Thời gian", dataIndex: "createdAt", render: (v) => dayjs(v).format(FORMATE_DATE_VN) },
        { title: "Tổng số tiền", dataIndex: "totalPrice", render: (v) => money(v) },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (s: OrderStatus) => (
                <Tag color={statusColor[s]} style={{ fontWeight: 600 }}>
                    {s === "PENDING" && "Chờ duyệt"}
                    {s === "SHIPPING" && "Đang giao hàng"}
                    {s === "DELIVERED" && "Đã giao tới"}
                    {s === "RECEIVED" && "Đã nhận hàng"}
                    {s === "CANCELED" && "Đã hủy"}
                </Tag>
            ),
        },
        {
            title: "Chi tiết",
            key: "action",
            render: (_, record) => (
                <a
                    onClick={() => {
                        setOpenDetail(true);
                        setDataDetail(record);
                    }}
                    href="#"
                >
                    Xem chi tiết
                </a>
            ),
        },
    ];

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await getOrdersAPI("current=1&pageSize=100&sort=-createdAt");
                // interceptor của bạn: { statusCode, message, data: { meta, result } }
                const raw = ((res?.data as any)?.result ?? []) as APIOrder[];

                // map về đúng shape IHistory
                const mapped: IHistory[] = raw.map((o) => ({
                    _id: String(o._id ?? ""),
                    createdAt: o.createdAt ?? "",
                    totalPrice: Number(o.totalPrice ?? 0),
                    status: (o.status as OrderStatus) ?? "PENDING",
                    detail: (o.detail as IHistoryItem[]) ?? [],
                    createdBy: o.createdBy,
                }));

                // lọc về đơn của user hiện tại (vì backend đã bỏ /me)
                const mine = user?._id
                    ? mapped.filter((x) => String(x?.createdBy?._id) === String(user._id))
                    : mapped;

                setDataHistory(mine);
            } catch (e: any) {
                notification.error({
                    message: "Đã có lỗi xảy ra",
                    description: e?.message || String(e),
                });
            } finally {
                setLoading(false);
            }
        })();
    }, [user?._id]);

    return (
        <div style={{ margin: 50 }}>
            <h3>Lịch sử mua hàng</h3>
            <Divider />
            {!dataHistory.length && !loading ? <Empty description="Chưa có đơn nào" /> : null}
            <Table bordered columns={columns} dataSource={dataHistory} rowKey={"_id"} loading={loading} />
            <Drawer
                title="Chi tiết đơn hàng"
                onClose={() => {
                    setOpenDetail(false);
                    setDataDetail(null);
                }}
                open={openDetail}
            >
                {dataDetail?.detail?.map((item, index) => (
                    <ul key={index}>
                        <li>Tên sản phẩm: {item.productName}</li>
                        <li>Số lượng: {item.quantity}</li>
                        <Divider />
                    </ul>
                ))}
            </Drawer>
        </div>
    );
};

export default HistoryPage;
