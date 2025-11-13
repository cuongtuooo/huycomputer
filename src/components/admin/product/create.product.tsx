import { useEffect, useMemo, useRef, useState } from 'react';
import {
    App, Col, Divider, Form, Input,
    InputNumber, Modal, Row, Select, Upload, Space, Button, Image
} from 'antd';
import { LoadingOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { createProductAPI, getCategoryTreeAPI, uploadFileAPI } from '@/services/api';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { MAX_UPLOAD_IMAGE_SIZE } from '@/services/helper';
import { UploadChangeParam } from 'antd/es/upload';
import { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
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

const CreateProduct = (props: IProps) => {
    const { openModalCreate, setOpenModalCreate, refreshTable } = props;
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
    const [uploadingImage, setUploadingImage] = useState(false);

    // === Lấy danh mục
    // Lấy toàn bộ danh mục từ API, chỉ lấy những cái có parentCategory
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const res = await getCategoryTreeAPI();
                const treeData = res?.data?.result || res?.data; // tuỳ backend

                // ✅ Duyệt đệ quy: chỉ lấy danh mục con (có cấp cha)
                const flattenChildren = (node: any): any[] => {
                    if (!node.children || node.children.length === 0) return [];
                    return node.children.flatMap((child: any) => [
                        {
                            label: `${child.name} (${node.name})`, // hiển thị con (tên cha)
                            value: child._id,
                        },
                        ...flattenChildren(child),
                    ]);
                };

                const result: any[] = [];
                treeData.forEach((root: any) => {
                    result.push(...flattenChildren(root));
                });

                setListCategory(result);
            } catch (error) {
                console.error('❌ Lỗi tải danh mục:', error);
            }
        };
        fetchCategory();
    }, []);


    // === Toolbar editor có nút upload ảnh
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
        setUploadingImage(true);
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
        } finally {
            setUploadingImage(false);
        }
    };

    // === Tạo sản phẩm
    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true);
        const { name, mainText, desc, category, variants } = values;

        const thumbnail = fileListThumbnail?.[0]?.name ?? '';
        const slider = fileListSlider?.map((item) => item.name) ?? [];

        const res = await createProductAPI(
            name, mainText, desc, 0, 0, category, thumbnail, slider, variants ?? []
        );

        if (res && res.data) {
            message.success('Tạo mới Product thành công');
            form.resetFields();
            setFileListSlider([]); setFileListThumbnail([]);
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

    // === Xử lý Upload ảnh
    const getBase64 = (file: FileType): Promise<string> => new Promise((res, rej) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => res(reader.result as string); reader.onerror = (err) => rej(err);
    });

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
                title="Thêm mới Product"
                open={openModalCreate}
                onOk={() => form.submit()}
                onCancel={() => {
                    form.resetFields();
                    setFileListSlider([]); setFileListThumbnail([]);
                    setOpenModalCreate(false);
                }}
                destroyOnClose
                okButtonProps={{ loading: isSubmit }}
                okText="Tạo mới"
                cancelText="Hủy"
                width="70vw"
                maskClosable={false}
            >
                <Divider />
                <Form form={form} name="form-create-Product" onFinish={onFinish} layout="vertical" autoComplete="off">
                    <Row gutter={15}>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên sản phẩm"
                                rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="category" label="Danh mục"
                                rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}>
                                <Select showSearch allowClear options={listCategory} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="mainText" label="Nội dung sản phẩm"
                                rules={[{ required: true, message: 'Nhập nội dung sản phẩm!' }]}>
                                <ReactQuill ref={quillMainRef} theme="snow" modules={quillModulesMain} formats={quillFormats} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="desc" label="Mô tả chi tiết"
                                rules={[{ required: true, message: 'Nhập mô tả chi tiết!' }]}>
                                <ReactQuill ref={quillDescRef} theme="snow" modules={quillModulesDesc} formats={quillFormats} />
                            </Form.Item>
                        </Col>

                        {/* === Upload ảnh === */}
                        <Col span={12}>
                            <Form.Item label="Ảnh Thumbnail" name="thumbnail"
                                rules={[{ required: true, message: 'Upload thumbnail!' }]}
                                valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                <Upload
                                    listType="picture-card" maxCount={1}
                                    customRequest={(opt) => handleUploadFile(opt, 'thumbnail')}
                                    beforeUpload={beforeUpload}
                                    fileList={fileListThumbnail}>
                                    <div>{loadingThumbnail ? <LoadingOutlined /> : <PlusOutlined />}<div>Upload</div></div>
                                </Upload>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Ảnh Slider" name="slider"
                                rules={[{ required: true, message: 'Upload slider!' }]}
                                valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                <Upload multiple listType="picture-card"
                                    customRequest={(opt) => handleUploadFile(opt, 'slider')}
                                    beforeUpload={beforeUpload}
                                    fileList={fileListSlider}>
                                    <div>{loadingSlider ? <LoadingOutlined /> : <PlusOutlined />}<div>Upload</div></div>
                                </Upload>
                            </Form.Item>
                        </Col>

                        {/* === Phiên bản sản phẩm (lồng Form.List) === */}
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

export default CreateProduct;
