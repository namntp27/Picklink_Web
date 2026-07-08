export interface Court {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  features: string[];
}

export type UserRole = 'player' | 'admin' | 'owner' | 'staff';

export interface Club {
  id: string;
  name: string;
  location: string;
  members: number;
  description: string;
  image: string;
}