export type UserLike = {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: {
        slug: string;
    };
};
