import { getDashboardAPI } from "@/services/api";
import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
    DollarOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    TagsOutlined,
    CoffeeOutlined,
    LaptopOutlined,
    GiftOutlined,
    HomeOutlined,
    NumberOutlined,
    ToolOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import CountUp from "react-countup";

const AdminDashboard = () => {
    const [dataDashboard, setDataDashboard] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCategories: 0,
        categoriesStats: [] as any[],
        recentOrders: [] as any[],
        lowStockProducts: [] as any[],
        topSellingProducts: [] as any[],
    });

    const displayStatus = {
        RETURN_RECEIVED: "Trả hàng",
        RECEIVED: "Đã nhận",
        SHIPPING: "Đang giao",
        DELIVERED: "Đã giao",
        CANCELED: "Đã hủy",
    };

    useEffect(() => {
        const initDashboard = async () => {
            const res = await getDashboardAPI();
            if (res && res.data) setDataDashboard(res.data);
        };
        initDashboard();
    }, []);

    const formatter = (value: any) => <CountUp end={value} separator="," />;

    // Icon theo tên danh mục (tùy biến thêm nếu bạn có nhiều danh mục)
    const getCategoryIcon = (name?: string) => {
        const key = (name || "").toLowerCase().trim();
        const commonStyle = { fontSize: 18 };

        if (key.includes("điện") || key.includes("electronics") || key.includes("tech"))
            return <LaptopOutlined style={{ ...commonStyle, color: "#1677ff" }} />;

        if (key.includes("đồ ăn") || key.includes("thực phẩm") || key.includes("food"))
            return <CoffeeOutlined style={{ ...commonStyle, color: "#52c41a" }} />;

        if (key.includes("phụ kiện") || key.includes("accessory"))
            return <ToolOutlined style={{ ...commonStyle, color: "#fa8c16" }} />;

        if (key.includes("quà") || key.includes("gift"))
            return <GiftOutlined style={{ ...commonStyle, color: "#eb2f96" }} />;

        if (key.includes("gia dụng") || key.includes("nhà"))
            return <HomeOutlined style={{ ...commonStyle, color: "#722ed1" }} />;

        // mặc định
        return <TagsOutlined style={{ ...commonStyle, color: "#595959" }} />;
    };

    // ========================== BẢNG: Thống kê danh mục ==========================
    const columnsCategories = [
        {
            title: "Tên danh mục",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: any) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getCategoryIcon(text)}
                    <strong>{text}</strong>
                </div>
            ),
        },
        {
            title: "Danh mục con",
            dataIndex: "children",
            key: "children",
            render: (children: any[]) =>
                children?.length ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {children.map((c) => (
                            <li key={c._id}>
                                {c.name} ({c.totalProducts ?? c.productCount ?? 0} SP)
                            </li>
                        ))}
                    </ul>
                ) : (
                    <i>Không có</i>
                ),
        },
        {
            title: "Số sản phẩm (bao gồm danh mục con)",
            dataIndex: "totalProducts",
            key: "totalProducts",
            render: (v: number) => (
                <span style={{ fontWeight: 600 }}>
                    {v?.toLocaleString?.() ?? 0}
                </span>
            ),
        },
    ];



    // ========================== BẢNG: Đơn hàng gần đây ==========================
    const columnsRecentOrders = [
        { title: "Mã đơn", dataIndex: "_id", key: "_id", ellipsis: true },
        {
            title: "Khách hàng",
            dataIndex: "name",
            key: "name",
            render: (v: string, record: any) =>
                record.createdBy?.email ? record.createdBy.email : v,
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalPrice",
            key: "totalPrice",
            render: (v: number) => `${v.toLocaleString()} đ`,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (v: string) => {
                const color =
                    v === "DELIVERED"
                        ? "green"
                        : v === "SHIPPING"
                            ? "blue"
                            : v === "CANCELED"
                                ? "red"
                                : "orange";
                return <Tag color={color} >{displayStatus[v] || v}</Tag>;
            },
        },
    ];

    // ========================== BẢNG: Sản phẩm sắp hết hàng ==========================
    const columnsLowStock = [
        { title: "Tên sản phẩm", dataIndex: "name", key: "name" },
        { title: "Danh mục", dataIndex: ["category", "name"], key: "category" },
        {
            title: "Giá",
            dataIndex: "price",
            key: "price",
            render: (v: number) => `${v.toLocaleString()} đ`,
        },
        { title: "Tồn kho", dataIndex: "quantity", key: "quantity" },
    ];

    // ========================== BẢNG: Sản phẩm bán chạy ==========================
    const columnsTopSelling = [
        { title: "Tên sản phẩm", dataIndex: "name", key: "name" },
        { title: "Danh mục", dataIndex: ["category", "name"], key: "category" },
        {
            title: "Giá",
            dataIndex: "price",
            key: "price",
            render: (v: number) => `${v.toLocaleString()} đ`,
        },
        { title: "Đã bán", dataIndex: "sold", key: "sold" },
        { title: "Tồn kho", dataIndex: "quantity", key: "quantity" },
    ];

    // ========================== CARD ICON STYLE ==========================
    const iconBoxStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 50,
        height: 50,
        borderRadius: 12,
    };

    return (
        <div className="admin-dashboard" style={{ padding: 10 }}>
            {/* 4 ô thống kê tổng có icon */}
            <Row gutter={[30, 30]}>
                {/* Doanh thu */}
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                            <div style={{ ...iconBoxStyle, background: "#f6ffed" }}>
                                <DollarOutlined style={{ fontSize: 28, color: "#52c41a" }} />
                            </div>
                            <Statistic
                                title="Tổng doanh thu (VNĐ)"
                                value={dataDashboard.totalRevenue}
                                formatter={formatter}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Đơn hàng */}
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                            <div style={{ ...iconBoxStyle, background: "#e6f4ff" }}>
                                <ShoppingCartOutlined style={{ fontSize: 28, color: "#1677ff" }} />
                            </div>
                            <Statistic
                                title="Tổng đơn hàng"
                                value={dataDashboard.totalOrders}
                                formatter={formatter}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Sản phẩm */}
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                            <div style={{ ...iconBoxStyle, background: "#fffbe6" }}>
                                <AppstoreOutlined style={{ fontSize: 28, color: "#faad14" }} />
                            </div>
                            <Statistic
                                title="Tổng sản phẩm"
                                value={dataDashboard.totalProducts}
                                formatter={formatter}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Danh mục */}
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                            <div style={{ ...iconBoxStyle, background: "#f9f0ff" }}>
                                <TagsOutlined style={{ fontSize: 28, color: "#722ed1" }} />
                            </div>
                            <Statistic
                                title="Tổng danh mục"
                                value={dataDashboard.totalCategories}
                                formatter={formatter}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Bảng thống kê danh mục (đã thêm icon) */}
            <Row gutter={[20, 20]} style={{ marginTop: 40 }}>
                <Col span={24}>
                    <Card title="Thống kê danh mục sản phẩm">
                        <Table
                            columns={columnsCategories}
                            dataSource={dataDashboard.categoriesStats}
                            rowKey="_id"
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Ba bảng song song */}
            <Row gutter={[20, 20]} style={{ marginTop: 30 }}>
                <Col xs={24} md={8}>
                    <Card title="Đơn hàng gần đây">
                        <Table
                            columns={columnsRecentOrders}
                            dataSource={dataDashboard.recentOrders}
                            rowKey="_id"
                            pagination={false}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card title="Sản phẩm sắp hết hàng">
                        <Table
                            columns={columnsLowStock}
                            dataSource={dataDashboard.lowStockProducts}
                            rowKey="name"
                            pagination={false}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card title="Sản phẩm bán chạy">
                        <Table
                            columns={columnsTopSelling}
                            dataSource={dataDashboard.topSellingProducts}
                            rowKey="name"
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
