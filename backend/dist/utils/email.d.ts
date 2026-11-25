interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare const sendEmail: ({ to, subject, html }: EmailOptions) => Promise<void>;
export declare const emailTemplates: {
    verifyEmail: (name: string, link: string) => string;
    resetPassword: (name: string, link: string) => string;
    orderConfirmation: (name: string, orderNumber: string, total: number) => string;
    sellerApproved: (shopName: string) => string;
};
export {};
//# sourceMappingURL=email.d.ts.map