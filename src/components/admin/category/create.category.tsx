import { useState } from 'react';
import {
    App,
    Col, Divider, Form, Input,
    Modal, Row, 
} from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { createCategoryAPI } from '@/services/api';



interface IProps {
    openModalCreate: boolean;
    setOpenModalCreate: (v: boolean) => void;
    refreshTable: () => void;
}

type FieldType = {
    name: string;
};

const CreateCategory = (props: IProps) => {
    const { openModalCreate, setOpenModalCreate, refreshTable } = props;
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();

    const [isSubmit, setIsSubmit] = useState(false);
    const [previewOpen, setPreviewOpen] = useState<boolean>(false);


    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true)

        const { name } = values;


        const res = await createCategoryAPI(
            name,
        );
        if (res && res.data) {
            message.success('Tạo mới Product thành công');
            form.resetFields();
            setOpenModalCreate(false);
            refreshTable();
        } else {
            notification.error({
                message: 'Đã có lỗi xảy ra',
                description: res.message
            })
        }

        setIsSubmit(false)
    };


    return (
        <>

            <Modal
                title="Thêm mới Category"
                open={openModalCreate}
                onOk={() => { form.submit() }}
                onCancel={() => {
                    form.resetFields();
                    setOpenModalCreate(false);
                }}
                destroyOnClose={true}
                okButtonProps={{ loading: isSubmit }}
                okText={"Tạo mới"}
                cancelText={"Hủy"}
                confirmLoading={isSubmit}
                width={"50vw"}
                maskClosable={false}
            >
                <Divider />

                <Form
                    form={form}
                    name="form-create-Product"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Row gutter={15}>
                        <Col span={12}>
                            <Form.Item<FieldType>
                                labelCol={{ span: 24 }}
                                label="Tên sản danh mục"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>

                    </Row>
                </Form>

            </Modal>
        </>
    );
};

export default CreateCategory;