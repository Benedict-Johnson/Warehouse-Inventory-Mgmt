import { z } from "zod/v4";

export const CreateReservationSchema = z.object({
  inventoryId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
