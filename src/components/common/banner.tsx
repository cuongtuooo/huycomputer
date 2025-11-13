import { useRef } from "react";
import { Carousel } from "antd";
import type { CarouselRef } from "antd/es/carousel";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "./banner.scss";

type BannerItem = { id: string | number; img: string; alt?: string };

interface Props {
    items: BannerItem[];
    autoplaySpeed?: number; // ms, mặc định 3000
}

const Banner = ({ items, autoplaySpeed = 3000 }: Props) => {
    const ref = useRef<CarouselRef>(null);

    return (
        <div className="banner-container">
            {/* Nút điều khiển thủ công */}
            <button
                aria-label="Previous"
                className="banner-arrow banner-arrow--prev"
                onClick={() => ref.current?.prev()}
            >
                <LeftOutlined />
            </button>

            <button
                aria-label="Next"
                className="banner-arrow banner-arrow--next"
                onClick={() => ref.current?.next()}
            >
                <RightOutlined />
            </button>

            {/* Slider */}
            <Carousel
                ref={ref}
                autoplay
                autoplaySpeed={autoplaySpeed}
                dots
                pauseOnHover={false}
                draggable
                swipeToSlide
                infinite
            >
                {items.map((b) => (
                    <div className="banner-slide" key={b.id}>
                        <img src={b.img} alt={b.alt || "banner"} />
                    </div>
                ))}
            </Carousel>
        </div>
    );
};

export default Banner;
