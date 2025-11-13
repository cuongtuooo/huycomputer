import { useEffect, useState } from 'react';
import { App, Col, Divider, Form, Input, Modal, Row, Select } from 'antd';
import type { FormProps } from 'antd';
import { createCategoryAPI, getCategoryTreeAPI } from '@/services/api';


interface IProps {
    openModalCreate: boolean;
    setOpenModalCreate: (v: boolean) => void;
    refreshTable: () => void;
}

type FieldType = {
    name: string;
    parentCategory?: string;
};

const CreateCategory = (props: IProps) => {
    const { openModalCreate, setOpenModalCreate, refreshTable } = props;
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();
    const [isSubmit, setIsSubmit] = useState(false);
    const [categories, setCategories] = useState<ICategory[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await getCategoryTreeAPI();
            if (res && res.data) {
                // ✅ Dữ liệu đã có sẵn cây cha–con
                setCategories(res.data ?? []);
            }
        };

        fetchCategories();
    }, []);


    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true);
        const res = await createCategoryAPI(values.name, values.parentCategory || null);
        if (res && res.data) {
            message.success('Tạo danh mục thành công');
            form.resetFields();
            setOpenModalCreate(false);
            refreshTable();
        } else {
            notification.error({
                message: 'Đã có lỗi xảy ra',
                description: res.message,
            });
        }
        setIsSubmit(false);
    };

    return (
        <Modal
            title="Thêm mới Danh mục"
            open={openModalCreate}
            onOk={() => form.submit()}
            onCancel={() => {
                form.resetFields();
                setOpenModalCreate(false);
            }}
            destroyOnClose
            okButtonProps={{ loading: isSubmit }}
            okText="Tạo mới"
            cancelText="Hủy"
            width="50vw"
            maskClosable={false}
        >
            <Divider />
            <Form form={form} name="form-create-category" onFinish={onFinish} autoComplete="off">
                <Row gutter={15}>
                    <Col span={12}>
                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Tên danh mục"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Danh mục cha (tuỳ chọn)"
                            name="parentCategory"
                        >
                            <Select allowClear placeholder="Chọn danh mục cha (nếu có)">
                                {categories.map((cat) => (
                                    <Select.Option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default CreateCategory;
