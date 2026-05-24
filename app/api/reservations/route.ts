import { NextRequest, NextResponse } from "next/server";
import { CreateReservationSchema } from "@/lib/validations/reservation";
import { createReservation, ReservationError } from "@/lib/reservations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const reservation = await createReservation(parsed.data.inventoryId, parsed.data.quantity);
    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof ReservationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
