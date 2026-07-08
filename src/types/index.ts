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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: string;
  role: UserRole;
}


export interface Club {
  id: string;
  name: string;
  location: string;
  members: number;
  description: string;
  image: string;
}

export interface Booking {
  id: string;
  courtId: string;
  userId: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalAmount: number;
}
