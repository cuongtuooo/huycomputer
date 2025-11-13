import { resetPasswordAPI } from "@/services/api";
import { App, Button, Form, Input, Divider } from "antd";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const [params] = useSearchParams();
    const { message, notification } = App.useApp();
    const navigate = useNavigate();

    const token = params.get("token");

    const onFinish = async (values: any) => {
        if (!token) {
            return notification.error({ message: "Thiếu token!" });
        }
        setIsSubmit(true);
        try {
            const res = await resetPasswordAPI(token, values.newPassword);
            if (res?.data) {
                message.success("Đặt lại mật khẩu thành công!");
                navigate("/login");
            } else {
                notification.error({
                    message: "Không thể đặt lại mật khẩu",
                    description: res?.message || "Đã có lỗi xảy ra.",
                });
            }
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <div className="login-page">
            <main className="main">
                <div className="container">
                    <section className="wrapper">
                        <h2 className="text text-large">Đặt lại mật khẩu</h2>
                        <Divider />
                        <Form onFinish={onFinish}>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Mật khẩu mới"
                                name="newPassword"
                                rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={isSubmit}>
                                    Xác nhận
                                </Button>
                            </Form.Item>
                        </Form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ResetPassword;
