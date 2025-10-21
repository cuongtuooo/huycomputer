import { useCurrentApp } from "@/components/context/app.context";
import { App, Button, Col, Form, Input, Row } from "antd";
import type { FormProps } from "antd";
import { useEffect, useState } from "react";
import { updateUserInfoAPI } from "@/services/api";

type FieldType = {
    _id: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    avatar: string;
};

const ADMIN_ROLE_ID = "6883003aac8a30a7ede53072";

const UserInfo = () => {
    const [form] = Form.useForm();
    const { user, setUser } = useCurrentApp();
    const [isSubmit, setIsSubmit] = useState(false);
    const { message, notification } = App.useApp();

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                _id: user._id,
                email: user.email,
                phone: user.phone ?? "",
                name: user.name,
                role: user.role?.name || user.role, // có thể là object hoặc string
            });
        }
    }, [user]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        const { name, phone, _id, role, email, avatar } = values;
        setIsSubmit(true);
        const res = await updateUserInfoAPI(_id, avatar, email, name, phone, role);

        if (res && res.data) {
            setUser({
                ...user!,
                name,
                phone,
            });
            message.success("Cập nhật thông tin user thành công");
            localStorage.removeItem("access_token");
        } else {
            notification.error({
                message: "Đã có lỗi xảy ra",
                description: res.message,
            });
        }
        setIsSubmit(false);
    };

    // Xác định vai trò hiển thị
    const roleDisplay =
        form.getFieldValue("role") === ADMIN_ROLE_ID ? "Admin" : "Người dùng";

    return (
        <div style={{ minHeight: 400 }}>
            <Row>
                <Col sm={24} md={12}>
                    <Form onFinish={onFinish} form={form} name="user-info" autoComplete="off">
                        <Form.Item<FieldType> hidden name="_id">
                            <Input hidden />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: "Email không được để trống!" }]}
                        >
                            <Input disabled />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Tên hiển thị"
                            name="name"
                            rules={[{ required: true, message: "Tên hiển thị không được để trống!" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Số điện thoại"
                            name="phone"
                            rules={[{ required: true, message: "Số điện thoại không được để trống!" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Vai trò"
                            name="role"
                        >
                            <Input value={roleDisplay} disabled />
                        </Form.Item>

                        <Button type="primary" loading={isSubmit} onClick={() => form.submit()}>
                            Cập nhật
                        </Button>
                    </Form>
                </Col>
            </Row>
        </div>
    );
};

export default UserInfo;
