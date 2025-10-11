import { fetchAccountAPI } from "@/services/api";
import { createContext, useContext, useEffect, useState } from "react";
import { Spin } from "antd"; // ✅ thêm dòng này
import "antd/dist/reset.css"; // nếu chưa import css

interface IAppContext {
    isAuthenticated: boolean;
    setIsAuthenticated: (v: boolean) => void;
    setUser: (v: IUser | null) => void;
    user: IUser | null;
    isAppLoading: boolean;
    setIsAppLoading: (v: boolean) => void;

    carts: ICart[];
    setCarts: (v: ICart[]) => void;
}

const CurrentAppContext = createContext<IAppContext | null>(null);

type TProps = {
    children: React.ReactNode
};

export const AppProvider = (props: TProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<IUser | null>(null);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
    const [carts, setCarts] = useState<ICart[]>([]);

    useEffect(() => {
        const fetchAccount = async () => {
            const res = await fetchAccountAPI();
            console.log("check res từ user info", res);
            const carts = localStorage.getItem("carts");
            if (res.data) {
                setUser(res.data.user);
                setIsAuthenticated(true);
                if (carts) setCarts(JSON.parse(carts));
            }
            setIsAppLoading(false);
        };

        fetchAccount();
    }, []);

    return (
        <>
            {!isAppLoading ? (
                <CurrentAppContext.Provider
                    value={{
                        isAuthenticated,
                        user,
                        setIsAuthenticated,
                        setUser,
                        isAppLoading,
                        setIsAppLoading,
                        carts,
                        setCarts,
                    }}
                >
                    {props.children}
                </CurrentAppContext.Provider>
            ) : (
                <div
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                    }}
                >
                    <Spin size="large" tip="Đang tải dữ liệu..." /> {/* ✅ loader mới */}
                </div>
            )}
        </>
    );
};

export const useCurrentApp = () => {
    const currentAppContext = useContext(CurrentAppContext);
    if (!currentAppContext) {
        throw new Error(
            "useCurrentApp has to be used within <CurrentAppContext.Provider>"
        );
    }
    return currentAppContext;
};
