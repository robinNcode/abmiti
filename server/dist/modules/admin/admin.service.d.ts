type RecordData = Record<string, any>;
export declare const adminService: {
    publicConfig: () => Promise<any>;
    saveConfig: (data: RecordData) => Promise<any>;
    contact: (data: RecordData) => Promise<any>;
    contacts: (page?: number, limit?: number) => Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
    } | {
        data: import("mysql2").QueryResult;
        total: number;
        page: number;
        limit: number;
    }>;
    posts: () => Promise<any>;
    publicPosts: () => Promise<any[]>;
    postBySlug: (slug: string) => Promise<any>;
    savePost: (data: RecordData) => Promise<any>;
    deletePost: (id: string) => Promise<any>;
    deleteContact: (id: string) => Promise<any>;
    resolveContact: (id: string, is_resolved: boolean) => Promise<any>;
    isUserAdmin: (userId: string) => Promise<boolean>;
    filterNonAdminUserIds: (userIds: string[]) => Promise<string[]>;
    notifications: (userId: string) => Promise<any[]>;
    allNotifications: () => Promise<any[]>;
    sendNotification: (data: RecordData) => Promise<any>;
    readNotification: (id: string, userId: string) => Promise<any>;
    readAllNotifications: (userId: string) => Promise<{
        success: boolean;
    }>;
    clearNotification: (id: string, userId: string) => Promise<any>;
    clearAllNotifications: (userId: string) => Promise<{
        success: boolean;
    }>;
    deleteNotification: (id: string) => Promise<any>;
    notificationReport: (startDate?: string, endDate?: string) => Promise<{
        summary: {
            totalSent: number;
            totalEligibleRecipients: number;
            totalReads: number;
            overallReadRate: number;
            totalDismissed: number;
            activeRegularUsers: number;
        };
        dateWise: {
            readRate: number;
            date: string;
            count: number;
            totalEligibleRecipients: number;
            totalReads: number;
            totalDismissed: number;
            notifications: any[];
        }[];
        notifications: {
            id: any;
            _id: any;
            title: any;
            message: any;
            targetUserId: any;
            targetType: string;
            eligibleRecipients: number;
            readCount: any;
            readRate: number;
            clearedCount: any;
            readBy: any;
            clearedBy: any;
            date: string;
            createdAt: any;
        }[];
    }>;
    paymentByTransaction: (transactionId: string) => Promise<any>;
    savePayment: (data: RecordData) => Promise<any>;
    allPayments: () => Promise<any>;
    activateSubscription: (userId: string, transactionId: string, plan: string) => Promise<any>;
    subscriptions: (userId: string) => Promise<any[] | import("mysql2").OkPacket | import("mysql2").ResultSetHeader | import("mysql2").ResultSetHeader[] | import("mysql2").RowDataPacket[] | import("mysql2").RowDataPacket[][] | import("mysql2").OkPacket[] | [import("mysql2").RowDataPacket[], import("mysql2").ResultSetHeader]>;
    allSubscriptions: () => Promise<any>;
    users: () => Promise<any[] | import("mysql2").OkPacket | import("mysql2").ResultSetHeader>;
    publicStats: () => Promise<{
        totalUsers: number;
        activeSubscribers: number;
    }>;
    dashboardStats: () => Promise<{
        totalUsers: number;
        totalPosts: number;
        totalContacts: number;
        totalPayments: number;
        totalRevenue: number;
        totalSubscriptions: number;
        activeSubscriptions: number;
    }>;
};
export {};
//# sourceMappingURL=admin.service.d.ts.map