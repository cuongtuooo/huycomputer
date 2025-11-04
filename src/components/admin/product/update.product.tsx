import { useEffect, useMemo, useRef, useState } from 'react';
import {
    App, Col, Divider, Form, Input, InputNumber, Modal, Row, Select, Upload, Space, Button, Image
} from 'antd';
import { LoadingOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { getCategoryAPI, updateProductAPI, uploadFileAPI, getProductByIdAPI } from '@/services/api';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { MAX_UPLOAD_IMAGE_SIZE } from '@/services/helper';
import { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { v4 as uuidv4 } from 'uuid';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
type UserUploadType = 'thumbnail' | 'slider';

interface IProps {
    openModalUpdate: boolean;
    setOpenModalUpdate: (v: boolean) => void;
    refreshTable: () => void;
    dataUpdate: IProductTable | null;
    setDataUpdate: (v: IProductTable | null) => void;
}

type FieldType = {
    _id: string;
    name: string;
    mainText: string;
    desc: string;
    category: string;
    thumbnail: any;
    slider: any;
    variants: {
        versionName: string;
        colors: { color: string; price: number; quantity: number }[];
    }[];
};

const UpdateProduct = (props: IProps) => {
    const { openModalUpdate, setOpenModalUpdate, refreshTable, dataUpdate, setDataUpdate } = props;
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();

    const [isSubmit, setIsSubmit] = useState(false);
    const [listCategory, setListCategory] = useState<{ label: string; value: string }[]>([]);
    const [loadingThumbnail, setLoadingThumbnail] = useState(false);
    const [loadingSlider, setLoadingSlider] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileListThumbnail, setFileListThumbnail] = useState<UploadFile[]>([]);
    const [fileListSlider, setFileListSlider] = useState<UploadFile[]>([]);

    const quillMainRef = useRef<any>(null);
    const quillDescRef = useRef<any>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [activeQuill, setActiveQuill] = useState<any>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            const res = await getCategoryAPI();
            if (res && res.data?.result) {
                const d = res.data.result.map((item: any) => ({
                    label: item.name,
                    value: item._id,
                }));
                setListCategory(d);
            }
        };
        fetchCategory();
    }, []);

    // === Khi mở modal, load lại dữ liệu sản phẩm
    useEffect(() => {
        if (dataUpdate) {
            const fetchProductDetail = async () => {
                const res = await getProductByIdAPI(dataUpdate._id);
                if (res && res.data) {
                    const p = res.data;

                    const thumb = p.thumbnail
                        ? [
                            {
                                uid: uuidv4(),
                                name: p.thumbnail,
                                status: 'done',
                                url: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${p.thumbnail}`,
                            },
                        ]
                        : [];

                    const sliders =
                        p.slider?.map((s: string) => ({
                            uid: uuidv4(),
                            name: s,
                            status: 'done',
                            url: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${s}`,
                        })) ?? [];

                    form.setFieldsValue({
                        _id: p._id,
                        name: p.name,
                        mainText: p.mainText,
                        desc: p.desc,
                        category:
                            typeof p.category === 'object' ? p.category._id : p.category,
                        thumbnail: thumb,
                        slider: sliders,
                        variants: p.variants ?? [],
                    });

                    setFileListThumbnail(thumb);
                    setFileListSlider(sliders);
                }
            };
            fetchProductDetail();
        }
    }, [dataUpdate]);

    // === Tạo toolbar cho editor
    const makeModules = (targetRef: any) => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }],
                ['link', 'image', 'clean'],
            ],
            handlers: {
                image: () => {
                    setActiveQuill(targetRef.current);
                    imageInputRef.current?.click();
                },
            },
        },
    });

    const quillModulesMain = useMemo(() => makeModules(quillMainRef), []);
    const quillModulesDesc = useMemo(() => makeModules(quillDescRef), []);
    const quillFormats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'color', 'background', 'list', 'bullet', 'align', 'link', 'image', 'clean'
    ];

    // === Upload ảnh trong editor
    const onEditorImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) return message.error('Chỉ chọn tệp ảnh!');
        if (file.size / 1024 / 1024 > MAX_UPLOAD_IMAGE_SIZE)
            return message.error(`Ảnh phải nhỏ hơn ${MAX_UPLOAD_IMAGE_SIZE}MB`);
        try {
            const res = await uploadFileAPI(file as any, 'Product');
            const fileName = res?.data?.fileName;
            if (!fileName) return message.error('Upload ảnh thất bại');
            const url = `${import.meta.env.VITE_BACKEND_URL}/images/Product/${fileName}`;
            const editor = activeQuill?.getEditor?.();
            if (editor) {
                const range = editor.getSelection(true);
                editor.insertEmbed(range.index, 'image', url, 'user');
                editor.setSelection(range.index + 1);
            }
        } catch {
            message.error('Upload ảnh lỗi');
        }
    };

    // === Submit cập nhật
    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true);
        const { _id, name, mainText, desc, category, variants } = values;
        const thumbnail = fileListThumbnail?.[0]?.name ?? '';
        const slider = fileListSlider?.map((i) => i.name) ?? [];

        const res = await updateProductAPI(
            _id, name, mainText, desc, 0, 0, category, thumbnail, slider, variants ?? []
        );

        if (res && res.data) {
            message.success('Cập nhật Product thành công');
            form.resetFields();
            setFileListSlider([]);
            setFileListThumbnail([]);
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

    const beforeUpload = (file: FileType) => {
        const ok = ['image/jpeg', 'image/png'].includes(file.type);
        if (!ok) message.error('Chỉ chấp nhận JPG/PNG!');
        const isLt = file.size / 1024 / 1024 < MAX_UPLOAD_IMAGE_SIZE;
        if (!isLt) message.error(`Ảnh < ${MAX_UPLOAD_IMAGE_SIZE}MB!`);
        return (ok && isLt) || Upload.LIST_IGNORE;
    };

    const handleUploadFile = async (options: RcCustomRequestOptions, type: UserUploadType) => {
        const { onSuccess } = options;
        const file = options.file as UploadFile;
        const res = await uploadFileAPI(file as any, 'Product');
        if (res && res.data) {
            const uploadedFile = {
                uid: file.uid,
                name: res.data.fileName,
                status: 'done',
                url: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${res.data.fileName}`,
            };
            if (type === 'thumbnail') setFileListThumbnail([{ ...uploadedFile }]);
            else setFileListSlider((prev) => [...prev, uploadedFile]);
            onSuccess?.('ok');
        } else message.error(res.message);
    };

    return (
        <>
            <input
                ref={imageInputRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={onEditorImageChange}
            />

            <Modal
                title="Cập nhật Product"
                open={openModalUpdate}
                onOk={() => form.submit()}
                onCancel={() => {
                    form.resetFields();
                    setFileListSlider([]); setFileListThumbnail([]);
                    setDataUpdate(null);
                    setOpenModalUpdate(false);
                }}
                destroyOnClose
                okButtonProps={{ loading: isSubmit }}
                okText="Cập nhật"
                cancelText="Hủy"
                width="70vw"
                maskClosable={false}
            >
                <Divider />
                <Form form={form} name="form-update-product" onFinish={onFinish} layout="vertical">
                    <Form.Item name="_id" hidden><Input /></Form.Item>

                    <Row gutter={15}>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên sản phẩm"
                                rules={[{ required: true, message: 'Nhập tên sản phẩm!' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="category" label="Danh mục"
                                rules={[{ required: true, message: 'Chọn danh mục!' }]}>
                                <Select showSearch allowClear options={listCategory} />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item name="mainText" label="Nội dung sản phẩm"
                                rules={[{ required: true, message: 'Nhập nội dung!' }]}>
                                <ReactQuill ref={quillMainRef} theme="snow" modules={quillModulesMain} formats={quillFormats} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="desc" label="Mô tả chi tiết"
                                rules={[{ required: true, message: 'Nhập mô tả chi tiết!' }]}>
                                <ReactQuill ref={quillDescRef} theme="snow" modules={quillModulesDesc} formats={quillFormats} />
                            </Form.Item>
                        </Col>

                        {/* === Ảnh === */}
                        <Col span={12}>
                            <Form.Item label="Ảnh Thumbnail" name="thumbnail"
                                valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                <Upload listType="picture-card" maxCount={1}
                                    customRequest={(opt) => handleUploadFile(opt, 'thumbnail')}
                                    beforeUpload={beforeUpload} fileList={fileListThumbnail}>
                                    <div>{loadingThumbnail ? <LoadingOutlined /> : <PlusOutlined />}<div>Upload</div></div>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Ảnh Slider" name="slider"
                                valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                <Upload multiple listType="picture-card"
                                    customRequest={(opt) => handleUploadFile(opt, 'slider')}
                                    beforeUpload={beforeUpload} fileList={fileListSlider}>
                                    <div>{loadingSlider ? <LoadingOutlined /> : <PlusOutlined />}<div>Upload</div></div>
                                </Upload>
                            </Form.Item>
                        </Col>

                        {/* === Phiên bản sản phẩm === */}
                        <Col span={24}>
                            <Divider orientation="left">Phiên bản sản phẩm</Divider>
                            <Form.List name="variants">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...rest }) => (
                                            <div key={key} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                                <Row gutter={8}>
                                                    <Col span={20}>
                                                        <Form.Item {...rest} name={[name, 'versionName']} label="Tên phiên bản"
                                                            rules={[{ required: true, message: 'Nhập tên phiên bản!' }]}>
                                                            <Input placeholder="VD: i5/8GB/512GB SSD" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={4}>
                                                        <Button danger onClick={() => remove(name)} block>Xóa phiên bản</Button>
                                                    </Col>
                                                </Row>

                                                <Form.List name={[name, 'colors']}>
                                                    {(colorFields, { add: addColor, remove: removeColor }) => (
                                                        <>
                                                            {colorFields.map(({ key: ck, name: cn, ...cRest }) => (
                                                                <Space key={ck} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                                    <Form.Item {...cRest} name={[cn, 'color']} rules={[{ required: true, message: 'Nhập màu!' }]}>
                                                                        <Input placeholder="Màu sắc" />
                                                                    </Form.Item>
                                                                    <Form.Item {...cRest} name={[cn, 'price']} rules={[{ required: true, message: 'Giá!' }]}>
                                                                        <InputNumber placeholder="Giá" min={0} />
                                                                    </Form.Item>
                                                                    <Form.Item {...cRest} name={[cn, 'quantity']} rules={[{ required: true, message: 'Số lượng!' }]}>
                                                                        <InputNumber placeholder="SL" min={0} />
                                                                    </Form.Item>
                                                                    <MinusCircleOutlined onClick={() => removeColor(cn)} />
                                                                </Space>
                                                            ))}
                                                            <Button type="dashed" onClick={() => addColor()} icon={<PlusOutlined />}>
                                                                Thêm màu
                                                            </Button>
                                                        </>
                                                    )}
                                                </Form.List>
                                            </div>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                                            Thêm phiên bản
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </Col>
                    </Row>
                </Form>

                <Image
                    wrapperStyle={{ display: 'none' }}
                    preview={{
                        visible: previewOpen,
                        onVisibleChange: (v) => setPreviewOpen(v),
                        afterOpenChange: (v) => !v && setPreviewImage(''),
                    }}
                    src={previewImage}
                />
            </Modal>
        </>
    );
};

export default UpdateProduct;
