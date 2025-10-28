import {
    getOrdersAPI,
    adminUpdateOrderStatusAPI,
    adminApproveReturnAPI,
    adminRejectReturnAPI,
    adminReturnReceivedAPI,
} from '@/services/api';
import { dateRangeValidate } from '@/services/helper';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
    App,
    Button,
    Drawer,
    Space,
    Tag,
    Typography,
    Divider,
    Tabs,
} from 'antd';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    Ban,
    RotateCcw,
    RefreshCcw,
    ClipboardList,
} from 'lucide-react';

const { Text } = Typography;

type OrderStatus =
    | 'PENDING'
    | 'SHIPPING'
    | 'DELIVERED'
    | 'RECEIVED'
    | 'RETURN_REQUESTED'
    | 'RETURNED'
    | 'RETURN_RECEIVED'
    | 'RETURN_REJECTED'
    | 'CANCELED';

const statusColor: Record<OrderStatus, string> = {
    PENDING: 'orange',
    SHIPPING: 'blue',
    DELIVERED: 'geekblue',
    RECEIVED: 'green',
    RETURN_REQUESTED: 'gold',
    RETURNED: 'magenta',
    RETURN_RECEIVED: 'purple',
    RETURN_REJECTED: 'volcano',
    CANCELED: 'red',
};

const statusLabel: Record<OrderStatus, string> = {
    PENDING: 'Chờ xác nhận',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao',
    RECEIVED: 'Đã nhận hàng',
    RETURN_REQUESTED: 'Yêu cầu hoàn hàng',
    RETURNED: 'Đang hoàn hàng',
    RETURN_RECEIVED: 'Đã nhận hoàn',
    RETURN_REJECTED: 'Từ chối hoàn hàng',
    CANCELED: 'Đã hủy',
};

const TableOrder = () => {
    const actionRef = useRef<ActionType>();
    const lastParamsRef = useRef<any>({});
    const lastSortRef = useRef<any>({});
    const { message, modal } = App.useApp();

    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [openDetail, setOpenDetail] = useState(false);
    const [current, setCurrent] = useState<IOrderTable | null>(null);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    });

    // -------------------- Build query --------------------
    const buildQuery = (
        params: any,
        sort: any,
        override?: { current?: number; pageSize?: number }
    ) => {
        let query = '';
        const current = override?.current ?? params?.current ?? 1;
        const pageSize = override?.pageSize ?? params?.pageSize ?? 10;
        query += `current=${current}&pageSize=${pageSize}`;
        if (activeTab !== 'ALL') query += `&status=${activeTab}`;
        if (params?.name) query += `&name=/${params.name}/i`;
        const range = dateRangeValidate(params?.createdAtRange as any);
        if (range) query += `&createdAt>=${range[0]}&createdAt<=${range[1]}`;
        if (sort && sort.createdAt) {
            query += `&sort=${sort.createdAt === 'ascend' ? 'createdAt' : '-createdAt'}`;
        } else if (sort && sort.totalPrice) {
            query += `&sort=${sort.totalPrice === 'ascend' ? 'totalPrice' : '-totalPrice'}`;
        } else {
            query += `&sort=-createdAt`;
        }
        return query;
    };

    // -------------------- Admin Update --------------------
    const handleAdminUpdate = async (
        record: IOrderTable,
        next: 'SHIPPING' | 'DELIVERED' | 'RETURN_RECEIVED'
    ) => {
        let title = '';
        let content = '';
        if (next === 'SHIPPING') {
            title = 'Chuyển sang ĐANG GIAO?';
            content = 'Khách sẽ không thể hủy đơn sau bước này.';
        } else if (next === 'DELIVERED') {
            title = 'Chuyển sang ĐÃ GIAO?';
            content = 'Khách có thể bấm "Đã nhận hàng" hoặc "Hoàn hàng".';
        } else if (next === 'RETURN_RECEIVED') {
            title = 'Xác nhận đã nhận hàng hoàn?';
            content = 'Trạng thái sẽ chuyển sang "Đã nhận hoàn".';
        }

        modal.confirm({
            title,
            content,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                const api =
                    next === 'RETURN_RECEIVED'
                        ? adminReturnReceivedAPI(record._id)
                        : adminUpdateOrderStatusAPI(record._id, next);
                const res = await api;
                if (res?.data) {
                    message.success('Cập nhật trạng thái thành công');
                    actionRef.current?.reload();
                }
            },
        });
    };

    const handleApproveReturn = async (record: IOrderTable) => {
        const res = await adminApproveReturnAPI(record._id);
        if (res?.data) {
            message.success('Đã chấp nhận hoàn hàng');
            actionRef.current?.reload();
        }
    };

    const handleRejectReturn = async (record: IOrderTable) => {
        const res = await adminRejectReturnAPI(record._id);
        if (res?.data) {
            message.success('Đã từ chối hoàn hàng');
            actionRef.current?.reload();
        }
    };

    // -------------------- Export Excel --------------------
    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const query = buildQuery(lastParamsRef.current, lastSortRef.current, {
                current: 1,
                pageSize: 5000,
            });
            const res = await getOrdersAPI(query);
            const rows = (res?.data?.result || []) as IOrderTable[];

            const data = rows.map((r) => ({
                'Mã đơn': r._id,
                'Khách hàng': r.name,
                'SĐT': r.phone,
                'Địa chỉ': r.address,
                'Trạng thái': statusLabel[r.status as OrderStatus],
                'Tổng tiền': r.totalPrice,
                'Ngày tạo': dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, 'Orders');
            XLSX.writeFile(wb, `orders_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
        } finally {
            setExporting(false);
        }
    };

    // -------------------- Columns --------------------
    const columns: ProColumns<IOrderTable>[] = [
        { dataIndex: 'index', valueType: 'indexBorder', width: 52 },
        { title: 'Mã đơn', dataIndex: '_id', render: (_, e) => <Text copyable>{e._id}</Text> },
        { title: 'Khách hàng', dataIndex: 'name' },
        { title: 'SĐT', dataIndex: 'phone', hideInSearch: true },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (_, r) => (
                <Tag color={statusColor[r.status as OrderStatus]}>{statusLabel[r.status as OrderStatus]}</Tag>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            sorter: true,
            render: (_, e) =>
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(e.totalPrice || 0),
        },
        {
            title: 'Thao tác',
            valueType: 'option',
            key: 'option',
            render: (_, record) => {
                const s = record.status as OrderStatus;
                const canShip = s === 'PENDING';
                const canDelivered = s === 'SHIPPING';
                const canReturnReceived = s === 'RETURNED';
                const canApproveReject = s === 'RETURN_REQUESTED';
                return (
                    <Space>
                        <Button
                            size="small"
                            type="default"
                            onClick={() => {
                                setOpenDetail(true);
                                setCurrent(record);
                            }}
                        >
                            Xem
                        </Button>
                        {canApproveReject && (
                            <>
                                <Button size="small" type="primary" onClick={() => handleApproveReturn(record)}>
                                    Chấp nhận
                                </Button>
                                <Button size="small" danger onClick={() => handleRejectReturn(record)}>
                                    Từ chối
                                </Button>
                            </>
                        )}
                        <Button size="small" disabled={!canShip} onClick={() => handleAdminUpdate(record, 'SHIPPING')}>
                            Giao hàng
                        </Button>
                        <Button
                            size="small"
                            type="primary"
                            disabled={!canDelivered}
                            onClick={() => handleAdminUpdate(record, 'DELIVERED')}
                        >
                            Đã giao
                        </Button>
                        <Button
                            size="small"
                            danger
                            disabled={!canReturnReceived}
                            onClick={() => handleAdminUpdate(record, 'RETURN_RECEIVED')}
                        >
                            Đã nhận hoàn
                        </Button>
                    </Space>
                );
            },
        },
    ];

    // -------------------- Tabs với icon + animation --------------------
    const tabs = [
        { key: 'ALL', label: 'Tất cả', icon: <ClipboardList size={16} /> },
        { key: 'PENDING', label: 'Chờ xác nhận', icon: <Clock size={16} /> },
        { key: 'SHIPPING', label: 'Đang giao hàng', icon: <Truck size={16} /> },
        { key: 'DELIVERED', label: 'Đã giao', icon: <Package size={16} /> },
        { key: 'RECEIVED', label: 'Đã nhận hàng', icon: <CheckCircle2 size={16} /> },
        // { key: 'RETURN_REQUESTED', label: 'Yêu cầu hoàn', icon: <RotateCcw size={16} /> },
        { key: 'RETURNED', label: 'Đang hoàn hàng', icon: <RefreshCcw size={16} /> },
        { key: 'RETURN_RECEIVED', label: 'Đã nhận hoàn', icon: <CheckCircle2 size={16} /> },
        { key: 'CANCELED', label: 'Đã hủy', icon: <Ban size={16} /> },
    ];

    return (
        <>
            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key);
                    actionRef.current?.reload();
                }}
                items={tabs.map((t) => ({
                    key: t.key,
                    label: (
                        <Space>
                            {t.icon}
                            {t.label}
                        </Space>
                    ),
                }))}
                style={{
                    marginBottom: 16,
                }}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <ProTable<IOrderTable>
                        columns={columns}
                        actionRef={actionRef}
                        rowKey="_id"
                        cardBordered
                        headerTitle="Quản lý đơn hàng"
                        params={{ activeTab }}
                        toolBarRender={() => [
                            <Button
                                key="export"
                                icon={<DownloadOutlined />}
                                loading={exporting}
                                onClick={handleExportExcel}
                            >
                                Xuất Excel
                            </Button>,
                        ]}
                        request={async (params, sort) => {
                            lastParamsRef.current = params;
                            lastSortRef.current = sort;
                            const query = buildQuery(params, sort);
                            const res = await getOrdersAPI(query);
                            const m = res?.data?.meta;
                            const rows = res?.data?.result || [];
                            if (m) setMeta(m);
                            return { data: rows, success: true, total: m?.total || 0 };
                        }}
                        pagination={{
                            current: meta.current,
                            pageSize: meta.pageSize,
                            showSizeChanger: true,
                            total: meta.total,
                            showTotal: (total, range) => (
                                <div>
                                    {range[0]}–{range[1]} trên {total} đơn
                                </div>
                            ),
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Drawer chi tiết */}
            <Drawer
                title={`Chi tiết đơn ${current?._id ? '#' + current?._id.slice(-6).toUpperCase() : ''}`}
                open={openDetail}
                width={720}
                onClose={() => {
                    setOpenDetail(false);
                    setCurrent(null);
                }}
            >
                {current && (
                    <>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <div>
                                <Text type="secondary">Khách hàng:</Text> <Text strong>{current.name}</Text>
                            </div>
                            <div>
                                <Text type="secondary">SĐT:</Text> <Text>{current.phone}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Địa chỉ:</Text> <Text>{current.address}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Trạng thái:</Text>{' '}
                                <Tag color={statusColor[current.status as OrderStatus]}>
                                    {statusLabel[current.status as OrderStatus]}
                                </Tag>
                            </div>
                        </Space>
                        <Divider />
                        <div style={{ fontWeight: 600 }}>Sản phẩm</div>
                        {current.detail?.map((it, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0',
                                    borderBottom: '1px dashed #eee',
                                }}
                            >
                                <div>
                                    • {it.productName} <span style={{ opacity: 0.7 }}>x {it.quantity}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </Drawer>
        </>
    );
};

export default TableOrder;
