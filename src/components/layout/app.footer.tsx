import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Divider, Input, Button, Space, BackTop, Tooltip } from "antd";
import {
    FaFacebookF,
    FaYoutube,
    FaTiktok,
    FaPhoneAlt,
    FaEnvelope,
    FaMapMarkerAlt,
    FaReact,
    FaRegCopyright,
    FaCcVisa,
    FaCcMastercard,
    FaCcJcb,
    FaCcPaypal,
} from "react-icons/fa";
import "./app.footer.scss";

const AppFooter = () => {
    const year = useMemo(() => new Date().getFullYear(), []);

    const handleSubscribe = () => {
        // TODO: call API subscribe newsletter
        // message.success("Đăng ký nhận tin thành công!");
        console.log("subscribe newsletter");
    };

    return (
        <footer className="app-footer">
            {/* Newsletter */}

            <Divider className="divider-zero" />

            {/* Main columns */}
            <div className="footer-main container">
                <div className="col">
                    <div className="col-title">Về chúng tôi</div>
                    <ul className="col-list">
                        <li><Link to="/">Giới thiệu</Link></li>
                        <li><Link to="/">Tuyển dụng</Link></li>
                        <li><Link to="/">Tin tức & Blog</Link></li>
                        <li><Link to="/">Liên hệ</Link></li>
                    </ul>
                </div>

                <div className="col">
                    <div className="col-title">Hỗ trợ khách hàng</div>
                    <ul className="col-list">
                        <li><Link to="/">Hướng dẫn mua hàng</Link></li>
                        <li><Link to="/">Thanh toán & Trả góp</Link></li>
                        <li><Link to="/">Vận chuyển & Giao hàng</Link></li>
                        <li><Link to="/">Bảo hành & Đổi trả</Link></li>
                        <li><Link to="/">Theo dõi đơn hàng</Link></li>
                    </ul>
                </div>

                <div className="col">
                    <div className="col-title">Chính sách</div>
                    <ul className="col-list">
                        <li><Link to="/">Bảo mật thông tin</Link></li>
                        <li><Link to="/">Điều khoản sử dụng</Link></li>
                        <li><Link to="/">Cookie</Link></li>
                        <li><Link to="/">Đổi trả & Hoàn tiền</Link></li>
                    </ul>
                </div>

                <div className="col">
                    <div className="col-title">Liên hệ</div>
                    <ul className="contact-list">
                        <li>
                            <FaMapMarkerAlt /> 123 Đường ABC, Quận XYZ, Hà Nội
                        </li>
                        <li>
                            <FaPhoneAlt /> <a href="tel:0123456789">0123 456 789</a>
                        </li>
                        <li>
                            <FaEnvelope /> <a href="mailto:support@huycomputer.vn">support@huycomputer.vn</a>
                        </li>
                    </ul>

                    <div className="social">
                        <Tooltip title="Facebook">
                            <a href="https://facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                        </Tooltip>
                        <Tooltip title="YouTube">
                            <a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube">
                                <FaYoutube />
                            </a>
                        </Tooltip>
                        <Tooltip title="TikTok">
                            <a href="https://tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok">
                                <FaTiktok />
                            </a>
                        </Tooltip>
                    </div>

                    {/* <div className="payments">
                        <FaCcVisa />
                        <FaCcMastercard />
                        <FaCcJcb />
                        <FaCcPaypal />
                    </div> */}
                </div>
            </div>

            <Divider className="divider-zero" />

            {/* Bottom bar */}
            <div className="footer-bottom">
                <div className="container">
                    <div className="copy">
                        <FaRegCopyright />
                        <span>{year} Huy Computer. All rights reserved.</span>
                    </div>
                    <div className="bottom-links">
                        <Link to="/sitemap">Sitemap</Link>
                        <span className="dot">•</span>
                        <Link to="/policy/privacy">Privacy</Link>
                        <span className="dot">•</span>
                        <Link to="/policy/terms">Terms</Link>
                    </div>
                </div>
            </div>

            {/* Back to top */}
            <BackTop visibilityHeight={300} />
        </footer>
    );
};

export default AppFooter;
