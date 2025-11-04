import { Row, Col, Rate, Divider, App, Breadcrumb, Select, Tag } from 'antd';
import ImageGallery from 'react-image-gallery';
import { useEffect, useRef, useState } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { BsCartPlus } from 'react-icons/bs';
import 'styles/product.scss';
import ModalGallery from './modal.gallery';
import { useCurrentApp } from '@/components/context/app.context';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';

interface IProps {
    currentProduct: IProductTable | null;
}

type UserAction = 'MINUS' | 'PLUS';

const ProductDetail = ({ currentProduct }: IProps) => {
    const [imageGallery, setImageGallery] = useState<
        { original: string; thumbnail: string; originalClass: string; thumbnailClass: string }[]
    >([]);
    const [isOpenModalGallery, setIsOpenModalGallery] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentQuantity, setCurrentQuantity] = useState(1);

    // ✅ Thêm state cho chọn phiên bản & màu sắc
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [displayPrice, setDisplayPrice] = useState<string>('');
    const [maxQuantity, setMaxQuantity] = useState<number>(1);

    const refGallery = useRef<ImageGallery>(null);
    const { setCarts, user } = useCurrentApp();
    const { message } = App.useApp();
    const navigate = useNavigate();

    // === Load ảnh ===
    useEffect(() => {
        if (currentProduct) {
            const imgs: any[] = [];
            if (currentProduct.thumbnail) {
                imgs.push({
                    original: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${currentProduct.thumbnail}`,
                    thumbnail: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${currentProduct.thumbnail}`,
                    originalClass: 'original-image',
                    thumbnailClass: 'thumbnail-image',
                });
            }
            currentProduct.slider?.forEach((s) => {
                imgs.push({
                    original: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${s}`,
                    thumbnail: `${import.meta.env.VITE_BACKEND_URL}/images/Product/${s}`,
                    originalClass: 'original-image',
                    thumbnailClass: 'thumbnail-image',
                });
            });
            setImageGallery(imgs);
        }
    }, [currentProduct]);

    // === Tính giá min - max
    useEffect(() => {
        if (currentProduct?.variants?.length) {
            const allPrices = currentProduct.variants.flatMap(v => v.colors.map(c => c.price));
            const min = Math.min(...allPrices);
            const max = Math.max(...allPrices);
            if (min === max) {
                setDisplayPrice(`${min.toLocaleString('vi-VN')}₫`);
            } else {
                setDisplayPrice(`${min.toLocaleString('vi-VN')}₫ - ${max.toLocaleString('vi-VN')}₫`);
            }
        }
    }, [currentProduct]);

    // === Khi chọn phiên bản hoặc màu
    useEffect(() => {
        if (selectedVersion && selectedColor && currentProduct?.variants) {
            const version = currentProduct.variants.find(v => v.versionName === selectedVersion);
            const colorObj = version?.colors.find(c => c.color === selectedColor);
            if (colorObj) {
                setDisplayPrice(`${colorObj.price.toLocaleString('vi-VN')}₫`);
                setMaxQuantity(colorObj.quantity);
                if (currentQuantity > colorObj.quantity) setCurrentQuantity(colorObj.quantity);
            }
        } else {
            // Nếu chưa chọn đủ thì quay lại hiển thị khoảng giá
            const allPrices = currentProduct?.variants?.flatMap(v => v.colors.map(c => c.price)) ?? [];
            if (allPrices.length) {
                const min = Math.min(...allPrices);
                const max = Math.max(...allPrices);
                setDisplayPrice(
                    min === max
                        ? `${min.toLocaleString('vi-VN')}₫`
                        : `${min.toLocaleString('vi-VN')}₫ - ${max.toLocaleString('vi-VN')}₫`
                );
            }
            setMaxQuantity(currentProduct?.quantity ?? 1);
        }
    }, [selectedVersion, selectedColor]);

    const handleOnClickImage = () => {
        setIsOpenModalGallery(true);
        setCurrentIndex(refGallery?.current?.getCurrentIndex() ?? 0);
    };

    const handleChangeButton = (type: UserAction) => {
        if (type === 'MINUS' && currentQuantity > 1) setCurrentQuantity(currentQuantity - 1);
        if (type === 'PLUS' && currentQuantity < maxQuantity) setCurrentQuantity(currentQuantity + 1);
    };

    const handleChangeInput = (v: string) => {
        const val = Number(v);
        if (!isNaN(val) && val > 0 && val <= maxQuantity) setCurrentQuantity(val);
    };

    const handleAddToCart = (isBuyNow = false) => {
        if (!user) {
            message.error('Bạn cần đăng nhập để thực hiện tính năng này.');
            return;
        }

        if (!selectedVersion || !selectedColor) {
            message.error('Vui lòng chọn phiên bản và màu sắc.');
            return;
        }

        const cartStorage = localStorage.getItem('carts');
        const carts = cartStorage ? JSON.parse(cartStorage) : [];
        const id = `${currentProduct?._id}-${selectedVersion}-${selectedColor}`;

        const idx = carts.findIndex((c: any) => c.cartId === id);
        const detail = {
            ...currentProduct!,
            selectedVersion,
            selectedColor,
            selectedPrice: displayPrice,
        };

        if (idx > -1) carts[idx].quantity += currentQuantity;
        else carts.push({ cartId: id, quantity: currentQuantity, detail });

        localStorage.setItem('carts', JSON.stringify(carts));
        setCarts(carts);

        if (isBuyNow) navigate('/order');
        else message.success('Đã thêm sản phẩm vào giỏ hàng');
    };

    return (
        <div style={{ background: '#f5f5f5' }}>
            {/* ----------- BREADCRUMB ----------- */}
            <div style={{ maxWidth: 1440, margin: '0 auto', padding: '15px 20px' }}>
                <Breadcrumb separator=">" items={[
                    { title: <Link to="/">Trang chủ</Link> },
                    { title: 'Chi tiết sản phẩm' },
                ]} />
            </div>

            {/* ----------- KHỐI TRÊN: ẢNH + GIÁ + MUA HÀNG ----------- */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: 6, maxWidth: 1440, margin: '0 auto' }}>
                <Row gutter={[20, 20]}>
                    <Col md={10} sm={24} xs={24}>
                        <ImageGallery
                            ref={refGallery}
                            items={imageGallery}
                            showPlayButton={false}
                            showFullscreenButton={false}
                            renderLeftNav={() => <></>}
                            renderRightNav={() => <></>}
                            onClick={handleOnClickImage}
                        />
                    </Col>

                    <Col md={14} sm={24} xs={24}>
                        <h2 style={{ fontWeight: 600 }}>{currentProduct?.name}</h2>

                        <div className="rating">
                            <Rate value={5} disabled style={{ color: '#ffce3d', fontSize: 14 }} />
                            <span style={{ marginLeft: 8, color: '#555' }}>Đã bán {currentProduct?.sold ?? 0}</span>
                        </div>

                        {/* ✅ Giá động */}
                        <div className="price" style={{ fontSize: 22, fontWeight: 600, color: '#e53935', margin: '10px 0' }}>
                            {displayPrice}
                        </div>

                        {/* ✅ Chọn phiên bản */}
                        {currentProduct?.variants?.length ? (
                            <div style={{ marginBottom: 15 }}>
                                <div style={{ marginBottom: 6, fontWeight: 500 }}>Phiên bản:</div>
                                <Select
                                    placeholder="Chọn phiên bản"
                                    style={{ width: '100%' }}
                                    value={selectedVersion ?? undefined}
                                    onChange={(v) => {
                                        setSelectedVersion(v);
                                        setSelectedColor(null);
                                    }}
                                    options={currentProduct.variants.map(v => ({
                                        label: v.versionName,
                                        value: v.versionName,
                                    }))}
                                />
                            </div>
                        ) : null}

                        {/* ✅ Chọn màu (nếu đã chọn phiên bản) */}
                        {selectedVersion && (
                            <div style={{ marginBottom: 15 }}>
                                <div style={{ marginBottom: 6, fontWeight: 500 }}>Màu sắc:</div>
                                {currentProduct?.variants
                                    ?.find(v => v.versionName === selectedVersion)
                                    ?.colors.map((c) => (
                                        <Tag.CheckableTag
                                            key={c.color}
                                            checked={selectedColor === c.color}
                                            onChange={() => setSelectedColor(c.color)}
                                            style={{
                                                border: '1px solid #ccc',
                                                padding: '5px 12px',
                                                fontSize: 14,
                                                marginBottom: 5,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {c.color}
                                        </Tag.CheckableTag>
                                    ))}
                            </div>
                        )}

                        {/* Số lượng */}
                        <div className="quantity" style={{ marginBottom: 20 }}>
                            <span style={{ marginRight: 8 }}>Số lượng:</span>
                            <button onClick={() => handleChangeButton('MINUS')}><MinusOutlined /></button>
                            <input
                                style={{ width: 50, textAlign: 'center', margin: '0 5px' }}
                                value={currentQuantity}
                                onChange={(e) => handleChangeInput(e.target.value)}
                            />
                            <button onClick={() => handleChangeButton('PLUS')}><PlusOutlined /></button>
                            {selectedVersion && selectedColor && (
                                <span style={{ marginLeft: 10, color: '#666' }}>
                                    (Còn {maxQuantity} sản phẩm)
                                </span>
                            )}
                        </div>

                        {/* Nút mua hàng */}
                        <div className="buy" style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => handleAddToCart()}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    fontWeight: 600,
                                    border: '1px solid #ff4d4f',
                                    color: '#ff4d4f',
                                    borderRadius: 5,
                                    background: '#fff',
                                    transition: '0.3s',
                                }}
                            >
                                <BsCartPlus style={{ marginRight: 6 }} />
                                Thêm vào giỏ hàng
                            </button>
                            <button
                                onClick={() => handleAddToCart(true)}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    fontWeight: 600,
                                    background: '#ff4d4f',
                                    color: '#fff',
                                    borderRadius: 5,
                                    border: 'none',
                                    transition: '0.3s',
                                }}
                            >
                                Mua ngay
                            </button>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* ----------- KHỐI DƯỚI: CHI TIẾT + MÔ TẢ ----------- */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: 6,
                    padding: '30px',
                    maxWidth: 1440,
                    margin: '20px auto',
                }}
            >
                <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 15 }}>CHI TIẾT SẢN PHẨM</h3>
                <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(currentProduct?.mainText || '', { USE_PROFILES: { html: true } }),
                    }}
                />

                <Divider />

                <h3 style={{ fontWeight: 700, fontSize: 20, margin: '20px 0 15px' }}>MÔ TẢ SẢN PHẨM</h3>
                <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(currentProduct?.desc || '', { USE_PROFILES: { html: true } }),
                    }}
                />
            </div>

            <ModalGallery
                isOpen={isOpenModalGallery}
                setIsOpen={setIsOpenModalGallery}
                currentIndex={currentIndex}
                items={imageGallery}
                title={currentProduct?.mainText ?? ''}
            />
        </div>
    );
};

export default ProductDetail;
