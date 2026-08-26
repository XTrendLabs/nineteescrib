import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@propertyos/ui/components/button";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { Label } from "@propertyos/ui/components/label";
import { LoadingButton } from "@propertyos/ui/components/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { Stepper, type StepperStep } from "@propertyos/ui/components/stepper";
import { BedIcon, ImageIcon, IndianRupeeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { api } from "@/shared/lib/api-client";
import { useAmenities } from "../api/use-amenities";
import { useCreateRoom } from "../api/use-create-room";
import { useRooms } from "../api/use-rooms";
import { useUpdateRoom } from "../api/use-update-room";
import { getAmenityIcon } from "../lib/amenity-icons";
import { ROOM_TYPE_LABEL, type Room, roomTypeValues } from "../lib/room";
import {
  type RoomFormOutput,
  type RoomFormValues,
  roomFormSchema,
} from "../lib/room-schema";
import { RoomImageManager } from "./room-image-manager";

const STEPS: StepperStep[] = [
  { label: "Details", icon: <BedIcon className="size-4" /> },
  { label: "Images", icon: <ImageIcon className="size-4" /> },
  { label: "Pricing", icon: <IndianRupeeIcon className="size-4" /> },
];

function toDefaultValues(room: Room | undefined): RoomFormValues {
  return {
    name: room?.name ?? "",
    roomNumber: room?.roomNumber ?? "",
    floor: room?.floor ?? "",
    roomType: (room?.roomType as RoomFormValues["roomType"]) ?? "double",
    status: (room?.status as RoomFormValues["status"]) ?? "draft",
    weekdayPrice: room?.weekdayPrice ?? 0,
    weekendPrice: room?.weekendPrice ?? 0,
    maxGuests: room?.maxGuests ?? 2,
    amenityIds: room?.amenities.map((a) => a.id) ?? [],
  };
}

export function RoomDialog({
  open,
  onOpenChange,
  propertyId,
  room,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  room?: Room;
}) {
  const { data: amenitiesResponse, isLoading: isLoadingAmenities } =
    useAmenities();
  const amenities = amenitiesResponse?.data ?? [];
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const isEditing = Boolean(room);
  const mutation = isEditing ? updateRoom : createRoom;

  const { data: roomsResponse } = useRooms(propertyId);
  const [step, setStep] = useState(1);
  const [savedRoom, setSavedRoom] = useState<Room | undefined>(room);

  const form = useForm<RoomFormValues, unknown, RoomFormOutput>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: toDefaultValues(room),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaultValues(room));
      mutation.reset();
      setStep(1);
      setSavedRoom(room);
    }
  }, [open, room, mutation.reset, form.reset]);

  function invalidate() {
    api.api.platform.rooms.$get.invalidate({ query: { propertyId } });
  }

  async function persist(status: "draft" | "published", close: boolean) {
    const values = roomFormSchema.parse({ ...form.getValues(), status });
    const target = savedRoom ?? room;

    const response = target
      ? await updateRoom.mutateAsync({
          param: { id: target.id },
          json: values,
        })
      : await createRoom.mutateAsync({ json: { propertyId, ...values } });

    invalidate();
    if (response?.data) {
      setSavedRoom(response.data as unknown as Room);
    }
    if (close) onOpenChange(false);

    return response;
  }

  async function goToStep(next: number) {
    if (next > step) {
      const valid = await form.trigger(["name", "roomType"]);
      if (!valid) return;
      try {
        await persist("draft", false);
      } catch {
        return;
      }
    }
    setStep(next);
  }

  const handlePublish = form.handleSubmit(async () => {
    try {
      await persist("published", true);
    } catch {
      // error surfaced via mutation.isError
    }
  });

  const targetRoom = savedRoom ?? room;
  // The dialog's own snapshot goes stale on image upload/delete, so read the
  // live copy from the rooms query and fall back to the snapshot.
  const liveRoom = roomsResponse?.data?.find((r) => r.id === targetRoom?.id);
  const activeRoom = (liveRoom as Room | undefined) ?? targetRoom;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Room" : "Add Room"}</DialogTitle>
          <DialogDescription>
            Add details, photos, and pricing for this room. You can save as a
            draft and come back later.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2">
          <Stepper steps={STEPS} currentStep={step} orientation="horizontal" />
        </div>

        <form onSubmit={handlePublish} className="flex flex-col gap-4 px-4">
          {step === 1 && (
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">Room Name *</FieldLabel>
                      <Input
                        {...field}
                        id="name"
                        placeholder="Ocean View Deluxe"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="roomType"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="roomType">Room Type *</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger id="roomType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypeValues.map((type) => (
                            <SelectItem key={type} value={type}>
                              {ROOM_TYPE_LABEL[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Controller
                  name="roomNumber"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="roomNumber">Room Number</FieldLabel>
                      <Input
                        {...field}
                        id="roomNumber"
                        placeholder="101"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="floor"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="floor">Floor</FieldLabel>
                      <Input
                        {...field}
                        id="floor"
                        placeholder="1st Floor"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="maxGuests"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="maxGuests">Max Guests</FieldLabel>
                      <Input
                        {...field}
                        value={String(field.value ?? "")}
                        id="maxGuests"
                        type="number"
                        min={1}
                        placeholder="2"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="amenityIds"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Amenities</FieldLabel>
                    {isLoadingAmenities ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                          <Skeleton key={index} className="h-9 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {amenities.map((a) => {
                          const Icon = getAmenityIcon(a.icon);
                          const checked = field.value.includes(a.id);
                          return (
                            <Label
                              key={a.id}
                              className="flex cursor-pointer items-center gap-2 border p-2 text-xs"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  field.onChange(
                                    next
                                      ? [...field.value, a.id]
                                      : field.value.filter((id) => id !== a.id),
                                  );
                                }}
                              />
                              <Icon className="size-3.5 text-muted-foreground" />
                              {a.name}
                            </Label>
                          );
                        })}
                      </div>
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          )}

          {step === 2 && (
            <FieldGroup>
              {activeRoom ? (
                <RoomImageManager
                  propertyId={propertyId}
                  roomId={activeRoom.id}
                  images={activeRoom.images ?? []}
                />
              ) : (
                <p className="text-muted-foreground text-xs">
                  Save the room details first to start adding images.
                </p>
              )}
            </FieldGroup>
          )}

          {step === 3 && (
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="weekdayPrice"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="weekdayPrice">
                        Weekday Price
                      </FieldLabel>
                      <Input
                        {...field}
                        value={String(field.value ?? "")}
                        id="weekdayPrice"
                        type="number"
                        min={0}
                        placeholder="3000"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="weekendPrice"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="weekendPrice">
                        Weekend Price
                      </FieldLabel>
                      <Input
                        {...field}
                        value={String(field.value ?? "")}
                        id="weekendPrice"
                        type="number"
                        min={0}
                        placeholder="4000"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          )}

          {mutation.isError && (
            <p className="text-destructive text-xs">
              Something went wrong saving this room. Please try again.
            </p>
          )}

          <DialogFooter className="justify-between sm:justify-between">
            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep(step - 1)}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <LoadingButton
                type="button"
                variant="outline"
                loading={mutation.isPending}
                loadingText="Saving…"
                onClick={() => {
                  persist("draft", true).catch(() => {
                    // surfaced via mutation.isError
                  });
                }}
              >
                Save as Draft
              </LoadingButton>
              {step < STEPS.length ? (
                <Button
                  type="button"
                  onClick={() => goToStep(step + 1)}
                  disabled={mutation.isPending}
                >
                  Next
                </Button>
              ) : (
                <LoadingButton
                  type="submit"
                  loading={mutation.isPending}
                  loadingText="Publishing…"
                >
                  Publish Room
                </LoadingButton>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
