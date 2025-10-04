import { getOrdersAPI, adminUpdateOrderStatusAPI } from '@/services/api';
import { dateRangeValidate } from '@/services/helper';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Drawer, Space, Tag, Typography, Divider } from 'antd';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Text } = Typography;

type OrderStatus = 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'RECEIVED' | 'CANCELED';

const statusColor: Record<OrderStatus, string> = {
    PENDING: 'orange',
    SHIPPING: 'blue',
    DELIVERED: 'geekblue',
    RECEIVED: 'green',
    CANCELED: 'red',
};

const statusLabel: Record<OrderStatus, string> = {
    PENDING: 'Chờ duyệt',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao tới',
    RECEIVED: 'Đã nhận hàng',
    CANCELED: 'Đã hủy',
};

type TSearch = {
    name?: string;
    status?: OrderStatus;
    createdAtRange?: string[];
};

const TableOrder = () => {
    const actionRef = useRef<ActionType>();
    const lastParamsRef = useRef<any>({});
    const lastSortRef = useRef<any>({});

    const { message, modal } = App.useApp();
    const [exporting, setExporting] = useState(false);

    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    });

    const [openDetail, setOpenDetail] = useState(false);
    const [current, setCurrent] = useState<IOrderTable | null>(null);

    /** Build query tái sử dụng cho request & export */
    const buildQuery = (
        params: any,
        sort: any,
        override?: { current?: number; pageSize?: number }
    ) => {
        let query = '';
        const current = override?.current ?? params?.current ?? 1;
        const pageSize = override?.pageSize ?? params?.pageSize ?? 10;
        query += `current=${current}&pageSize=${pageSize}`;

        if (params?.name) query += `&name=/${params.name}/i`;
        if (params?.status) query += `&status=${params.status}`;

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

    const handleAdminUpdate = async (
        record: IOrderTable,
        next: 'SHIPPING' | 'DELIVERED'
    ) => {
        modal.confirm({
            title:
                next === 'SHIPPING'
                    ? 'Xác nhận chuyển sang ĐANG GIAO?'
                    : 'Xác nhận chuyển sang ĐÃ GIAO?',
            content:
                next === 'SHIPPING'
                    ? 'Sau khi chuyển ĐANG GIAO, khách sẽ không thể hủy đơn.'
                    : 'Sau khi chuyển ĐÃ GIAO, khách có thể bấm "Đã nhận hàng".',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                const res = await adminUpdateOrderStatusAPI(record._id, next);
                if (res?.data) {
                    message.success('Cập nhật trạng thái thành công');
                    actionRef.current?.reload();
                }
            },
        });
    };

    /** Export theo bộ lọc/sort hiện tại */
    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const query = buildQuery(lastParamsRef.current, lastSortRef.current, {
                current: 1,
                pageSize: 5000, // xuất tối đa 5000 dòng
            });
            const res = await getOrdersAPI(query);
            const rows = (res?.data?.result || []) as IOrderTable[];

            const data = rows.map((r) => ({
                'Mã đơn': r._id,
                'Họ tên': r.name,
                'Địa chỉ': r.address,
                'SĐT': r.phone,
                'Hình thức': r.type,
                'Trạng thái': statusLabel[(r.status as OrderStatus) ?? 'PENDING'] ?? r.status,
                'Tổng tiền (VND)': r.totalPrice ?? 0,
                'Ngày tạo': dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                'Sản phẩm': (r.detail || [])
                    .map((d: any) => `${d.productName} x ${d.quantity}`)
                    .join(' | '),
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, 'Orders');
            XLSX.writeFile(wb, `orders_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
        } finally {
            setExporting(false);
        }
    };

    const columns: ProColumns<IOrderTable>[] = [
        {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 52,
        },
        {
            title: 'Mã đơn',
            dataIndex: '_id',
            hideInSearch: true,
            render: (_, entity) => <Text copyable>{entity._id}</Text>,
        },
        {
            title: 'Họ tên',
            dataIndex: 'name',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            hideInSearch: true,
            ellipsis: true,
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            hideInSearch: true,
        },
        {
            title: 'Hình thức',
            dataIndex: 'type',
            hideInSearch: true, // COD / BANKING
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            valueType: 'select',
            fieldProps: { allowClear: true },
            valueEnum: {
                PENDING: { text: 'Chờ duyệt' },
                SHIPPING: { text: 'Đang giao hàng' },
                DELIVERED: { text: 'Đã giao tới' },
                RECEIVED: { text: 'Đã nhận hàng' },
                CANCELED: { text: 'Đã hủy' },
            },
            render: (_, r) => (
                <Tag color={statusColor[r.status as OrderStatus]} style={{ fontWeight: 600 }}>
                    {r.status === 'PENDING' && 'Chờ duyệt'}
                    {r.status === 'SHIPPING' && 'Đang giao hàng'}
                    {r.status === 'DELIVERED' && 'Đã giao tới'}
                    {r.status === 'RECEIVED' && 'Đã nhận hàng'}
                    {r.status === 'CANCELED' && 'Đã hủy'}
                </Tag>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            hideInSearch: true,
            sorter: true,
            render: (_, entity) => (
                <>
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                    }).format(entity.totalPrice || 0)}
                </>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            valueType: 'date',
            sorter: true,
            hideInSearch: true,
        },
        {
            title: 'Khoảng ngày',
            dataIndex: 'createdAtRange',
            valueType: 'dateRange',
            hideInTable: true,
            search: {
                transform: (value) => ({
                    createdAtRange: value,
                }),
            },
        },
        {
            title: 'Thao tác',
            valueType: 'option',
            key: 'option',
            render: (_, record) => {
                const s = record.status as OrderStatus;
                const canShip = s === 'PENDING';
                const canDelivered = s === 'SHIPPING';
                return (
                    <Space>
                        <Button size="small" onClick={() => (setOpenDetail(true), setCurrent(record))}>
                            Xem
                        </Button>
                        <Button
                            size="small"
                            disabled={!canShip}
                            onClick={() => handleAdminUpdate(record, 'SHIPPING')}
                        >
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
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <ProTable<IOrderTable, TSearch>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                rowKey="_id"
                headerTitle="Quản lý đơn hàng"
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
                    // lưu lại tham số hiện tại để dùng khi export
                    lastParamsRef.current = params;
                    lastSortRef.current = sort;

                    const query = buildQuery(params, sort);
                    const res = await getOrdersAPI(query);
                    const m = res?.data?.meta;
                    const rows = res?.data?.result || [];

                    if (m) setMeta(m);

                    return {
                        data: rows,
                        success: true,
                        total: m?.total || 0,
                    };
                }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    showSizeChanger: true,
                    total: meta.total,
                    showTotal: (total, range) => (
                        <div>
                            {range[0]}–{range[1]} trên {total} rows
                        </div>
                    ),
                }}
            />

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
                                <Text type="secondary">Hình thức:</Text> <Tag>{current.type}</Tag>
                            </div>
                            <div>
                                <Text type="secondary">Trạng thái:</Text>{' '}
                                <Tag color={statusColor[current.status as OrderStatus]} style={{ fontWeight: 600 }}>
                                    {current.status === 'PENDING' && 'Chờ duyệt'}
                                    {current.status === 'SHIPPING' && 'Đang giao hàng'}
                                    {current.status === 'DELIVERED' && 'Đã giao tới'}
                                    {current.status === 'RECEIVED' && 'Đã nhận hàng'}
                                    {current.status === 'CANCELED' && 'Đã hủy'}
                                </Tag>
                            </div>
                            <div>
                                <Text type="secondary">Ngày tạo:</Text>{' '}
                                <Text>{new Date(current.createdAt).toLocaleString('vi-VN')}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Tổng tiền:</Text>{' '}
                                <Text strong>
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                    }).format(current.totalPrice || 0)}
                                </Text>
                            </div>
                        </Space>

                        <Divider />

                        <div style={{ marginBottom: 8, fontWeight: 600 }}>Sản phẩm</div>
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
