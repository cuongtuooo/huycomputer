import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getPermissionsAPI, createPermissionAPI, updatePermissionAPI, deletePermissionAPI } from "@/services/api";
import PermissionRoleManager from "./permissionRoleManager";

interface IPermission {
    _id: string;
    name: string;
    apiPath: string;
    method: string;
    module: string;
}

const PermissionPage = () => {
    const [data, setData] = useState<IPermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingItem, setEditingItem] = useState<IPermission | null>(null);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        const res = await getPermissionsAPI("current=1&pageSize=50");
        setData(res?.data?.result || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        if (editingItem) {
            await updatePermissionAPI(editingItem._id, values);
            message.success("Cập nhật thành công!");
        } else {
            await createPermissionAPI(values);
            message.success("Tạo mới thành công!");
        }
        setOpenModal(false);
        fetchData();
    };

    const handleDelete = async (id: string) => {
        await deletePermissionAPI(id);
        message.success("Đã xóa quyền!");
        fetchData();
    };

    const columns: ColumnsType<IPermission> = [
        { title: "Tên quyền", dataIndex: "name" },
        { title: "API Path", dataIndex: "apiPath" },
        { title: "Phương thức", dataIndex: "method" },
        { title: "Module", dataIndex: "module" },
        {
            title: "Hành động",
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingItem(record);
                            form.setFieldsValue(record);
                            setOpenModal(true);
                        }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xác nhận xóa?"
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <Button type="link" danger>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Phân quyền Role - Permission</h2>
            <PermissionRoleManager />
            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    onClick={() => {
                        setEditingItem(null);
                        form.resetFields();
                        setOpenModal(true);
                    }}
                >
                    + Thêm quyền
                </Button>
            </Space>

            <Table
                loading={loading}
                dataSource={data}
                columns={columns}
                rowKey="_id"
                pagination={false}
            />

            <Modal
                open={openModal}
                title={editingItem ? "Cập nhật Permission" : "Thêm Permission"}
                onCancel={() => setOpenModal(false)}
                onOk={handleSubmit}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form layout="vertical" form={form}>
                    <Form.Item label="Tên quyền" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="API Path" name="apiPath" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Phương thức" name="method" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { value: "GET", label: "GET" },
                                { value: "POST", label: "POST" },
                                { value: "PATCH", label: "PATCH" },
                                { value: "DELETE", label: "DELETE" },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Module" name="module" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PermissionPage;
