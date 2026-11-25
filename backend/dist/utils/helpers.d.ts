export declare const generateOrderNumber: () => string;
export declare const slugify: (text: string) => string;
export declare const paginationMeta: (total: number, page: number, limit: number) => {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
export declare const getPaginationParams: (query: Record<string, unknown>) => {
    page: number;
    limit: number;
    skip: number;
};
//# sourceMappingURL=helpers.d.ts.map