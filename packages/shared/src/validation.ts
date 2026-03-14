import { z } from 'zod';

// Schémas de validation Zod partagés entre l'API et les clients

export const registerSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  role: z.enum(['TENANT', 'OWNER']).default('TENANT'),
});

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const createListingSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(100),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères'),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  pricePerWeek: z.number().positive('Le prix doit être positif').max(5000),
  maxGuests: z.number().int().min(1).max(20),
  bedrooms: z.number().int().min(1).max(10),
  bathrooms: z.number().int().min(1).max(5),
  amenities: z.array(z.string()).default([]),
  houseRules: z.string().optional(),
  nuclearPlantId: z.string().min(1, 'La centrale nucléaire est requise'),
});

export const updateListingSchema = createListingSchema.partial();

export const createBookingSchema = z.object({
  listingId: z.string().min(1),
  checkInDate: z.string().datetime({ message: 'Date de début invalide' }),
  checkOutDate: z.string().datetime({ message: 'Date de fin invalide' }),
  numberOfGuests: z.number().int().min(1),
  paymentMethod: z.enum(['CARD', 'CASH', 'SPLIT']),
});

export const splitInviteSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email('Email invalide'),
      name: z.string().min(2, 'Le nom est requis'),
      amount: z.number().positive('Le montant doit être positif'),
    }),
  ).min(1, 'Au moins un colocataire est requis'),
});

export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  listingId: z.string().min(1),
  rating: z.number().int().min(1, 'Note minimum : 1').max(5, 'Note maximum : 5'),
  comment: z.string().min(10, 'Le commentaire doit contenir au moins 10 caractères'),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  receiverId: z.string().min(1),
  content: z.string().min(1, 'Le message ne peut pas être vide').max(2000),
  bookingId: z.string().optional(),
});

export const updateAvailabilitySchema = z.object({
  availabilities: z.array(
    z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      isAvailable: z.boolean(),
    }),
  ),
});

export const cashConfirmSchema = z.object({
  bookingId: z.string().min(1),
  weekNumber: z.number().int().min(1),
});

export const adminVerifyListingSchema = z.object({
  isVerified: z.boolean(),
  adminComment: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type SplitInviteInput = z.infer<typeof splitInviteSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CashConfirmInput = z.infer<typeof cashConfirmSchema>;
export type AdminVerifyListingInput = z.infer<typeof adminVerifyListingSchema>;
