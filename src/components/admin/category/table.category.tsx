import { useRef, useState } from 'react';
import { Popconfirm, Button, App, Tag } from 'antd';
import { DeleteTwoTone, EditTwoTone, ExportOutlined, PlusOutlined, FolderOpenTwoTone } from '@ant-design/icons';
import { CSVLink } from 'react-csv';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { dateRangeValidate } from '@/services/helper';
import { deleteCategoryAPI, getCategoriesAPI } from '@/services/api';
import CreateCategory from './create.category';
import UpdateCategory from './update.category';

type TSearch = {
    name: string;
    createdAtRange: string;
};

const TableCategory = () => {
    const actionRef = useRef<ActionType>();
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 5,
        pages: 0,
        total: 0,
    });

    const [openModalCreate, setOpenModalCreate] = useState<boolean>(false);
    const [openModalUpdate, setOpenModalUpdate] = useState<boolean>(false);
    const [dataUpdate, setDataUpdate] = useState<ICategory | null>(null);
    const [currentDataTable, setCurrentDataTable] = useState<ICategory[]>([]);
    const [isDeleteCategory, setIsDeleteCategory] = useState<boolean>(false);
    const { message, notification } = App.useApp();

    const handleDeleteCategory = async (_id: string) => {
        setIsDeleteCategory(true);
        const res = await deleteCategoryAPI(_id);
        if (res && res.data) {
            message.success('Xóa danh mục thành công');
            refreshTable();
        } else {
            notification.error({
                message: 'Đã có lỗi xảy ra',
                description: res.message,
            });
        }
        setIsDeleteCategory(false);
    };

    const refreshTable = () => {
        actionRef.current?.reload();
    };

    const columns: ProColumns<ICategory>[] = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            sorter: true,
            render: (_, record) => (
                <>
                    <FolderOpenTwoTone twoToneColor="#1677ff" />{' '}
                    <strong>{record.name}</strong>
                </>
            ),
        },
        {
            title: 'Danh mục cha',
            dataIndex: ['parentCategory', 'name'],
            render: (_, record) =>
                record.parentCategory ? (
                    <Tag color="blue">{record.parentCategory.name}</Tag>
                ) : (
                    <Tag color="green">Gốc</Tag>
                ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            sorter: true,
            hideInSearch: true,
        },
        {
            title: 'Ngày cập nhật',
            dataIndex: 'updatedAt',
            valueType: 'dateTime',
            sorter: true,
            hideInSearch: true,
        },
        {
            title: 'Hành động',
            hideInSearch: true,
            render: (_, record) => (
                <>
                    <EditTwoTone
                        twoToneColor="#f57800"
                        style={{ cursor: 'pointer', marginRight: 12 }}
                        onClick={() => {
                            setOpenModalUpdate(true);
                            setDataUpdate(record);
                        }}
                    />
                    <Popconfirm
                        placement="leftTop"
                        title="Xác nhận xóa danh mục"
                        description="Bạn có chắc chắn muốn xóa danh mục này?"
                        onConfirm={() => handleDeleteCategory(record._id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        okButtonProps={{ loading: isDeleteCategory }}
                    >
                        <DeleteTwoTone twoToneColor="#ff4d4f" style={{ cursor: 'pointer' }} />
                    </Popconfirm>
                </>
            ),
        },
    ];

    return (
        <>
            <ProTable<ICategory, TSearch>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                request={async (params, sort) => {
                    let query = `current=${params.current}&pageSize=${params.pageSize}`;
                    if (params.name) query += `&name=/${params.name}/i`;
                    const range = dateRangeValidate(params.createdAtRange);
                    if (range) query += `&createdAt>=${range[0]}&createdAt<=${range[1]}`;
                    if (sort && sort.createdAt)
                        query += `&sort=${sort.createdAt === 'ascend' ? 'createdAt' : '-createdAt'}`;
                    else query += '&sort=-createdAt';

                    const res = await getCategoriesAPI(query);
                    if (res.data) {
                        setMeta(res.data.meta);
                        setCurrentDataTable(res.data.result ?? []);
                    }
                    return {
                        data: res.data?.result,
                        page: 1,
                        success: true,
                        total: res.data?.meta.total,
                    };
                }}
                rowKey="_id"
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
                headerTitle="Quản lý Danh mục"
                toolBarRender={() => [
                    <CSVLink key="export" data={currentDataTable} filename="export-category.csv">
                        <Button icon={<ExportOutlined />} type="primary">
                            Xuất CSV
                        </Button>
                    </CSVLink>,
                    <Button
                        key="add"
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={() => setOpenModalCreate(true)}
                    >
                        Thêm mới
                    </Button>,
                ]}
            />

            <CreateCategory
                openModalCreate={openModalCreate}
                setOpenModalCreate={setOpenModalCreate}
                refreshTable={refreshTable}
            />
            <UpdateCategory
                openModalUpdate={openModalUpdate}
                setOpenModalUpdate={setOpenModalUpdate}
                refreshTable={refreshTable}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />
        </>
    );
};

export default TableCategory;
