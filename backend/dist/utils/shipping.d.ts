export interface ShipmentRequest {
    orderId: string;
    pickupAddress: {
        name: string;
        address: string;
        city: string;
        state: string;
        pinCode: string;
        phone: string;
    };
    deliveryAddress: {
        fullName: string;
        phone: string;
        line1: string;
        city: string;
        state: string;
        pinCode: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        weight?: number;
    }>;
    weight: number;
}
export interface TrackingInfo {
    trackingNumber?: string;
    trackingUrl?: string;
    status?: string;
    estimatedDelivery?: string;
}
export declare const shippingService: {
    createShipment(request: ShipmentRequest): Promise<TrackingInfo>;
    trackShipment(trackingNumber: string): Promise<TrackingInfo>;
    calculateShipping(subtotal: number): number;
};
//# sourceMappingURL=shipping.d.ts.map