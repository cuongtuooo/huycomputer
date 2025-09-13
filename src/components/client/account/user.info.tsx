import { useCurrentApp } from "@/components/context/app.context";
import { AntDesignOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Avatar, Button, Col, Form, Input, Row, Upload } from "antd";
import { useEffect, useState } from "react";
import type { FormProps } from 'antd';
import { UploadChangeParam } from 'antd/es/upload';
import { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import { updateUserInfoAPI, uploadFileAPI } from "@/services/api";
import type { UploadFile } from 'antd';

type FieldType = {
    _id: string;
    email: string;
    name: string;
    phone: string;
    role:string;
    avatar: string;
};
const UserInfo = () => {
    const [form] = Form.useForm();
    const { user, setUser } = useCurrentApp();

    console.log("check user từ userinfo: ", user)

    const [userAvatar, setUserAvatar] = useState(user?.avatar ?? "");
    const [isSubmit, setIsSubmit] = useState(false);
    const { message, notification } = App.useApp();

    const urlAvatar = `${import.meta.env.VITE_BACKEND_URL}/images/avatar/${userAvatar}`;

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                _id: user._id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                // @ts-ignore
                role: user.role._id
            })
        }
    }, [user])

    console.log("check cái form ", form.getFieldsValue())

    const handleUploadFile = async (options: RcCustomRequestOptions) => {
        const { onSuccess } = options;
        const file = options.file as UploadFile;
        const res = await uploadFileAPI(file, "avatar");

        if (res && res.data) {
            const newAvatar = res.data.fileName;
            setUserAvatar(newAvatar);

            if (onSuccess)
                onSuccess('ok')
        } else {
            message.error(res.message)
        }
    };

    const propsUpload = {
        maxCount: 1,
        multiple: false,
        showUploadList: false,
        customRequest: handleUploadFile,
        onChange(info: UploadChangeParam) {
            if (info.file.status !== 'uploading') {
            }
            if (info.file.status === 'done') {
                message.success(`Upload file thành công`);
            } else if (info.file.status === 'error') {
                message.error(`Upload file thất bại`);
            }
        },
    };

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        const { name, phone, _id,  role, email, avatar } = values;
        console.log(" check valude",values)
        setIsSubmit(true)
        const res = await updateUserInfoAPI(_id, avatar, email, name, phone, role);

        console.log("check ress", res.data?.role)
        if (res && res.data) {
            //update react context
            setUser({
                ...user!,
                avatar: userAvatar,
                name,
                phone
            })
            message.success("Cập nhật thông tin user thành công");

            //force renew token
            localStorage.removeItem('access_token');
        } else {
            notification.error({
                message: "Đã có lỗi xảy ra",
                description: res.message
            })
        }
        setIsSubmit(false)
    }

    return (
        <div style={{ minHeight: 400 }}>
            <Row>
                <Col sm={24} md={12}>
                    <Row gutter={[30, 30]}>
                        <Col span={24}>
                            <Avatar
                                size={{ xs: 32, sm: 64, md: 80, lg: 128, xl: 160, xxl: 200 }}
                                icon={<AntDesignOutlined />}
                                src={urlAvatar}
                                shape="circle"
                            />
                        </Col>
                        <Col span={24}>
                            <Upload {...propsUpload}>
                                <Button icon={<UploadOutlined />}>
                                    Upload Avatar
                                </Button>
                            </Upload>
                        </Col>
                    </Row>
                </Col>
                <Col sm={24} md={12}>
                    <Form
                        onFinish={onFinish}
                        form={form}
                        name="user-info"
                        autoComplete="off"
                    >
                        <Form.Item<FieldType>
                            hidden
                            labelCol={{ span: 24 }}
                            label="_id"
                            name="_id"
                        >
                            <Input disabled hidden />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'Email không được để trống!' }]}
                        >
                            <Input  />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Tên hiển thị"
                            name="name"
                            rules={[{ required: true, message: 'Tên hiển thị không được để trống!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Số điện thoại"
                            name="phone"
                            rules={[{ required: true, message: 'Số điện thoại không được để trống!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="RRole"
                            name="role"
                            rules={[{ required: true, message: 'role thoại không được để trống!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Button loading={isSubmit} onClick={() => form.submit()}>Cập nhật</Button>
                    </Form>
                </Col>
            </Row>
        </div>
    )
}

export default UserInfo;
