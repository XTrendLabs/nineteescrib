import {
  formatDateShort,
  formatInr,
} from "@/features/booking-engine/lib/format";
import type { PricingBreakdown } from "@/features/booking-engine/lib/mock-data";
import type {
  PropertyDetail,
  RoomType,
} from "@/features/properties/lib/mock-data";

export function ReservationSummary({
  property,
  roomType,
  checkIn,
  checkOut,
  guests,
  pricing,
  couponCode,
}: {
  property: PropertyDetail;
  roomType: RoomType;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  pricing: PricingBreakdown;
  couponCode: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 border p-4">
      <div>
        <p className="font-medium text-sm">{property.name}</p>
        <p className="text-muted-foreground text-xs">{roomType.name}</p>
      </div>

      <div className="flex flex-col gap-1 border-t pt-3 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Check-in</span>
          <span>{formatDateShort(checkIn)} (2:00 PM)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Check-out</span>
          <span>{formatDateShort(checkOut)} (11:00 AM)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span>
            {pricing.nights} night{pricing.nights === 1 ? "" : "s"} · {guests}{" "}
            Guest{guests === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t pt-3 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Room Rate ({pricing.nights} night{pricing.nights === 1 ? "" : "s"})
          </span>
          <span>{formatInr(pricing.roomRatePaise)}</span>
        </div>
        {pricing.extraGuestPaise > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Extra Guest Charges</span>
            <span>{formatInr(pricing.extraGuestPaise)}</span>
          </div>
        )}
        {pricing.couponDiscountPaise > 0 && (
          <div className="flex justify-between text-success">
            <span>Coupon Discount ({couponCode})</span>
            <span>-{formatInr(pricing.couponDiscountPaise)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t pt-3 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatInr(pricing.subtotalPaise)}</span>
        </div>
        {pricing.taxPaise > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              GST ({property.billing.taxRateBps / 100}% Exclusive)
            </span>
            <span>{formatInr(pricing.taxPaise)}</span>
          </div>
        )}
        {pricing.securityDepositPaise > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Refundable Security Deposit
            </span>
            <span>{formatInr(pricing.securityDepositPaise)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between border-t pt-3 font-medium text-sm">
        <span>Total Payable</span>
        <span>{formatInr(pricing.totalPaise)}</span>
      </div>
    </div>
  );
}
