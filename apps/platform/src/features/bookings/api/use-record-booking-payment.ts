import { api } from "@/shared/lib/api-client";

/** Adds one payment to a booking's ledger. */
export function useRecordBookingPayment() {
  return api.api.platform.bookings[":id"].payments.$post.useMutation();
}
