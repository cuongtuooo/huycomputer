import { Badge, Descriptions, Divider, Drawer, Image, Table, Upload } from "antd";
import { useEffect, useState } from "react";
import type { GetProp, UploadFile, UploadProps } from 'antd';
import dayjs from "dayjs";
import { FORMATE_DATE_VN } from "@/services/helper";
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';
import { getCategoryAPI } from "@/services/api";

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

interface IProps {
    openViewDetail: boolean;
    setOpenViewDetail: (v: boolean) => void;
    dataViewDetail: IProductTable | null;
    setDataViewDetail: (v: IProductTable | null) => void;
}

const DetailProduct = (props: IProps) => {
    const {
        openViewDetail, setOpenViewDetail,
        dataViewDetail, setDataViewDetail
    } = props;

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

    // Lấy danh mục để hiển thị tên thay vì id
    useEffect(() => {
        const fetchCategories = async () => {
            const res = await getCategoryAPI();
            if (res && res.data) {
                const map: Record<string, string> = {};
                res.data.result.forEach((cat: any) => {
                    map[cat._id] = cat.name;
                });
                setCategoriesMap(map);
            }
        };
        if (openViewDetail) fetchCategories();
    }, [openViewDetail]);

    // Hiển thị ảnh
    useEffect(() => {
        if (dataViewDetail) {
            let imgThumbnail: any = {}, imgSlider: UploadFile[] = [];
            if (dataViewDetail.thumbnail) {
                imgThumbnail = {
                    uid: uuidv4(),
                    name: dataViewDetail.thumbnail,
                    status: 'done',
                    url: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${dataViewDetail.thumbnail}`,
                };
            }
            if (dataViewDetail.slider && dataViewDetail.slider.length > 0) {
                dataViewDetail.slider.forEach(item => {
                    imgSlider.push({
                        uid: uuidv4(),
                        name: item,
                        status: 'done',
                        url: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${item}`,
                    });
                });
            }
            setFileList([imgThumbnail, ...imgSlider]);
        }
    }, [dataViewDetail]);

    const onClose = () => {
        setOpenViewDetail(false);
        setDataViewDetail(null);
    };

    const getBase64 = (file: FileType): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    // 🔹 Chuẩn bị dữ liệu bảng phiên bản + màu sắc
    const variantRows = (dataViewDetail?.variants ?? []).flatMap((variant) =>
        variant.colors.map((color) => ({
            key: `${variant.versionName}-${color.color}`,
            version: variant.versionName,
            color: color.color,
            price: color.price,
            quantity: color.quantity,
        }))
    );

    const columns = [
        { title: 'Phiên bản', dataIndex: 'version', key: 'version', width: 180 },
        { title: 'Màu sắc', dataIndex: 'color', key: 'color', width: 120 },
        {
            title: 'Giá tiền', dataIndex: 'price', key: 'price', width: 150,
            render: (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
        },
        { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 100 },
    ];

    return (
        <>
            <Drawer
                title="Chi tiết sản phẩm"
                width={"75vw"}
                onClose={onClose}
                open={openViewDetail}
            >
                <Descriptions title="Thông tin sản phẩm" bordered column={2}>
                    <Descriptions.Item label="ID">{dataViewDetail?._id}</Descriptions.Item>
                    <Descriptions.Item label="Tên sản phẩm">{dataViewDetail?.name}</Descriptions.Item>

                    <Descriptions.Item label="Chức năng chính" span={2}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(dataViewDetail?.mainText || '', { USE_PROFILES: { html: true } })
                            }}
                        />
                    </Descriptions.Item>

                    <Descriptions.Item label="Mô tả chi tiết" span={2}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(dataViewDetail?.desc || '', { USE_PROFILES: { html: true } })
                            }}
                        />
                    </Descriptions.Item>

                    <Descriptions.Item label="Giá trung bình">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                            .format(dataViewDetail?.price ?? 0)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tổng số lượng">
                        {dataViewDetail?.quantity ?? 0}
                    </Descriptions.Item>

                    <Descriptions.Item label="Danh mục" span={2}>
                        <Badge
                            status="processing"
                            text={
                                categoriesMap[
                                typeof dataViewDetail?.category === 'string'
                                    ? dataViewDetail.category
                                    // @ts-ignore
                                    : dataViewDetail?.category?._id
                                ] || 'Không xác định'
                            }
                        />
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(dataViewDetail?.createdAt).format(FORMATE_DATE_VN)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                        {dayjs(dataViewDetail?.updatedAt).format(FORMATE_DATE_VN)}
                    </Descriptions.Item>
                </Descriptions>

                <Divider orientation="left">Ảnh sản phẩm</Divider>
                <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    showUploadList={{ showRemoveIcon: false }}
                />

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

                {/* 🔹 Hiển thị bảng các phiên bản và màu sắc */}
                <Divider orientation="left">Phiên bản & Màu sắc</Divider>
                <Table
                    columns={columns}
                    dataSource={variantRows}
                    pagination={false}
                    bordered
                    size="middle"
                />
            </Drawer>
        </>
    );
};

export default DetailProduct;
