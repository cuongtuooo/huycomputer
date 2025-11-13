import { App, Button, Form, Input, Divider } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordAPI } from "@/services/api"; // bạn sẽ thêm API này ở services

const ForgotPassword = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const { message, notification } = App.useApp();
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setIsSubmit(true);
        try {
            const res = await forgotPasswordAPI(values.email);
            if (res?.data) {
                message.success("Vui lòng kiểm tra email để đặt lại mật khẩu!");
                navigate("/login");
            } else {
                notification.error({
                    message: "Lỗi gửi mail",
                    description: res?.message || "Không thể gửi email khôi phục.",
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
                        <h2 className="text text-large">Quên mật khẩu</h2>
                        <Divider />
                        <Form onFinish={onFinish} autoComplete="off">
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Nhập email đã đăng ký"
                                name="email"
                                rules={[
                                    { required: true, message: "Email không được để trống!" },
                                    { type: "email", message: "Email không đúng định dạng!" },
                                ]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={isSubmit}>
                                    Gửi yêu cầu
                                </Button>
                            </Form.Item>
                        </Form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;
