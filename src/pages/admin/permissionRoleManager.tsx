import { useEffect, useState } from "react";
import { Table, Switch, message, Tag } from "antd";
import { getRolesAPI, getPermissionAPI, addPermissionToRoleAPI, removePermissionFromRoleAPI } from "@/services/api";

interface IRole {
    _id: string;
    name: string;
    permissions: { _id: string }[];
}

interface IPermission {
    _id: string;
    name: string;
    apiPath: string;
    method: string;
    module: string;
}

const PermissionRoleManager = () => {
    const [roles, setRoles] = useState<IRole[]>([]);
    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resRole, resPerm] = await Promise.all([getRolesAPI(), getPermissionAPI()]);
            setRoles(resRole.data.result);
            setPermissions(resPerm.data.result);
        } catch (error) {
            message.error("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    /** 🟢 Khi bật/tắt quyền */
    const handleToggle = async (checked: boolean, roleId: string, permissionId: string) => {
        try {
            // 🔄 Cập nhật UI tạm thời trước
            setRoles((prev) =>
                prev.map((role) => {
                    if (role._id === roleId) {
                        let newPerms = checked
                            ? [...role.permissions, { _id: permissionId }]
                            : role.permissions.filter((p) => p._id !== permissionId);
                        return { ...role, permissions: newPerms };
                    }
                    return role;
                })
            );

            // 🔥 Gọi API thật
            if (checked) {
                await addPermissionToRoleAPI(roleId, permissionId);
                message.success("Đã thêm quyền vào Role");
            } else {
                await removePermissionFromRoleAPI(roleId, permissionId);
                message.info("Đã gỡ quyền khỏi Role");
            }
        } catch (error) {
            message.error("Cập nhật quyền thất bại");
        }
    };


    /** 🧱 Tạo cột động cho mỗi role */
    const roleColumns = roles
        .filter((role) => role.name.toUpperCase() !== "ADMIN") // 🧠 Bỏ role ADMIN
        .map((role) => ({
            title: role.name,
            dataIndex: role._id,
            key: role._id,
            render: (_: any, record: IPermission) => {
                const hasPermission = role.permissions.some((p) => p._id === record._id);
                return (
                    <Switch
                        checked={hasPermission}
                        onChange={(checked) => handleToggle(checked, role._id, record._id)}
                    />
                );
            },
        }));


    /** 🧱 Cột mặc định */
    const baseColumns = [
        { title: "Tên quyền", dataIndex: "name", key: "name" },
        {
            title: "API Path",
            dataIndex: "apiPath",
            key: "apiPath",
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Phương thức",
            dataIndex: "method",
            key: "method",
            render: (text: string) => (
                <Tag color={text === "GET" ? "green" : text === "POST" ? "blue" : text === "PATCH" ? "orange" : "red"}>
                    {text}
                </Tag>
            ),
        },
        { title: "Module", dataIndex: "module", key: "module" },
    ];

    return (
        <Table
            loading={loading}
            dataSource={permissions}
            columns={[...baseColumns, ...roleColumns]}
            rowKey="_id"
            bordered
            pagination={false}
            scroll={{ x: "max-content" }}
        />
    );
};

export default PermissionRoleManager;
