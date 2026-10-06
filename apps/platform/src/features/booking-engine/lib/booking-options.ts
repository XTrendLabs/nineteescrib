export const BOOKING_EXTRAS = [
  { id: "breakfast", label: "Breakfast", description: "Daily breakfast" },
  {
    id: "meals",
    label: "Meals",
    description: "Lunch or dinner arrangements",
  },
  {
    id: "airport_transfer",
    label: "Airport transfer",
    description: "Pickup or drop-off request",
  },
  {
    id: "local_travel",
    label: "Local travel",
    description: "Taxi or local transport assistance",
  },
  {
    id: "guided_tour",
    label: "Guided tour",
    description: "Local sightseeing assistance",
  },
] as const;

export function bookingExtraLabel(id: string) {
  return BOOKING_EXTRAS.find((extra) => extra.id === id)?.label ?? id;
}
