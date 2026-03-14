// Types partagés entre toutes les applications

export type UserRole = 'TENANT' | 'OWNER' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'CASH' | 'SPLIT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
export type NotificationType =
  | 'NEW_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'NEW_MESSAGE'
  | 'SPLIT_INVITE'
  | 'LISTING_VERIFIED'
  | 'LISTING_REJECTED'
  | 'REVIEW_RECEIVED';

export interface UserPublic {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  role: UserRole;
  createdAt: string;
}

export interface NuclearPlantSummary {
  id: string;
  name: string;
  city: string;
  department: string;
  region: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  reactorCount: number;
  listingsCount?: number;
}

export interface ListingSummary {
  id: string;
  title: string;
  city: string;
  pricePerWeek: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  photos: string[];
  rating: number | null;
  reviewCount: number;
  distanceToPlant: number | null;
  isVerified: boolean;
  nuclearPlant: {
    id: string;
    name: string;
  };
}

export interface ListingDetail extends ListingSummary {
  description: string;
  address: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  houseRules: string | null;
  owner: UserPublic;
  reviews: ReviewSummary[];
  availabilities: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: string;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
}

export interface BookingSummary {
  id: string;
  listing: ListingSummary;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfWeeks: number;
  totalPrice: number;
  weeklyPrice: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  payments: PaymentSummary[];
  splitPayments: SplitPaymentSummary[];
}

export interface PaymentSummary {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  weekNumber: number;
  dueDate: string;
  paidAt: string | null;
}

export interface SplitPaymentSummary {
  id: string;
  payerName: string | null;
  payerEmail: string | null;
  amount: number;
  isPaid: boolean;
  weekNumber: number;
  inviteToken: string;
}

export interface ReviewSummary {
  id: string;
  author: UserPublic;
  rating: number;
  comment: string;
  response: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  otherUser: UserPublic;
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  bookingId: string | null;
}

export interface MessageData {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingListings: number;
  bookingsByPlant: { plantName: string; count: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

export interface WeeklyPaymentSchedule {
  weekNumber: number;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
}

export interface BookingPriceBreakdown {
  weeklyPrice: number;
  numberOfWeeks: number;
  subtotal: number;
  platformFee: number;
  deposit: number;
  totalFirstPayment: number;
}
