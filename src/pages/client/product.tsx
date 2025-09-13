import ProductDetail from "@/components/client/product/product.detail";
import ProductLoader from "@/components/client/product/product.loader";
import { getProductByIdAPI } from "@/services/api";
import { App } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ProductPage = () => {
    let { id } = useParams();
    const { notification } = App.useApp();
    const [currentProduct, setCurrentProduct] = useState<IProductTable | null>(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(true);

    useEffect(() => {
        if (id) {
            const fetchProductById = async () => {
                setIsLoadingProduct(true);
                const res = await getProductByIdAPI(id);
                console.log("check res.dat của Product: ", res.data)
                if (res && res.data) {
                    setCurrentProduct(res.data);
                } else {
                    notification.error({
                        message: 'Đã có lỗi xảy ra',
                        description: res.message
                    })
                }
                setIsLoadingProduct(false);
            }
            fetchProductById();
        }
    }, [id])
    return (
        <div>
            {isLoadingProduct ?
                <ProductLoader />
                :
                <ProductDetail
                    currentProduct={currentProduct}
                />
            }
        </div>
    )
}

export default ProductPage;
