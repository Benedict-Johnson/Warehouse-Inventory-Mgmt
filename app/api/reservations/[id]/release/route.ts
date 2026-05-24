import { NextRequest, NextResponse } from "next/server";
import { releaseReservation, ReservationError } from "@/lib/reservations";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservation = await releaseReservation(id);
    return NextResponse.json(reservation);
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
