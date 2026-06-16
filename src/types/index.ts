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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: string;
  role: 'player' | 'admin' | 'owner';
}

export interface Tournament {
  id: string;
  title: string;
  date: string;
  location: string;
  prize: string;
  participants: number;
  maxParticipants: number;
  image: string;
  status: 'upcoming' | 'ongoing' | 'completed';
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
