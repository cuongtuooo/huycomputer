import { useState, useEffect } from 'react';
import {
    DownOutlined,
  
} from '@ant-design/icons';
import { FiShoppingCart } from 'react-icons/fi';
import { Badge, Popover, Dropdown, Space, Divider, Empty, Drawer } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';
import { logoutAPI, getCategoryAPI } from '@/services/api';
import ManageAccount from '../client/account';
import { isMobile } from 'react-device-detect';
import './app.header.scss';
import { VscSearchFuzzy } from 'react-icons/vsc';

interface IProps {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
}

const AppHeader = (props: IProps) => {
    const [openDrawer, setOpenDrawer] = useState(false);
    const [openManageAccount, setOpenManageAccount] = useState(false);
    const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);

    const navigate = useNavigate();
    const location = useLocation();

    const {
        isAuthenticated,
        user,
        setUser,
        setIsAuthenticated,
        carts,
        setCarts,
    } = useCurrentApp();

    /* ============== LOAD DANH MỤC ============== */
    useEffect(() => {
        const fetchCats = async () => {
            const res = await getCategoryAPI();
            if (res?.data) {
                const list = res.data.result.map((c: any) => ({
                    label: c.name,
                    value: c._id,
                }));
                setCategories(list);
            }
        };
        fetchCats();
    }, []);

    /* ============== MENU DANH MỤC DROPDOWN ============== */
    const menuCategory = {
        items: categories.map((c) => ({
            key: c.value,
            label: (
                <span
                    onClick={() => {
                        navigate(`/?category=${c.value}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    {c.label}
                </span>
            ),
        })),
    };

    /* ============== MENU NGƯỜI DÙNG ============== */
    const itemsDropdown = [
        ...(user?.role?.name === 'ADMIN'
            ? [
                {
                    label: <Link to="/admin">Trang quản trị</Link>,
                    key: 'admin',
                },
            ]
            : []),
        {
            label: (
                <label
                    style={{ cursor: 'pointer' }}
                    onClick={() => setOpenManageAccount(true)}
                >
                    Quản lý tài khoản
                </label>
            ),
            key: 'account',
        },
        {
            label: <Link to="/history">Lịch sử mua hàng</Link>,
            key: 'history',
        },
        {
            label: <Link to="/orders">Theo dõi đơn hàng</Link>,
            key: 'orders',
        },
        {
            label: (
                <label style={{ cursor: 'pointer' }} onClick={() => handleLogout()}>
                    Đăng xuất
                </label>
            ),
            key: 'logout',
        },
    ];

    /* ============== ĐĂNG XUẤT ============== */
    const handleLogout = async () => {
        const res = await logoutAPI();
        if (res.data) {
            setUser(null);
            setCarts([]);
            setIsAuthenticated(false);
            localStorage.removeItem('access_token');
            localStorage.removeItem('carts');
        }
    };

    /* ============== GIỎ HÀNG NHỎ (POPOVER) ============== */
    const contentPopover = () => (
        <div className="pop-cart-body">
            <div className="pop-cart-content">
                {carts?.map((product, index) => (
                    <div className="book" key={`book-${index}`}>
                        <img
                            src={`${import.meta.env.VITE_BACKEND_URL}/images/Product/${product?.detail?.thumbnail}`}
                        />
                        <div>{product?.detail?.name}</div>
                        <div className="price">
                            {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                            }).format(product?.detail?.price ?? 0)}
                        </div>
                    </div>
                ))}
            </div>
            {carts.length > 0 ? (
                <div className="pop-cart-footer">
                    <button onClick={() => navigate('/order')}>Xem giỏ hàng</button>
                </div>
            ) : (
                <Empty description="Không có sản phẩm trong giỏ hàng" />
            )}
        </div>
    );

    /* ============== JSX ============== */
    return (
        <>
            <div className="header-container">
                <header className="page-header">
                    {/* -------- Cụm trái: logo + search -------- */}
                    <div className="page-header__left">
                        <span
                            className="logo"
                            onClick={() => {
                                props.setSearchTerm('');
                                navigate('/');
                                window.scrollTo({ top: 0, behavior: 'instant' });
                            }}
                        >
                            <img src="logoimg/logomain.png" alt="logo" />
                            Huy Computer
                        </span>

                        <div className="search-group">
                            <VscSearchFuzzy className="icon-search" />
                            <input
                                className="input-search"
                                type="text"
                                placeholder="Bạn tìm gì hôm nay"
                                value={props.searchTerm}
                                onChange={(e) => props.setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* -------- Cụm phải: menu + cart + user -------- */}
                    <ul className="navigation">
                        <li>
                            <Link to="/">Trang chủ</Link>
                        </li>

                        {/* Dropdown danh mục */}
                        <li>
                            <Dropdown menu={menuCategory} trigger={['hover']}>
                                <span>
                                    Sản phẩm <DownOutlined style={{ fontSize: 12 }} />
                                </span>
                            </Dropdown>
                        </li>

                        <li>
                            <Link to="/about">Giới thiệu</Link>
                        </li>
                        <li>
                            <Link to="/contact">Liên hệ</Link>
                        </li>
                        <li>
                            <Link to="/orders">Đơn hàng</Link>
                        </li>

                        {/* Giỏ hàng */}
                        <li>
                            {!isMobile ? (
                                <Popover
                                    placement="bottomRight"
                                    title="Sản phẩm mới thêm"
                                    content={contentPopover}
                                    arrow
                                >
                                    <Badge count={carts?.length ?? 0} size="small" showZero>
                                        <FiShoppingCart className="icon-cart" />
                                    </Badge>
                                </Popover>
                            ) : (
                                <Badge
                                    count={carts?.length ?? 0}
                                    size="small"
                                    showZero
                                    onClick={() => navigate('/order')}
                                >
                                    <FiShoppingCart className="icon-cart" />
                                </Badge>
                            )}
                        </li>

                        {/* User dropdown */}
                        <li>
                            {!isAuthenticated ? (
                                <span onClick={() => navigate('/login')}>Đăng nhập/Đăng ký</span>
                            ) : (
                                <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                                    <Space>{user?.name}</Space>
                                </Dropdown>
                            )}
                        </li>
                    </ul>
                </header>
            </div>

            {/* Drawer menu trên mobile */}
            <Drawer
                title="Menu chức năng"
                placement="left"
                onClose={() => setOpenDrawer(false)}
                open={openDrawer}
            >
                <p onClick={() => setOpenManageAccount(true)}>Quản lý tài khoản</p>
                <Divider />
                <p onClick={() => handleLogout()}>Đăng xuất</p>
                <Divider />
            </Drawer>

            {/* Modal quản lý tài khoản */}
            <ManageAccount
                isModalOpen={openManageAccount}
                setIsModalOpen={setOpenManageAccount}
            />
        </>
    );
};

export default AppHeader;
