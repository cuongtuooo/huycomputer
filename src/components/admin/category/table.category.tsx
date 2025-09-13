
import { useRef, useState } from 'react';
import { Popconfirm, Button, App } from 'antd';
import { DeleteTwoTone, EditTwoTone, ExportOutlined, PlusOutlined } from '@ant-design/icons';
import { CSVLink } from 'react-csv';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { dateRangeValidate } from '@/services/helper';
import { deleteCategoryAPI, getCategoriesAPI, getCategoryAPI } from '@/services/api';
import CreateCategory from './create.category';
import UpdateCategory from './update.category';



type TSearch = {
    name:string;
    createdAt: string;
    createdAtRange: string;
    updatedAt: string;
    updatedAtRange: string;
}
const TableCategory = () => {

    const actionRef = useRef<ActionType>();
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 5,
        pages: 0,
        total: 0
    });

    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
    const [dataViewDetail, setDataViewDetail] = useState<ICategory | null>(null);

    const [openModalCreate, setOpenModalCreate] = useState<boolean>(false);

    const [currentDataTable, setCurrentDataTable] = useState<ICategory[]>([]);

    const [openModalUpdate, setOpenModalUpdate] = useState<boolean>(false);
    const [dataUpdate, setDataUpdate] = useState<ICategory | null>(null);

    const [isDeleteCategory, setIsDeleteCategory] = useState<boolean>(false);
    const { message, notification } = App.useApp();


    const handleDeleteCategory = async (_id: string) => {
        setIsDeleteCategory(true)
        const res = await deleteCategoryAPI(_id);
        if (res && res.data) {
            message.success('Xóa Category thành công');
            refreshTable();
        } else {
            notification.error({
                message: 'Đã có lỗi xảy ra',
                description: res.message
            })
        }
        setIsDeleteCategory(false)
    }

    const refreshTable = () => {
        actionRef.current?.reload();
    }

    const columns: ProColumns<ICategory>[] = [
        {
            title: 'Id',
            dataIndex: '_id',
            hideInSearch: true,
            render(dom, entity, index, action, schema) {
                return (
                    <a href='#' onClick={() => {
                        setDataViewDetail(entity);
                        setOpenViewDetail(true);
                    }}>{entity._id}</a>
                )
            },

        },
        {
            title: 'Tên Danh mục',
            dataIndex: 'name',
            sorter: true
        },

        {
            title: 'Ngày cập nhật',
            dataIndex: 'updatedAt',
            sorter: true,
            valueType: 'date',
            hideInSearch: true
        },

        {
            title: 'Action',
            hideInSearch: true,
            render(dom, entity, index, action, schema) {
                return (
                    <>
                        <EditTwoTone
                            twoToneColor="#f57800" style={{ cursor: "pointer", margin: "0 10px" }}
                            onClick={() => {
                                setOpenModalUpdate(true);
                                setDataUpdate(entity);
                            }}
                        />

                        <Popconfirm
                            placement="leftTop"
                            title={"Xác nhận xóa Category"}
                            description={"Bạn có chắc chắn muốn xóa Category này ?"}
                            onConfirm={() => handleDeleteCategory(entity._id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ loading: isDeleteCategory }}
                        >
                            <span style={{ cursor: "pointer" }}>
                                <DeleteTwoTone twoToneColor="#ff4d4f" />
                            </span>
                        </Popconfirm>


                    </>

                )
            }
        }
    ];

    return (
        <>
            <ProTable<ICategory, TSearch>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                request={async (params, sort, filter) => {
                    let query = "";
                    if (params) {
                        query += `current=${params.current}&pageSize=${params.pageSize}`
                        if (params.name) {
                            query += `&name=/${params.name}/i`
                        }

                        const createDateRange = dateRangeValidate(params.createdAtRange);
                        if (createDateRange) {
                            query += `&createdAt>=${createDateRange[0]}&createdAt<=${createDateRange[1]}`
                        }

                    }


                    if (sort && sort.createdAt) {
                        query += `&sort=${sort.createdAt === "ascend" ? "createdAt" : "-createdAt"}`
                    } else query += `&sort=-createdAt`;

                    if (sort && sort.name) {
                        query += `&sort=${sort.name === "ascend" ? "name" : "-name"}`
                    }


                    const res = await getCategoriesAPI(query);
                    if (res.data) {
                        setMeta(res.data.meta);
                        setCurrentDataTable(res.data?.result ?? [])
                    }
                    return {
                        data: res.data?.result,
                        page: 1,
                        success: true,
                        total: res.data?.meta.total
                    }

                }}
                rowKey="_id"
                pagination={
                    {
                        current: meta.current,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => { return (<div> {range[0]}-{range[1]} trên {total} rows</div>) }
                    }
                }

                headerTitle="Table Category"
                toolBarRender={() => [
                    <CSVLink
                        data={currentDataTable}
                        filename='export-Category.csv'
                    >
                        <Button
                            icon={<ExportOutlined />}
                            type="primary"
                        >
                            Export
                        </Button>
                    </CSVLink >
                    ,

                    <Button
                        key="button"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setOpenModalCreate(true);
                        }}
                        type="primary"
                    >
                        Add new
                    </Button>
                ]}
            />
{/* 
            < DetailCategory
                openViewDetail={openViewDetail}
                setOpenViewDetail={setOpenViewDetail}
                dataViewDetail={dataViewDetail}
                setDataViewDetail={setDataViewDetail}
            /> */}

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
    )
}


export default TableCategory;
