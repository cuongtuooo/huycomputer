import { useEffect, useState } from 'react';
import {
    App,
    Col, Divider, Form, Input,
     Modal, Row,
} from 'antd';
import type { FormProps } from 'antd';
import { updateCategoryAPI} from '@/services/api';


interface IProps {
    openModalUpdate: boolean;
    setOpenModalUpdate: (v: boolean) => void;
    refreshTable: () => void;
    dataUpdate: ICategory| null;
    setDataUpdate: (v: ICategory | null) => void;
}

type FieldType = {
    _id: string;
    name:string;
};

const UpdateProduct = (props: IProps) => {
    const {
        openModalUpdate, setOpenModalUpdate, refreshTable,
        dataUpdate, setDataUpdate
    } = props;
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();

    const [isSubmit, setIsSubmit] = useState(false);

    useEffect(() => {
        if (dataUpdate) {
         

            form.setFieldsValue({
                _id: dataUpdate._id,
                name: dataUpdate.name,
                
            })
        }
    }, [dataUpdate])


    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true)

        const { _id, name} = values;


        const res = await updateCategoryAPI(
            _id,
            name,
        );
        if (res && res.data) {
            message.success('Cập nhật Product thành công');
            form.resetFields();
            setDataUpdate(null);
            setOpenModalUpdate(false);
            refreshTable();
        } else {
            notification.error({
                message: 'Đã có lỗi xảy ra',
                description: res.message
            })
        }

        setIsSubmit(false)
    };

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    return (
        <>

            <Modal
                title="Cập nhật Product"
                open={openModalUpdate}
                onOk={() => { form.submit() }}
                onCancel={() => {
                    form.resetFields();
                    setDataUpdate(null);
                    setOpenModalUpdate(false);
                }}
                destroyOnClose={true}
                okButtonProps={{ loading: isSubmit }}
                okText={"Cập nhật"}
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
                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="_id"
                            name="_id"
                            hidden
                        >
                            <Input />
                        </Form.Item>

                        <Col span={12}>
                            <Form.Item<FieldType>
                                labelCol={{ span: 24 }}
                                label="Tên Danh mục"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập Tên Danh mục' }]}
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

export default UpdateProduct;