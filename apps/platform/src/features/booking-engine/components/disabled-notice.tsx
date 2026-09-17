/** Shown in place of the booking pages while the engine is switched off. */
export function BookingEngineDisabled() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="font-medium text-sm">Booking link setup is being built</p>
      <p className="max-w-sm text-muted-foreground text-xs">
        This property is not taking online bookings yet — check back shortly.
      </p>
    </div>
  );
}
