import { useEffect, useMemo, useRef, useState } from 'react';
import {
    App, Col, Divider, Form, Image, Input,
    InputNumber, Modal, Row, Select, Upload
} from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { createProductAPI, getCategoryAPI, uploadFileAPI } from '@/services/api';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { MAX_UPLOAD_IMAGE_SIZE } from '@/services/helper';
import { UploadChangeParam } from 'antd/es/upload';
import { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';

// === NEW: Editor ===
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

type UserUploadType = 'thumbnail' | 'slider';

interface IProps {
    openModalCreate: boolean;
    setOpenModalCreate: (v: boolean) => void;
    refreshTable: () => void;
}

type FieldType = {
    name: string;
    mainText: string;   // HTML từ editor
    desc: string;       // HTML từ editor
    price: number;
    category: string;
    quantity: number;
    thumbnail: any;
    slider: any;
};

const CreateProduct = (props: IProps) => {
    const { openModalCreate, setOpenModalCreate, refreshTable } = props;
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();

    const [isSubmit, setIsSubmit] = useState(false);

    const [listCategory, setListCategory] = useState<{ label: string; value: string }[]>([]);

    const [loadingThumbnail, setLoadingThumbnail] = useState<boolean>(false);
    const [loadingSlider, setLoadingSlider] = useState<boolean>(false);

    const [previewOpen, setPreviewOpen] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string>('');

    const [fileListThumbnail, setFileListThumbnail] = useState<UploadFile[]>([]);
    const [fileListSlider, setFileListSlider] = useState<UploadFile[]>([]);

    // === NEW: refs cho 2 editor + upload ảnh trong editor
    const quillMainRef = useRef<any>(null);
    const quillDescRef = useRef<any>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [activeQuill, setActiveQuill] = useState<any>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

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

    // === NEW: cấu hình toolbar + handler ảnh
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
        'color', 'background', 'list', 'bullet', 'align',
        'link', 'image', 'clean'
    ];

    const onEditorImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // reset để lần sau chọn cùng file vẫn nhận
        if (!file) return;
        if (!file.type.startsWith('image/')) return message.error('Chỉ chọn tệp ảnh!');
        if (file.size / 1024 / 1024 > MAX_UPLOAD_IMAGE_SIZE)
            return message.error(`Ảnh phải nhỏ hơn ${MAX_UPLOAD_IMAGE_SIZE}MB`);

        setUploadingImage(true);
        try {
            const res = await uploadFileAPI(file as any, 'Product');
            const fileName = res?.data?.fileName;
            if (!fileName) {
                message.error('Upload ảnh thất bại');
                return;
            }
            const url = `${import.meta.env.VITE_BACKEND_URL}/images/Product/${fileName}`;
            const editor = activeQuill?.getEditor?.();
            if (editor) {
                const range = editor.getSelection(true);
                editor.insertEmbed(range.index, 'image', url, 'user');
                editor.setSelection(range.index + 1);
            }
        } finally {
            setUploadingImage(false);
        }
    };

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true);
        const { name, mainText, desc, price, quantity, category } = values;

        const thumbnail = fileListThumbnail?.[0]?.name ?? '';
        const slider = fileListSlider?.map((item) => item.name) ?? [];

        const res = await createProductAPI(
            name,
            mainText,  // HTML
            desc,      // HTML
            price,
            quantity,
            category,
            thumbnail,
            slider
        );
        if (res && res.data) {
            message.success('Tạo mới Product thành công');
            form.resetFields();
            setFileListSlider([]);
            setFileListThumbnail([]);
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

    const getBase64 = (file: FileType): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const beforeUpload = (file: FileType) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) message.error('Chỉ chấp nhận JPG/PNG!');
        const isLtMax = file.size / 1024 / 1024 < MAX_UPLOAD_IMAGE_SIZE;
        if (!isLtMax) message.error(`Ảnh < ${MAX_UPLOAD_IMAGE_SIZE}MB!`);
        return (isJpgOrPng && isLtMax) || Upload.LIST_IGNORE;
    };

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleRemove = async (file: UploadFile, type: UserUploadType) => {
        if (type === 'thumbnail') setFileListThumbnail([]);
        if (type === 'slider') {
            const newSlider = fileListSlider.filter((x) => x.uid !== file.uid);
            setFileListSlider(newSlider);
        }
    };

    const handleChange = (info: UploadChangeParam, type: UserUploadType) => {
        if (info.file.status === 'uploading') {
            type === 'slider' ? setLoadingSlider(true) : setLoadingThumbnail(true);
            return;
        }
        if (info.file.status === 'done') {
            type === 'slider' ? setLoadingSlider(false) : setLoadingThumbnail(false);
        }
    };

    const handleUploadFile = async (options: RcCustomRequestOptions, type: UserUploadType) => {
        const { onSuccess } = options;
        const file = options.file as UploadFile;
        const res = await uploadFileAPI(file as any, 'Product');
        if (res && res.data) {
            const uploadedFile: any = {
                uid: (file as any).uid,
                name: res.data.fileName,
                status: 'done',
                url: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${res.data.fileName}`,
            };
            if (type === 'thumbnail') {
                setFileListThumbnail([{ ...uploadedFile }]);
            } else {
                setFileListSlider((prev) => [...prev, { ...uploadedFile }]);
            }
            onSuccess?.('ok');
        } else {
            message.error(res.message);
        }
    };

    const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList);

    return (
        <>
            {/* input ẩn để tải ảnh cho editor */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onEditorImageChange}
            />

            <Modal
                title="Thêm mới Product"
                open={openModalCreate}
                onOk={() => form.submit()}
                onCancel={() => {
                    form.resetFields();
                    setFileListSlider([]);
                    setFileListThumbnail([]);
                    setOpenModalCreate(false);
                }}
                destroyOnClose
                okButtonProps={{ loading: isSubmit }}
                okText="Tạo mới"
                cancelText="Hủy"
                confirmLoading={isSubmit}
                width="50vw"
                maskClosable={false}
            >
                <Divider />

                <Form form={form} name="form-create-Product" onFinish={onFinish} autoComplete="off" layout="vertical">
                    <Row gutter={15}>
                        <Col span={12}>
                            <Form.Item<FieldType>
                                label="Tên sản phẩm"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>

                        {/* === NEW: Editor cho Nội dung sản phẩm === */}
                        <Col span={12}>
                            <Form.Item<FieldType>
                                label="Nội dung sản phẩm"
                                name="mainText"
                                rules={[{ required: true, message: 'Vui lòng nhập Nội dung sản phẩm' }]}
                                valuePropName="value"
                            >
                                <ReactQuill
                                    ref={quillMainRef}
                                    theme="snow"
                                    modules={quillModulesMain}
                                    formats={quillFormats}
                                    placeholder="Nhập nội dung..."
                                />
                            </Form.Item>
                        </Col>

                        {/* === NEW: Editor cho Mô tả chi tiết === */}
                        <Col span={24}>
                            <Form.Item<FieldType>
                                label="Mô tả chi tiết sản phẩm"
                                name="desc"
                                rules={[{ required: true, message: 'Vui lòng nhập Mô tả' }]}
                                valuePropName="value"
                            >
                                <ReactQuill
                                    ref={quillDescRef}
                                    theme="snow"
                                    modules={quillModulesDesc}
                                    formats={quillFormats}
                                    placeholder="Nhập mô tả chi tiết..."
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item<FieldType>
                                label="Giá tiền"
                                name="price"
                                rules={[{ required: true, message: 'Vui lòng nhập giá tiền!' }]}
                            >
                                <InputNumber
                                    min={1}
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    addonAfter=" đ"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item<FieldType>
                                label="Thể loại"
                                name="category"
                                rules={[{ required: true, message: 'Vui lòng chọn thể loại!' }]}
                            >
                                <Select showSearch allowClear options={listCategory} />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item<FieldType>
                                label="Số lượng"
                                name="quantity"
                                rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item<FieldType>
                                label="Ảnh Thumbnail"
                                name="thumbnail"
                                rules={[{ required: true, message: 'Vui lòng upload thumbnail!' }]}
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                            >
                                <Upload
                                    listType="picture-card"
                                    className="avatar-uploader"
                                    maxCount={1}
                                    multiple={false}
                                    customRequest={(options) => handleUploadFile(options, 'thumbnail')}
                                    beforeUpload={beforeUpload}
                                    onChange={(info) => handleChange(info, 'thumbnail')}
                                    onPreview={handlePreview}
                                    onRemove={(file) => handleRemove(file, 'thumbnail')}
                                    fileList={fileListThumbnail}
                                >
                                    <div>
                                        {loadingThumbnail ? <LoadingOutlined /> : <PlusOutlined />}
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                </Upload>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item<FieldType>
                                label="Ảnh Slider"
                                name="slider"
                                rules={[{ required: true, message: 'Vui lòng upload slider!' }]}
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                            >
                                <Upload
                                    multiple
                                    listType="picture-card"
                                    className="avatar-uploader"
                                    customRequest={(options) => handleUploadFile(options, 'slider')}
                                    beforeUpload={beforeUpload}
                                    onChange={(info) => handleChange(info, 'slider')}
                                    onPreview={handlePreview}
                                    onRemove={(file) => handleRemove(file, 'slider')}
                                    fileList={fileListSlider}
                                >
                                    <div>
                                        {loadingSlider ? <LoadingOutlined /> : <PlusOutlined />}
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                {previewImage && (
                    <Image
                        wrapperStyle={{ display: 'none' }}
                        preview={{
                            visible: previewOpen,
                            onVisibleChange: (visible) => setPreviewOpen(visible),
                            afterOpenChange: (visible) => !visible && setPreviewImage(''),
                        }}
                        src={previewImage}
                    />
                )}
            </Modal>
        </>
    );
};

export default CreateProduct;
