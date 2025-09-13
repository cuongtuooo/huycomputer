import MobileFilter from '@/components/client/product/mobile.filter';
import { getProductsAPI, getCategoryAPI } from '@/services/api';
import { FilterTwoTone } from '@ant-design/icons';
import {
    Row, Col, Form, Divider, InputNumber,
    Button, Rate, Tabs, Pagination, Spin,
} from 'antd';
import type { FormProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import 'styles/home.scss';

type FieldType = {
    range: { from: number; to: number };
    category: string[];
};

type CategorySection = {
    id: string;
    name: string;
    products: IProductTable[];
};

const MAX_SECTIONS = 8;              // số danh mục hiển thị trên homepage
const MAX_ITEMS_PER_SECTION = 10;    // 10 sản phẩm / danh mục (trang chủ)

const HomePage = () => {
    const [searchTerm] = useOutletContext() as any;

    const [listCategory, setListCategory] = useState<{ label: string; value: string }[]>([]);
    const [sections, setSections] = useState<CategorySection[]>([]);

    // Chế độ LIST (xem tất cả) dùng các state cũ
    const [listProduct, setListProduct] = useState<IProductTable[]>([]);
    const [current, setCurrent] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [total, setTotal] = useState<number>(0);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [filter, setFilter] = useState<string>('');
    const [sortQuery, setSortQuery] = useState<string>('sort=-sold');
    const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    // Khi có search / category → vào chế độ LIST
    const isListMode = useMemo(() => {
        if (searchTerm) return true;
        if (filter.includes('category=')) return true;
        if (params.get('category')) return true;
        return false;
    }, [searchTerm, filter, params]);

    // Tab sort
    const items = [
        { key: 'sort=-sold', label: 'Phổ biến', children: <></> },
        { key: 'sort=-updatedAt', label: 'Hàng Mới', children: <></> },
        { key: 'sort=price', label: 'Giá Thấp Đến Cao', children: <></> },
        { key: 'sort=-price', label: 'Giá Cao Đến Thấp', children: <></> },
    ];

    // Load danh mục
    useEffect(() => {
        const initCategory = async () => {
            const res = await getCategoryAPI();
            if (res?.data) {
                const d = res.data.result.map((it: any) => ({ label: it.name, value: it._id }));
                setListCategory(d);
            }
        };
        initCategory();
    }, []);

    // Homepage mode: load 10 sản phẩm cho từng danh mục
    useEffect(() => {
        const loadSections = async () => {
            if (!listCategory.length || isListMode) return;
            setIsLoading(true);
            try {
                const cats = listCategory.slice(0, MAX_SECTIONS);
                const reqs = cats.map(c =>
                    getProductsAPI(`current=1&pageSize=${MAX_ITEMS_PER_SECTION}&category=${c.value}&${sortQuery}`)
                );
                const rs = await Promise.all(reqs);
                const packed: CategorySection[] = rs.map((r: any, i: number) => ({
                    id: cats[i].value,
                    name: cats[i].label,
                    products: r?.data?.result || [],
                }));
                setSections(packed);
            } finally {
                setIsLoading(false);
            }
        };
        loadSections();
    }, [listCategory, isListMode, sortQuery]);

    // List mode: danh sách + phân trang 15/sp
    useEffect(() => {
        if (!isListMode) return;
        fetchProduct();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, pageSize, filter, sortQuery, searchTerm, isListMode]);

    const fetchProduct = async () => {
        setIsLoading(true);
        let query = `current=${current}&pageSize=${pageSize}`;
        if (filter) query += `&${filter}`;
        if (sortQuery) query += `&${sortQuery}`;
        if (searchTerm) query += `&name=/${searchTerm}/i`;
        const urlCate = params.get('category');
        if (urlCate && !filter.includes('category=')) query += `&category=${urlCate}`;
        const res = await getProductsAPI(query);
        if (res?.data) {
            setListProduct(res.data.result);
            setTotal(res.data.meta.total);
        }
        setIsLoading(false);
    };

    const handleOnchangePage = (pagination: { current: number; pageSize: number }) => {
        if (pagination.current !== current) setCurrent(pagination.current);
        if (pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize);
            setCurrent(1);
        }
    };

    // Lọc (giữ logic cũ) – khi chọn category thì tự vào list mode & pageSize = 15
    const handleChangeFilter = (changedValues: any, values: any) => {
        if (changedValues.category) {
            const cate = values.category;
            if (cate?.length) {
                setFilter(`category=${cate.join(',')}`);
                setPageSize(15);
                setCurrent(1);
            } else {
                setFilter('');
            }
        }
    };

    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        if (values?.range?.from >= 0 && values?.range?.to >= 0) {
            let f = `price>=${values.range.from}&price<=${values.range.to}`;
            if (values?.category?.length) f += `&category=${values.category.join(',')}`;
            setFilter(f);
            setPageSize(15);
            setCurrent(1);
        }
    };

    // Click “Xem tất cả” ở header danh mục
    const openAllOfCategory = (categoryId: string) => {
        setFilter(`category=${categoryId}`);
        setPageSize(15);
        setCurrent(1);
        setParams(new URLSearchParams({ category: categoryId }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* thanh chips danh mục trên cùng */}
            <div className="category-topbar">
                <div className="category-topbar__inner">
                    <div className="category-chips">
                        {listCategory.map((item) => (
                            <button
                                key={item.value}
                                className="category-chip"
                                onClick={() => openAllOfCategory(item.value)}
                            >
                                {item.label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* content */}
            <div style={{ background: '#efefef', padding: '20px 0' }}>
                <div className="homepage-container" style={{ maxWidth: 1440, margin: '0 auto', overflow: 'hidden' }}>
                    <Row gutter={[20, 20]}>
                        <Col md={24} xs={24}>
                            <Spin spinning={isLoading} tip="Loading...">
                                <div style={{ padding: 20, background: '#fff', borderRadius: 5 }}>
                                    {/* Tabs sort chỉ xuất hiện khi ở chế độ LIST */}
                                    {isListMode && (
                                        <Row>
                                            <Tabs
                                                defaultActiveKey="sort=-sold"
                                                items={items}
                                                onChange={(v) => setSortQuery(v)}
                                                style={{ overflowX: 'auto' }}
                                            />
                                        </Row>
                                    )}

                                    {/* ===== SECTIONS MODE (Trang chủ) ===== */}
                                    {!isListMode && (
                                        <div className="sections-wrap">
                                            {sections.map((sec) => (
                                                <div className="category-section" key={sec.id}>
                                                    <div className="category-header">
                                                        <h3 className="category-title">{sec.name}</h3>
                                                        <button className="see-all" onClick={() => openAllOfCategory(sec.id)}>
                                                            Xem tất cả
                                                        </button>
                                                    </div>

                                                    <Row className="customize-row">
                                                        {sec.products.map((item, idx) => (
                                                            <div
                                                                onClick={() => navigate(`/Product/${item._id}`)}
                                                                className="column"
                                                                key={`Product-${sec.id}-${idx}`}
                                                            >
                                                                <div className="wrapper">
                                                                    <div className="thumbnail">
                                                                        <img
                                                                            src={`${import.meta.env.VITE_BACKEND_URL}/images/Product/${item.thumbnail}`}
                                                                            alt="thumbnail Product"
                                                                        />
                                                                    </div>
                                                                    {/* Tên sản phẩm */}
                                                                    <div
                                                                        title={item.name}
                                                                        style={{
                                                                            marginTop: 8,
                                                                            fontSize: 15,
                                                                            lineHeight: '20px',
                                                                            color: '#2f3640',
                                                                            fontWeight: 600,
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 2,            // khóa 2 dòng
                                                                            WebkitBoxOrient: 'vertical',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            minHeight: 40                   // giữ chiều cao đều nhau
                                                                        }}
                                                                    >
                                                                        {item.name}
                                                                    </div>

                                                                    {/* Giá bán */}
                                                                    <div
                                                                        style={{
                                                                            marginTop: 6,
                                                                            fontSize: 18,
                                                                            fontWeight: 700,
                                                                            letterSpacing: '.2px',
                                                                            color: '#105aa2'               // primary khớp header
                                                                        }}
                                                                    >
                                                                        {new Intl.NumberFormat('vi-VN', {
                                                                            style: 'currency',
                                                                            currency: 'VND',
                                                                            maximumFractionDigits: 0       // VND thường không có phần lẻ
                                                                        }).format(item?.price ?? 0)}
                                                                    </div>
                                                                    <div className="rating">
                                                                        <Rate value={5} disabled style={{ color: '#ffce3d', fontSize: 10 }} />
                                                                        {/* <span>Đã bán {item?.sold ?? 0}</span> */}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {sec.products.length === 0 && (
                                                            <div style={{ padding: 12, color: '#888' }}>Chưa có sản phẩm.</div>
                                                        )}
                                                    </Row>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ===== LIST MODE (Xem tất cả) ===== */}
                                    {isListMode && (
                                        <>
                                            <Row className="customize-row">
                                                {listProduct.map((item, index) => (
                                                    <div
                                                        onClick={() => navigate(`/Product/${item._id}`)}
                                                        className="column"
                                                        key={`Product-${index}`}
                                                    >
                                                        <div className="wrapper">
                                                            <div className="thumbnail">
                                                                <img
                                                                    src={`${import.meta.env.VITE_BACKEND_URL}/images/Product/${item.thumbnail}`}
                                                                    alt="thumbnail Product"
                                                                />
                                                            </div>
                                                            {/* Tên sản phẩm */}
                                                            <div
                                                                title={item.name}
                                                                style={{
                                                                    marginTop: 8,
                                                                    fontSize: 15,
                                                                    lineHeight: '20px',
                                                                    color: '#2f3640',
                                                                    fontWeight: 600,
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,            // khóa 2 dòng
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    minHeight: 40                   // giữ chiều cao đều nhau
                                                                }}
                                                            >
                                                                {item.name}
                                                            </div>

                                                            {/* Giá bán */}
                                                            <div
                                                                style={{
                                                                    marginTop: 6,
                                                                    fontSize: 18,
                                                                    fontWeight: 700,
                                                                    letterSpacing: '.2px',
                                                                    color: '#105aa2'               // primary khớp header
                                                                }}
                                                            >
                                                                {new Intl.NumberFormat('vi-VN', {
                                                                    style: 'currency',
                                                                    currency: 'VND',
                                                                    maximumFractionDigits: 0       // VND thường không có phần lẻ
                                                                }).format(item?.price ?? 0)}
                                                            </div>

                                                            <div className="rating">
                                                                <Rate value={5} disabled style={{ color: '#ffce3d', fontSize: 10 }} />
                                                                <span>Đã bán {item?.sold ?? 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </Row>

                                            <div style={{ marginTop: 30 }} />
                                            <Row style={{ display: 'flex', justifyContent: 'center' }}>
                                                <Pagination
                                                    current={current}
                                                    total={total}
                                                    pageSize={pageSize}
                                                    responsive
                                                    onChange={(p, s) => handleOnchangePage({ current: p, pageSize: s })}
                                                    showSizeChanger
                                                    pageSizeOptions={[15, 30, 45]}
                                                />
                                            </Row>
                                        </>
                                    )}
                                </div>
                            </Spin>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Mobile Filter giữ nguyên */}
            <MobileFilter
                isOpen={showMobileFilter}
                setIsOpen={setShowMobileFilter}
                handleChangeFilter={handleChangeFilter}
                listCategory={listCategory}
                onFinish={onFinish}
            />
        </>
    );
};

export default HomePage;
