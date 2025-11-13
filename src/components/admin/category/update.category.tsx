import { useEffect, useState } from 'react';
import { App, Col, Divider, Form, Input, Modal, Row, Select } from 'antd';
import type { FormProps } from 'antd';
import { updateCategoryAPI, getCategoryTreeAPI } from '@/services/api';

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
    parentCategory?: string | null;
};

const UpdateCategory = (props: IProps) => {
    const { openModalUpdate, setOpenModalUpdate, refreshTable, dataUpdate, setDataUpdate } = props;
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();
    const [isSubmit, setIsSubmit] = useState(false);
    const [categories, setCategories] = useState<ICategory[]>([]);

    /* ===========================
       LOAD DANH MỤC CHO COMBOBOX
    ============================ */
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getCategoryTreeAPI();
                const treeData = res?.data?.result || res?.data;

                // ✅ Hàm đệ quy: chỉ lấy danh mục cha (những node có children)
                const extractParents = (nodes: any[]): any[] => {
                    const parents: any[] = [];
                    nodes.forEach((node) => {
                        // Nếu node có con => là cha
                        if (node.children && node.children.length > 0) {
                            parents.push({ _id: node._id, name: node.name });
                            // Gọi tiếp đệ quy để tìm cha cấp sâu hơn
                            parents.push(...extractParents(node.children));
                        }
                    });
                    return parents;
                };

                const parentCategories = extractParents(treeData);
                setCategories(parentCategories);
            } catch (error) {
                console.error('❌ Lỗi tải danh mục:', error);
            }
        };
        fetchCategories();
    }, []);


    /* ===========================
       SET GIÁ TRỊ MẶC ĐỊNH KHI MỞ MODAL
    ============================ */
    useEffect(() => {
        if (dataUpdate) {
            form.setFieldsValue({
                _id: dataUpdate._id,
                name: dataUpdate.name,
                parentCategory: dataUpdate.parentCategory?._id || null,
            });
        }
    }, [dataUpdate, form]);

    /* ===========================
       SUBMIT FORM
    ============================ */
    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        try {
            setIsSubmit(true);

            // Nếu chọn chính nó làm cha thì chặn
            if (values._id === values.parentCategory) {
                message.error('Không thể chọn chính danh mục này làm danh mục cha!');
                setIsSubmit(false);
                return;
            }

            const res = await updateCategoryAPI(
                values._id,
                values.name,
                values.parentCategory || null
            );

            if (res && res.data) {
                message.success('Cập nhật danh mục thành công');
                form.resetFields();
                setDataUpdate(null);
                setOpenModalUpdate(false);
                refreshTable();
            } else {
                notification.error({
                    message: 'Đã có lỗi xảy ra',
                    description: res?.message || 'Không thể cập nhật danh mục',
                });
            }
        } catch (error: any) {
            notification.error({
                message: 'Lỗi hệ thống',
                description: error?.message || 'Không thể cập nhật danh mục',
            });
        } finally {
            setIsSubmit(false);
        }
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
                    {/* ẨN ID */}
                    <Form.Item<FieldType> name="_id" hidden>
                        <Input />
                    </Form.Item>

                    {/* TÊN DANH MỤC */}
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

                    {/* DANH MỤC CHA */}
                    <Col span={12}>
                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Danh mục cha (tuỳ chọn)"
                            name="parentCategory"
                        >
                            <Select
                                allowClear
                                placeholder="Chọn danh mục cha (nếu có)"
                                showSearch
                                optionFilterProp="children"
                            >
                                {categories
                                    .filter((cat) => cat._id !== dataUpdate?._id) // không cho chọn chính nó
                                    .map((cat) => (
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
