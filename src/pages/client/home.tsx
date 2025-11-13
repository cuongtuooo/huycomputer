import MobileFilter from '@/components/client/product/mobile.filter';
import Banner from '@/components/common/Banner';
import { getProductsAPI, getCategoryTreeAPI } from '@/services/api';
import { Tabs, Row, Col, Spin, Pagination } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import 'styles/home.scss';

interface Category {
    _id: string;
    name: string;
    parentCategory?: { _id: string; name: string } | null;
}

interface CategorySection {
    id: string;
    name: string;
    products: IProductTable[];
}

const MAX_SECTIONS = 8;
const MAX_ITEMS_PER_SECTION = 10;

const HomePage = () => {
    const [searchTerm] = useOutletContext() as any;
    const [listCategory, setListCategory] = useState<Category[]>([]);
    const [sections, setSections] = useState<CategorySection[]>([]);
    const [listProduct, setListProduct] = useState<IProductTable[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [sortQuery, setSortQuery] = useState<string>('sort=-sold');
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();

    const parentId = params.get('parent') || null;
    const childId = params.get('child') || null;

    const banners = [
        { id: 1, img: "/banner/baner1.jpg", alt: "Siêu sale Laptop" },
        { id: 2, img: "/banner/baner1.jpg", alt: "Gaming đỉnh cao" },
        { id: 3, img: "/banner/baner1.jpg", alt: "Back to School" },
    ];
    // ========== LẤY DANH MỤC ==========
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getCategoryTreeAPI();
                if (res?.data) {
                    setListCategory(res.data); // ✅ dữ liệu giờ đã có children
                }
            } catch (error) {
                console.error('❌ Lỗi tải danh mục:', error);
            }
        };  
        fetchCategories();
    }, []);


    const parentCategories = useMemo(() => listCategory, [listCategory]);


    const childCategories = useMemo(() => {
        const parent = listCategory.find((c) => c._id === parentId);
        return parent?.children ?? [];
    }, [listCategory, parentId]);


    // ========== LOAD TRANG CHỦ (CÁC DANH MỤC CHA) ==========
    useEffect(() => {
        const loadSections = async () => {
            if (parentId || searchTerm) return; // Nếu đang xem tất cả thì không chạy
            setIsLoading(true);
            try {
                // Lấy tối đa MAX_SECTIONS danh mục cha
                const cats = parentCategories.slice(0, MAX_SECTIONS);

                // Lấy các sản phẩm thuộc các danh mục con của từng danh mục cha
                const reqs = cats.map(async (cat) => {
                    // ✅ Lấy ID tất cả danh mục con cấp dưới của cat
                    const collectChildIds = (node: any): string[] => {
                        if (!node.children || node.children.length === 0) return [node._id];
                        return [node._id, ...node.children.flatMap(collectChildIds)];
                    };

                    const allIds = collectChildIds(cat);
                    const queryIds = allIds.join(',');

                    const res = await getProductsAPI(
                        `current=1&pageSize=${MAX_ITEMS_PER_SECTION}&category=${queryIds}&${sortQuery}`
                    );

                    return {
                        id: cat._id,
                        name: cat.name,
                        products: res?.data?.result || [],
                    };
                });


                const results = await Promise.all(reqs);
                setSections(results);
            } finally {
                setIsLoading(false);
            }
        };
        loadSections();
    }, [listCategory, sortQuery, parentId, searchTerm]);

    // ========== XEM TẤT CẢ (CÁC CON) ==========
    useEffect(() => {
        const loadChildProducts = async () => {
            if (!parentId) return;
            setIsLoading(true);
            try {
                // Nếu có childId thì chỉ lấy sản phẩm của danh mục con đó
                const categoryIds = childId ? [childId] : childCategories.map((c) => c._id);
                const query = `current=1&pageSize=20&category=${categoryIds.join(',')}&${sortQuery}`;
                const res = await getProductsAPI(query);
                setListProduct(res?.data?.result || []);
            } finally {
                setIsLoading(false);
            }
        };
        loadChildProducts();
    }, [parentId, childId, sortQuery, listCategory]);

    // ========== HÀM MỞ "XEM TẤT CẢ" ==========
    const openAllOfCategory = (catId: string) => {
        navigate(`/?parent=${catId}`);
        // window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ========== HÀM CHỌN DANH MỤC CON TRONG TAB ==========
    const handleSelectChild = (childId: string) => {
        navigate(`/?parent=${parentId}&child=${childId}`);
        // window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={{ background: '#efefef', padding: '20px 0' }}>
            <div className="homepage-container" style={{ maxWidth: 1440, margin: '0 auto' }}>
                {/* ✅ Banner ở đầu trang */}
                <Banner items={banners} autoplaySpeed={3000} />
                <Spin spinning={isLoading} tip="Loading...">
                    {/* ======== TRANG CHỦ - DANH MỤC CHA ======== */}
                    {!parentId && (
                        <div className="sections-wrap">
                            {sections.map((sec) => (
                                <div className="category-section" key={sec.id}>
                                    {/* Tiêu đề danh mục */}
                                    <h3 className="category-title" style={{ marginBottom: 12 }}>
                                        {sec.name}
                                    </h3>

                                    {/* Grid sản phẩm */}
                                    <Row className="customize-row">
                                        {sec.products.map((item) => (
                                            <div
                                                key={item._id}
                                                className="column"
                                                onClick={() => navigate(`/Product/${item._id}`)}
                                            >
                                                <div className="wrapper">
                                                    <div className="thumbnail">
                                                        <img
                                                            src={`${import.meta.env.VITE_BACKEND_URL}/images/Product/${item.thumbnail}`}
                                                            alt={item.name}
                                                        />
                                                    </div>
                                                    <div className="name">{item.name}</div>
                                                    <div className="price">
                                                        {new Intl.NumberFormat('vi-VN', {
                                                            style: 'currency',
                                                            currency: 'VND',
                                                        }).format(item.price ?? 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </Row>

                                    {/* ✅ Nút "Xem tất cả" ở dưới */}
                                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                                        <button
                                            className="see-all"
                                            style={{
                                                background: '#105aa2',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 6,
                                                padding: '6px 16px',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                            }}
                                            onClick={() => openAllOfCategory(sec.id)}
                                        >
                                            Xem tất cả
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ======== XEM TẤT CẢ - CÁC DANH MỤC CON ======== */}
                    {parentId && (
                        <div style={{ background: '#fff', borderRadius: 6, padding: 20 }}>
                            <h2 style={{ marginBottom: 16 }}>
                                Danh mục: {listCategory.find((c) => c._id === parentId)?.name}
                            </h2>

                            {/* ✅ Tabs hiển thị danh mục con + tab "Tất cả" */}
                            <Tabs
                                defaultActiveKey={childId || "all"}
                                activeKey={childId || "all"}
                                onChange={(key) => {
                                    if (key === "all") {
                                        navigate(`/?parent=${parentId}`); // 🟢 load tất cả sản phẩm con
                                    } else {
                                        navigate(`/?parent=${parentId}&child=${key}`);
                                    }
                                }}
                                items={[
                                    {
                                        key: "all",
                                        label: "Tất cả",
                                    },
                                    ...childCategories.map((c) => ({
                                        key: c._id,
                                        label: c.name,
                                    })),
                                ]}
                            />


                            <Row className="customize-row">
                                {listProduct.map((item) => (
                                    <div
                                        key={item._id}
                                        className="column"
                                        onClick={() => navigate(`/Product/${item._id}`)}
                                    >
                                        <div className="wrapper">
                                            <div className="thumbnail">
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_URL}/images/Product/${item.thumbnail}`}
                                                    alt={item.name}
                                                />
                                            </div>
                                            <div className="name">{item.name}</div>
                                            <div className="price">
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                }).format(item.price ?? 0)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Row>
                        </div>
                    )}
                </Spin>
            </div>
        </div>
    );
};

export default HomePage;
