export interface Company {
    id: string;
    userId: string;
    name: string;
    category?: 'primary' | 'secondary';
    color?: string;
    description?: string;
    createdAt?: Date;
}
