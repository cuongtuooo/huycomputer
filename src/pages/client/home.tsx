import MobileFilter from '@/components/client/product/mobile.filter';
import { getProductsAPI, getCategoryAPI } from '@/services/api';
import { FilterTwoTone, ReloadOutlined } from '@ant-design/icons';
import {
    Row, Col, Form, Checkbox, Divider, InputNumber,
    Button, Rate, Tabs, Pagination, Spin,
    Input
} from 'antd';
import type { FormProps } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import 'styles/home.scss';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
type FieldType = {
    range: {
        from: number;
        to: number
    }
    category: string[]
};


const HomePage = () => {
    const [searchTerm] = useOutletContext() as any;

    const [listCategory, setListCategory] = useState<{
        label: string, value: string
    }[]>([]);

    const [listProduct, setListProduct] = useState<IProductTable[]>([]);
    const [current, setCurrent] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [total, setTotal] = useState<number>(0);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [filter, setFilter] = useState<string>("");
    const [sortQuery, setSortQuery] = useState<string>("sort=-sold");
    const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);

    const [form] = Form.useForm();

    const navigate = useNavigate();

    useEffect(() => {
        const initCategory = async () => {
            const res = await getCategoryAPI();
            if (res && res.data) {
                const d = res.data.result.map(item => {
                    return { label: item.name, value: item._id }
                })
                setListCategory(d);
            }
        }
        initCategory();
    }, []);

    useEffect(() => {
        fetchProduct();
    }, [current, pageSize, filter, sortQuery, searchTerm]);

    const fetchProduct = async () => {
        setIsLoading(true)
        let query = `current=${current}&pageSize=${pageSize}`;
        if (filter) {
            query += `&${filter}`;
        }
        if (sortQuery) {
            query += `&${sortQuery}`;
        }

        if (searchTerm) {
            query += `&mainText=/${searchTerm}/i`;
        }

        const res = await getProductsAPI(query);
        if (res && res.data) {
            setListProduct(res.data.result);
            setTotal(res.data.meta.total)
        }
        setIsLoading(false)
    }

    const handleOnchangePage = (pagination: { current: number, pageSize: number }) => {
        if (pagination && pagination.current !== current) {
            setCurrent(pagination.current)
        }
        if (pagination && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize)
            setCurrent(1);
        }

    }


    const handleChangeFilter = (changedValues: any, values: any) => {
        //only fire if category changes
        if (changedValues.category) {
            const cate = values.category;
            if (cate && cate.length > 0) {
                const f = cate.join(',');
                setFilter(`category=${f}`)
            } else {
                //reset data -> fetch all
                setFilter('');
            }
        }

    }

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        if (values?.range?.from >= 0 && values?.range?.to >= 0) {
            let f = `price>=${values?.range?.from}&price<=${values?.range?.to}`;
            if (values?.category?.length) {
                const cate = values?.category?.join(',');
                f += `&category=${cate}`
            }
            setFilter(f);
        }

    }

    const onChange = (key: string) => {
        // console.log(key);
    };

    const items = [
        {
            key: "sort=-sold",
            label: `Phổ biến`,
            children: <></>,
        },
        {
            key: 'sort=-updatedAt',
            label: `Hàng Mới`,
            children: <></>,
        },
        {
            key: 'sort=price',
            label: `Giá Thấp Đến Cao`,
            children: <></>,
        },
        {
            key: 'sort=-price',
            label: `Giá Cao Đến Thấp`,
            children: <></>,
        },
    ];
    
    // banner
    const ProductList = [
        { title: "Chí Phèo", img: "/banner/baner1.jpg" },
        { title: "Tuyển tập Nam Cao", img: "/banner/baner2.jpg" },
        { title: "Lão Hạc", img: "/banner/baner3.png" },
        { title: "Thạch Lam", img: "/banner/baner4.png" },
        { title: "Vũ Trọng Phụng", img: "/banner/baner5.png" },
        { title: "Những ngày xưa", img: "/banner/baner6.png" },
    ];

    const settings = {
        dots: false,
        infinite: true,
        speed: 4000,
        autoplay: true,
        autoplaySpeed: 0,
        cssEase: "linear",
        slidesToShow: 5,
        slidesToScroll: 1,
        arrows: false,
    };

    return (
        <>
            <div style={{ background: '#105aa2', padding: '10px 20px' }}>
                <div
                    style={{
                        maxWidth: 1440,
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                    }}
                >
                    {/* Danh mục sản phẩm */}
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '15px',
                            color: '#fff',
                            fontWeight: 500,
                            fontSize: 14,
                        }}
                    >
                        {listCategory?.map((item) => (
                            <span
                                key={item.value}
                                style={{
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    background: '#0d4c89',
                                    transition: '0.2s',
                                }}
                                onClick={() => {
                                    setFilter(`category=${item.value}`);
                                    setCurrent(1);
                                }}
                                onMouseEnter={(e) =>
                                    ((e.target as HTMLSpanElement).style.backgroundColor = '#0c3c6b')
                                }
                                onMouseLeave={(e) =>
                                    ((e.target as HTMLSpanElement).style.backgroundColor = '#0d4c89')
                                }
                            >
                                {item.label.toUpperCase()}
                            </span>
                        ))}
                    </div>

                    {/* Ô tìm kiếm */}
                    {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Input.Search
                            placeholder="Tìm sản phẩm..."
                            allowClear
                            enterButton
                            onSearch={(value) => {
                                if (value) {
                                    setCurrent(1);
                                    setFilter(`mainText=/${value}/i`);
                                } else {
                                    setFilter('');
                                }
                            }}
                        />
                    </div> */}
                </div>
            </div>


            <div style={{ background: '#efefef', padding: "20px 0" }}>
                <div className="homepage-container" style={{ maxWidth: 1440, margin: '0 auto', overflow: "hidden" }}>
                    <Row gutter={[20, 20]}>
                        {/* <Col md={4} sm={0} xs={0}>
                            <div style={{ padding: "20px", background: '#fff', borderRadius: 5 }}>
                                <div style={{ display: 'flex', justifyContent: "space-between" }}>
                                    <span> <FilterTwoTone />
                                        <span style={{ fontWeight: 500 }}> Bộ lọc tìm kiếm</span>
                                    </span>
                                    <ReloadOutlined title="Reset" onClick={() => {
                                        form.resetFields();
                                        setFilter('');
                                    }}
                                    />
                                </div>
                                <Divider />
                                <Form
                                    onFinish={onFinish}
                                    form={form}
                                    onValuesChange={(changedValues, values) => handleChangeFilter(changedValues, values)}
                                >
                           
                                    <Form.Item
                                        label="Khoảng giá"
                                        labelCol={{ span: 24 }}
                                    >
                                        <Row gutter={[10, 10]} style={{ width: "100%" }}>
                                            <Col xl={11} md={24}>
                                                <Form.Item name={["range", 'from']}>
                                                    <InputNumber
                                                        name='from'
                                                        min={0}
                                                        placeholder="đ TỪ"
                                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xl={2} md={0}>
                                                <div > - </div>
                                            </Col>
                                            <Col xl={11} md={24}>
                                                <Form.Item name={["range", 'to']}>
                                                    <InputNumber
                                                        name='to'
                                                        min={0}
                                                        placeholder="đ ĐẾN"
                                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <div>
                                            <Button onClick={() => form.submit()}
                                                style={{ width: "100%" }} type='primary'>Áp dụng</Button>
                                        </div>
                                    </Form.Item>
                                    <Divider />
                                    <Form.Item
                                        label="Đánh giá"
                                        labelCol={{ span: 24 }}
                                    >
                                        <div>
                                            <Rate value={5} disabled style={{ color: '#ffce3d', fontSize: 15 }} />
                                            <span className="ant-rate-text"></span>
                                        </div>
                                        <div>
                                            <Rate value={4} disabled style={{ color: '#ffce3d', fontSize: 15 }} />
                                            <span className="ant-rate-text">trở lên</span>
                                        </div>
                                        <div>
                                            <Rate value={3} disabled style={{ color: '#ffce3d', fontSize: 15 }} />
                                            <span className="ant-rate-text">trở lên</span>
                                        </div>
                                        <div>
                                            <Rate value={2} disabled style={{ color: '#ffce3d', fontSize: 15 }} />
                                            <span className="ant-rate-text">trở lên</span>
                                        </div>
                                        <div>
                                            <Rate value={1} disabled style={{ color: '#ffce3d', fontSize: 15 }} />
                                            <span className="ant-rate-text">trở lên</span>
                                        </div>
                                    </Form.Item>
                                </Form>
                            </div>
                        </Col> */}

                        <Col md={24} xs={24} >
                            <Spin spinning={isLoading} tip="Loading...">
                                <div style={{ padding: "20px", background: '#fff', borderRadius: 5 }}>
                                    <Row >
                                        <Tabs
                                            defaultActiveKey="sort=-sold"
                                            items={items}
                                            onChange={(value) => { setSortQuery(value) }}
                                            style={{ overflowX: "auto" }}
                                        />
                                        <Col xs={24} md={0}>
                                            <div style={{ marginBottom: 20 }} >
                                                <span onClick={() => setShowMobileFilter(true)}>
                                                    <FilterTwoTone />
                                                    <span style={{ fontWeight: 500 }}> Lọc</span>
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row className='customize-row'>
                                        {listProduct?.map((item, index) => {
                                            return (
                                                <div
                                                    onClick={() => navigate(`/Product/${item._id}`)}
                                                    className="column" key={`Product-${index}`}>
                                                    <div className='wrapper'>
                                                        <div className='thumbnail'>
                                                            <img src={`${import.meta.env.VITE_BACKEND_URL}/images/Product/${item.thumbnail}`} alt="thumbnail Product" />
                                                        </div>
                                                        <div className='text' title={item.mainText}>{item.mainText}</div>
                                                        <div className='price'>
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item?.price ?? 0)}
                                                        </div>
                                                        <div className='rating'>
                                                            <Rate value={5} disabled style={{ color: '#ffce3d', fontSize: 10 }} />
                                                            <span>Đã bán {item?.sold ?? 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </Row>
                                    <div style={{ marginTop: 30 }}></div>
                                    <Row style={{ display: "flex", justifyContent: "center" }}>
                                        <Pagination
                                            current={current}
                                            total={total}
                                            pageSize={pageSize}
                                            responsive
                                            onChange={(p, s) => handleOnchangePage({ current: p, pageSize: s })}
                                        />
                                    </Row>
                                </div>
                            </Spin>
                        </Col>
                    </Row>
                </div>
            </div>
            <MobileFilter
                isOpen={showMobileFilter}
                setIsOpen={setShowMobileFilter}
                handleChangeFilter={handleChangeFilter}
                listCategory={listCategory}
                onFinish={onFinish}
            />
        </>
    )
}

export default HomePage;