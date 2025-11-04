import { useEffect, useState } from 'react';
import { App, Col, Divider, Form, Input, Modal, Row, Select } from 'antd';
import type { FormProps } from 'antd';
import { updateCategoryAPI, getCategoryAPI } from '@/services/api';

interface IProps {
    openModalUpdate: boolean;
    setOpenModalUpdate: (v: boolean) => void;
    refreshTable: () => void;
    dataUpdate: ICategory | null;
    setDataUpdate: (v: ICategory | null) => void;
}

type FieldType = {
    _id: string;
    name: string;
    parentCategory?: string;
};

const UpdateCategory = (props: IProps) => {
    const { openModalUpdate, setOpenModalUpdate, refreshTable, dataUpdate, setDataUpdate } = props;
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();
    const [isSubmit, setIsSubmit] = useState(false);
    const [categories, setCategories] = useState<ICategory[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await getCategoryAPI();
            if (res && res.data) setCategories(res.data.result ?? []);
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (dataUpdate) {
            form.setFieldsValue({
                _id: dataUpdate._id,
                name: dataUpdate.name,
                parentCategory: dataUpdate.parentCategory?._id || null,
            });
        }
    }, [dataUpdate]);

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true);
        const res = await updateCategoryAPI(values._id, values.name, values.parentCategory || null);
        if (res && res.data) {
            message.success('Cập nhật danh mục thành công');
            form.resetFields();
            setDataUpdate(null);
            setOpenModalUpdate(false);
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
            title="Cập nhật Danh mục"
            open={openModalUpdate}
            onOk={() => form.submit()}
            onCancel={() => {
                form.resetFields();
                setDataUpdate(null);
                setOpenModalUpdate(false);
            }}
            destroyOnClose
            okButtonProps={{ loading: isSubmit }}
            okText="Cập nhật"
            cancelText="Hủy"
            width="50vw"
            maskClosable={false}
        >
            <Divider />
            <Form form={form} name="form-update-category" onFinish={onFinish} autoComplete="off">
                <Row gutter={15}>
                    <Form.Item<FieldType> name="_id" hidden>
                        <Input />
                    </Form.Item>

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
                            label="Danh mục cha"
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

export default UpdateCategory;
