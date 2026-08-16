import { apiRequest } from './client';

export type BookingReview = {
  ratingId: number;
  bookingId: number;
  venueId: number;
  venueName: string;
  score: number;
  comment?: string | null;
  tags: string[];
  isAnonymous: boolean;
  createdAt: string;
};

export type CreateBookingReviewInput = {
  score: number;
  comment?: string;
  tags: string[];
  isAnonymous: boolean;
};

export const getBookingReview = (token: string, bookingId: number) =>
  apiRequest<BookingReview>(`/api/player-reviews/booking/${bookingId}`, {}, token);

export const createBookingReview = (token: string, bookingId: number, input: CreateBookingReviewInput) =>
  apiRequest<BookingReview>(`/api/player-reviews/booking/${bookingId}`, {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);

// A rating belongs to the venue, so revising one is addressed by venue rather than by booking.
export const getVenueReview = (token: string, venueId: number) =>
  apiRequest<BookingReview>(`/api/player-reviews/venue/${venueId}`, {}, token);

export const updateVenueReview = (token: string, venueId: number, input: CreateBookingReviewInput) =>
  apiRequest<BookingReview>(`/api/player-reviews/venue/${venueId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }, token);

export const getMatchVenueReviews = (token: string, matchId: number) =>
  apiRequest<BookingReview[]>(`/api/matches/${matchId}/venue-reviews`, {}, token);
