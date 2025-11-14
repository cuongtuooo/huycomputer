import { useState } from "react";
import { Card, Row, Col, Button } from "antd";
import dayjs from "dayjs";

const { Meta } = Card;

/* =======================================================
   🎯 DATA MẪU CHO BLOG (Bạn có thể bổ sung thêm)
======================================================= */
const blogData = [
    {
        id: "1",
        title: "Top 5 Laptop Văn Phòng Đáng Mua Nhất 2025",
        thumbnail: "https://i.imgur.com/ieE7YKT.jpeg",
        description:
            "Danh sách 5 mẫu laptop văn phòng bền – đẹp – mượt dành cho sinh viên và dân công sở.",
        date: "2025-01-15",
        content: `
<h2>Top 5 laptop văn phòng tốt nhất 2025</h2>

<h3>1. Dell Inspiron 14 5430</h3>
<ul>
  <li>CPU mạnh mẽ</li>
  <li>Pin trâu</li>
  <li>Thiết kế sang trọng</li>
  <li>Giá chỉ từ 15–17 triệu</li>
</ul>

<h3>2. Lenovo ThinkPad E14 Gen 4</h3>
<ul>
  <li>Bền nhất phân khúc</li>
  <li>Gõ phím cực thích</li>
  <li>Rất phù hợp dân văn phòng</li>
</ul>

<blockquote>
  Đây là danh sách do Huy Computer tổng hợp dựa trên nhu cầu thực tế.
</blockquote>
`,
    },
    {
        id: "2",
        title: "Cách Chọn Laptop Gaming Tốt Nhất Theo Ngân Sách",
        thumbnail: "https://i.imgur.com/cR5yFll.jpeg",
        description:
            "Laptop gaming cần GPU mạnh, tản nhiệt tốt và màn hình xịn.",
        date: "2025-01-10",
        content: `
<h2>Hướng dẫn chọn laptop gaming theo ngân sách</h2>

<h3>Dưới 20 triệu</h3>
<p>RTX 2050 / GTX 1650 – phù hợp game nhẹ.</p>

<h3>20–30 triệu</h3>
<p>RTX 3050 / 3050Ti – best choice cho sinh viên.</p>

<h3>Trên 30 triệu</h3>
<p>RTX 4060 / 4070 – chiến mọi game AAA.</p>
`,
    },
    {
        id: "3",
        title: "Tại Sao Nên Mua Laptop Tại Huy Computer?",
        thumbnail: "https://i.imgur.com/UN8PvMo.jpeg",
        description:
            "Uy tín – bảo hành chuẩn hãng – giá tốt – hỗ trợ tận tâm.",
        date: "2025-01-02",
        content: `
<h2>Vì sao khách chọn Huy Computer?</h2>

<ul>
  <li>Hàng chính hãng 100%</li>
  <li>Bảo hành 12–36 tháng</li>
  <li>Giá rẻ nhất khu vực</li>
  <li>Hỗ trợ kỹ thuật trọn đời</li>
</ul>
`,
    },
];

/* =======================================================
   🎨 COMPONENT GOM TẤT CẢ THÀNH 1 TRANG BLOG
======================================================= */
const BlogPage = () => {
    const [current, setCurrent] = useState<any>(null); // null = list, object = detail

    // =====================================================
    //  🔵 MÀN LIST BÀI VIẾT
    // =====================================================
    if (!current) {
        return (
            <div style={{ maxWidth: 1200, margin: "30px auto" }}>
                <h1 style={{ marginBottom: 24 }}>📚 Blog – Tin tức & Công nghệ</h1>

                <Row gutter={[24, 24]}>
                    {blogData.map((blog) => (
                        <Col xs={24} sm={12} md={8} key={blog.id}>
                            <Card
                                hoverable
                                cover={
                                    <img
                                        src={blog.thumbnail}
                                        style={{ height: 180, objectFit: "cover" }}
                                    />
                                }
                                onClick={() => setCurrent(blog)}
                            >
                                <Meta
                                    title={blog.title}
                                    description={
                                        <div>
                                            <p style={{ marginBottom: 6 }}>{blog.description}</p>
                                            <small style={{ color: "#888" }}>
                                                {dayjs(blog.date).format("DD/MM/YYYY")}
                                            </small>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }

    // =====================================================
    //  🔵 MÀN CHI TIẾT
    // =====================================================
    return (
        <div style={{ maxWidth: 850, margin: "30px auto" }}>
            <Button onClick={() => setCurrent(null)}>⬅ Quay lại</Button>

            <h1 style={{ marginTop: 20 }}>{current.title}</h1>
            <p style={{ color: "#888" }}>
                {dayjs(current.date).format("DD/MM/YYYY")}
            </p>

            <img
                src={current.thumbnail}
                style={{ width: "100%", borderRadius: 8, margin: "20px 0" }}
            />

            <article
                style={{ fontSize: 17, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: current.content }}
            />
        </div>
    );
};

export default BlogPage;
