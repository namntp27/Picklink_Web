export type VenueStatus = 'Draft' | 'PendingApproval' | 'Published' | 'Rejected' | 'Suspended';
export type CourtStatus = 'Available' | 'Maintenance' | 'Inactive';

export type Province = { id: string; code: number; name: string };
export type Ward = { id: string; code: number; name: string };

export type OpeningHour = {
  dayOfWeek: number;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
};

export type VenueImage = {
  id?: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type CourtSummary = {
  id: string;
  name: string;
  code: string;
  pricePerHour: number;
  slotDurationMinutes: number;
  status: CourtStatus;
  imageUrl?: string | null;
};

export type VenueListItem = {
  id: string;
  name: string;
  provinceName: string;
  wardName: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  status: VenueStatus;
  courtCount: number;
  imageUrl?: string | null;
};

export type VenueDetail = {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  streetAddress: string;
  provinceId: string;
  provinceName: string;
  wardId: string;
  wardName: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  status: VenueStatus;
  rejectionReason?: string | null;
  amenities: string[];
  images: VenueImage[];
  openingHours: OpeningHour[];
  courts: CourtSummary[];
};

export type CourtListItem = CourtSummary & {
  venueId: string;
  venueName: string;
  provinceName: string;
  wardName: string;
  latitude: number;
  longitude: number;
};

export type BlockedSlot = {
  id: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
};

export type CourtDetail = {
  id: string;
  venueId: string;
  name: string;
  code: string;
  venueName: string;
  streetAddress: string;
  provinceName: string;
  wardName: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  slotDurationMinutes: number;
  status: CourtStatus;
  images: VenueImage[];
  openingHours: OpeningHour[];
  blockedSlots: BlockedSlot[];
};

export type VenueInput = {
  name: string;
  description?: string;
  streetAddress: string;
  provinceId: string;
  wardId: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  images: Omit<VenueImage, 'id'>[];
  openingHours: OpeningHour[];
};

export type CourtInput = {
  venueId?: string;
  name: string;
  code: string;
  pricePerHour: number;
  slotDurationMinutes: number;
  status: CourtStatus;
  images: Omit<VenueImage, 'id'>[];
};
