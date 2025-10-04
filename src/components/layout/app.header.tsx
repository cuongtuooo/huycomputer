import { useState } from 'react';
import { FaReact } from 'react-icons/fa'
import { FiShoppingCart } from 'react-icons/fi';
import { VscSearchFuzzy } from 'react-icons/vsc';
import { Divider, Badge, Drawer, Popover, Empty } from 'antd';
import { Dropdown, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './app.header.scss';
import { Link } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context';
import { logoutAPI } from '@/services/api';
import ManageAccount from '../client/account';
import { isMobile } from 'react-device-detect';

interface IProps {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
}

const AppHeader = (props: IProps) => {
    const [openDrawer, setOpenDrawer] = useState(false);
    const [openManageAccount, setOpenManageAccount] = useState<boolean>(false);

    const {
        isAuthenticated, user, setUser, setIsAuthenticated,
        carts, setCarts
    } = useCurrentApp();

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        const res = await logoutAPI();
        if (res.data) {
            setUser(null);
            setCarts([]);
            setIsAuthenticated(false);
            localStorage.removeItem("access_token");
            localStorage.removeItem("carts");
        }
    };

    // Click logo: về trang chủ hoặc reload
    const handleLogoClick = () => {
        // luôn reset ô tìm kiếm về rỗng
        props.setSearchTerm('');

        if (location.pathname === '/') {
            // Đang ở trang chủ: chọn 1 trong 2 cách bên dưới

            // Cách 1: reload mềm (react-router revalidate) – nhanh hơn
            // navigate(0);

            // Cách 2: reload cứng toàn trang – sạch mọi thứ
            window.location.reload();
        } else {
            // Ở trang khác: chuyển về trang chủ
            navigate('/');
            // Scroll lên đầu cho đẹp
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
    };

    let items = [
        {
            label: <label style={{ cursor: 'pointer' }} onClick={() => setOpenManageAccount(true)}>Quản lý tài khoản</label>,
            key: 'account',
        },
        {
            label: <Link to="/history">Lịch sử mua hàng</Link>,
            key: 'history',
        },
        {
            label: <Link to="/orders">Theo dõi đơn hàng</Link>,
            key: 'orders'
        },
        {
            label: <label style={{ cursor: 'pointer' }} onClick={() => handleLogout()}>Đăng xuất</label>,
            key: 'logout',
        },
    ];

    // @ts-expect-error
    if (user?.role.name === 'SUPER_ADMIN') {
        items.unshift({
            label: <Link to='/admin'>Trang quản trị</Link>,
            key: 'admin',
        })
    }

    const contentPopover = () => {
        return (
            <div className='pop-cart-body'>
                <div className='pop-cart-content'>
                    {carts?.map((product, index) => {
                        return (
                            <div className='book' key={`book-${index}`}>
                                <img src={`${import.meta.env.VITE_BACKEND_URL}/images/Product/${product?.detail?.thumbnail}`} />
                                <div>{product?.detail?.name}</div>
                                <div className='price'>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product?.detail?.price ?? 0)}
                                </div>
                            </div>
                        )
                    })}
                </div>
                {carts.length > 0 ?
                    <div className='pop-cart-footer'>
                        <button onClick={() => navigate('/order')}>Xem giỏ hàng</button>
                    </div>
                    :
                    <Empty description="Không có sản phẩm trong giỏ hàng" />
                }
            </div>
        )
    }

    return (
        <>
            <div className='header-container'>
                <header className="page-header">
                    <div className="page-header__top">
                        <div className="page-header__toggle" onClick={() => setOpenDrawer(true)}>☰</div>

                        <div className="page-header__logo">
                            <span
                                className="logo"
                                onClick={() => {
                                    props.setSearchTerm('');
                                    window.location.href = "/";  // vừa về trang chủ vừa reload
                                }}
                            >
                                <FaReact className="rotate icon-react" />
                                Huy Computer
                            </span>

                            {/* Search box */}
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

                    </div>

                    <nav className="page-header__bottom">
                        <ul id="navigation" className="navigation">
                            <li className="navigation__item">
                                {!isMobile ? (
                                    <Popover
                                        className="popover-carts"
                                        placement="topRight"
                                        rootClassName="popover-carts"
                                        title={"Sản phẩm mới thêm"}
                                        content={contentPopover}
                                        arrow
                                    >
                                        <Badge count={carts?.length ?? 0} size="small" showZero>
                                            <FiShoppingCart className="icon-cart" />
                                        </Badge>
                                    </Popover>
                                ) : (
                                    <Badge count={carts?.length ?? 0} size="small" showZero onClick={() => navigate("/order")}>
                                        <FiShoppingCart className="icon-cart" />
                                    </Badge>
                                )}
                            </li>

                            <li className="navigation__item mobile">
                                <Divider type="vertical" />
                            </li>

                            <li className="navigation__item mobile">
                                {!isAuthenticated ? (
                                    <span onClick={() => navigate('/login')}>Đăng nhập/Đăng ký</span>
                                ) : (
                                    <Dropdown menu={{ items }} trigger={['click']}>
                                        <Space>{user?.name}</Space>
                                    </Dropdown>
                                )}
                            </li>
                        </ul>
                    </nav>
                </header>
            </div>

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

            <ManageAccount
                isModalOpen={openManageAccount}
                setIsModalOpen={setOpenManageAccount}
            />
        </>
    )
};

export default AppHeader;
