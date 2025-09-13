export { };

declare global {
    interface IBackendRes<T> {
        error?: string | string[];
        message: string;
        statusCode: number | string;
        data?: T;
    }

    interface IModelPaginate<T> {
        meta: {
            current: number;
            pageSize: number;
            pages: number;
            total: number;
        },
        result: T[]
    }

    interface ILogin {
        access_token: string;
        user: {
            email: string;
            phone: string;
            name: string;
            role: string;
            avatar: string;
            id: string;
        }
    }

    interface IRegister {
        _id: string;
        email: string;
        name: string;
        role:string;
    }

    interface IUser {
        email: string;
        phone: string;
        name: string;
        role: string;
        avatar: string;
        _id?: string;
    }

    interface IFetchAccount {
        user: IUser
    }

    interface IUserTable {
        _id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        avatar: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }

    interface IResponseImport {
        countSuccess: number;
        countError: number;
        detail: any;
    }

    interface IProductTable {
        _id: string;
        name:string;
        thumbnail: string;
        slider: string[];
        mainText: string;
        desc:string;
        price: number;
        sold: number;
        quantity: number;
        category: string;
        createdAt: Date;
        updatedAt: Date;
    }

    interface ICart {
        _id: string;
        quantity: number;
        detail: IProductTable;
    }

    interface IHistory {
        _id: string;
        name: string;
        type: string;
        email: string;
        phone: string;
        detail:
        {
            ProductName: string;
            quantity: number;
            _id: string;
        }[];
        totalPrice: number;
        createdAt: Date;
        updatedAt: Date;
    }

    interface ICategory {
        _id: string;
        name: string;
        createdAt?: Date;
        updatedAt?: Date;
    }

    interface IOrderTable extends IHistory {

    }

}
