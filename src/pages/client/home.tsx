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

const MAX_SECTIONS = 8;
const MAX_ITEMS_PER_SECTION = 10;

const HomePage = () => {
    const [searchTerm] = useOutletContext() as any;

    const [listCategory, setListCategory] = useState<{ label: string; value: string }[]>([]);
    const [sections, setSections] = useState<CategorySection[]>([]);

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

    const isListMode = useMemo(() => {
        if (searchTerm) return true;
        if (filter.includes('category=')) return true;
        if (params.get('category')) return true;
        return false;
    }, [searchTerm, filter, params]);

    const items = [
        { key: 'sort=-sold', label: 'Phổ biến', children: <></> },
        { key: 'sort=-updatedAt', label: 'Hàng Mới', children: <></> },
        { key: 'sort=price', label: 'Giá Thấp Đến Cao', children: <></> },
        { key: 'sort=-price', label: 'Giá Cao Đến Thấp', children: <></> },
    ];

    // ---------- LOAD DANH MỤC ----------
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

    // ---------- TRANG CHỦ: load sản phẩm theo từng danh mục ----------
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

    // ---------- DANH SÁCH (khi chọn danh mục hoặc search) ----------
    useEffect(() => {
        if (!isListMode) return;
        fetchProduct();
        // 👇 THÊM params vào dependency
    }, [current, pageSize, filter, sortQuery, searchTerm, isListMode, params]);

    const fetchProduct = async () => {
        setIsLoading(true);
        let query = `current=${current}&pageSize=${pageSize}`;
        if (filter) query += `&${filter}`;
        if (sortQuery) query += `&${sortQuery}`;
        if (searchTerm) query += `&name=/${searchTerm}/i`;

        // 👇 lấy category từ URL
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

    const openAllOfCategory = (categoryId: string) => {
        setFilter(`category=${categoryId}`);
        setPageSize(15);
        setCurrent(1);
        setParams(new URLSearchParams({ category: categoryId }));
        // 👇 Scroll lên đầu
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <div style={{ background: '#efefef', padding: '20px 0' }}>
                <div className="homepage-container" style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <Row gutter={[20, 20]}>
                        <Col md={24} xs={24}>
                            <Spin spinning={isLoading} tip="Loading...">
                                <div style={{ padding: 20, background: '#fff', borderRadius: 5 }}>
                                    {isListMode && (
                                        <Row>
                                            <Tabs
                                                defaultActiveKey="sort=-sold"
                                                items={items}
                                                onChange={(v) => setSortQuery(v)}
                                            />
                                        </Row>
                                    )}

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
                                                                    <div
                                                                        title={item.name}
                                                                        style={{
                                                                            marginTop: 8,
                                                                            fontSize: 15,
                                                                            color: '#2f3640',
                                                                            fontWeight: 600,
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            overflow: 'hidden',
                                                                        }}
                                                                    >
                                                                        {item.name}
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            marginTop: 6,
                                                                            fontSize: 18,
                                                                            fontWeight: 700,
                                                                            color: '#105aa2',
                                                                        }}
                                                                    >
                                                                        {new Intl.NumberFormat('vi-VN', {
                                                                            style: 'currency',
                                                                            currency: 'VND',
                                                                            maximumFractionDigits: 0,
                                                                        }).format(item?.price ?? 0)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </Row>
                                                </div>
                                            ))}
                                        </div>
                                    )}

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
                                                            <div
                                                                title={item.name}
                                                                style={{
                                                                    marginTop: 8,
                                                                    fontSize: 15,
                                                                    color: '#2f3640',
                                                                    fontWeight: 600,
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                }}
                                                            >
                                                                {item.name}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    marginTop: 6,
                                                                    fontSize: 18,
                                                                    fontWeight: 700,
                                                                    color: '#105aa2',
                                                                }}
                                                            >
                                                                {new Intl.NumberFormat('vi-VN', {
                                                                    style: 'currency',
                                                                    currency: 'VND',
                                                                    maximumFractionDigits: 0,
                                                                }).format(item?.price ?? 0)}
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

            {/* Mobile Filter */}
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
