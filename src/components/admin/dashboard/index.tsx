import { getDashboardAPI } from "@/services/api";
import { Card, Col, Row, Statistic, Table, Tag } from "antd";
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

    useEffect(() => {
        const initDashboard = async () => {
            const res = await getDashboardAPI();
            if (res && res.data) setDataDashboard(res.data);
        };
        initDashboard();
    }, []);

    const formatter = (value: any) => <CountUp end={value} separator="," />;

    // ========================== BẢNG: Thống kê danh mục ==========================
    const columnsCategories = [
        { title: "Tên danh mục", dataIndex: "categoryName", key: "categoryName" },
        {
            title: "Số lượng sản phẩm",
            dataIndex: "productCount",
            key: "productCount",
            render: (v: number) => v.toLocaleString(),
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
                return <Tag color={color}>{v}</Tag>;
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

    return (
        <div style={{ padding: 10 }}>
            {/* 4 ô thống kê tổng */}
            <Row gutter={[30, 30]}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Tổng doanh thu (VNĐ)"
                            value={dataDashboard.totalRevenue}
                            formatter={formatter}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Tổng đơn hàng"
                            value={dataDashboard.totalOrders}
                            formatter={formatter}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Tổng sản phẩm"
                            value={dataDashboard.totalProducts}
                            formatter={formatter}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Tổng danh mục"
                            value={dataDashboard.totalCategories}
                            formatter={formatter}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Bảng thống kê danh mục */}
            <Row gutter={[20, 20]} style={{ marginTop: 40 }}>
                <Col span={24}>
                    <Card title="Thống kê danh mục sản phẩm">
                        <Table
                            columns={columnsCategories}
                            dataSource={dataDashboard.categoriesStats}
                            rowKey="categoryName"
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
