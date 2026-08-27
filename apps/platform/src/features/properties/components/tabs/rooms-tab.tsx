import { Button } from "@propertyos/ui/components/button";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { SkeletonLayout } from "@propertyos/ui/components/skeleton-block";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { BedDoubleIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { ROOMS_TAB_SKELETON } from "@/features/properties/lib/skeleton-config";
import { useDeleteRoom } from "@/features/rooms/api/use-delete-room";
import { useRooms } from "@/features/rooms/api/use-rooms";
import { RoomCard } from "@/features/rooms/components/room-card";
import { RoomDialog } from "@/features/rooms/components/room-dialog";
import type { Room } from "@/features/rooms/lib/room";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { api } from "@/shared/lib/api-client";
import { getApiErrorMessage } from "@/shared/lib/api-error";
import { EmptyTabState } from "../empty-tab-state";

export function RoomsTab({
  propertyId,
  propertySlug,
}: {
  propertyId: string;
  propertySlug: string;
}) {
  const feedback = useFeedback();
  const { data: response, isLoading } = useRooms(propertyId);
  const rooms = response?.data ?? [];

  /**
   * The property carries the "has a published room" flag behind the tab's
   * warning badge, so changing the rooms has to refresh it too.
   */
  function invalidateProperty() {
    api.api.platform.properties[":slug"].$get.invalidate({
      param: { slug: propertySlug },
    });
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  const [roomToDelete, setRoomToDelete] = useState<Room | undefined>(undefined);
  const deleteRoom = useDeleteRoom();

  function openCreate() {
    setEditingRoom(undefined);
    setDialogOpen(true);
  }

  function openEdit(room: Room) {
    setEditingRoom(room);
    setDialogOpen(true);
  }

  function handleDelete() {
    if (!roomToDelete) return;
    const room = roomToDelete;

    deleteRoom.mutate(
      { param: { id: room.id } },
      {
        onSuccess: () => {
          api.api.platform.rooms.$get.invalidate({ query: { propertyId } });
          invalidateProperty();
          setRoomToDelete(undefined);
          feedback.success("Room removed", `${room.name} has been deleted.`);
        },
        onError: (error) => {
          feedback.error(
            "Couldn't delete room",
            getApiErrorMessage(
              error,
              "Something went wrong. Please try again.",
            ),
          );
        },
      },
    );
  }

  // Without this the tab renders the "no rooms yet" empty state while the
  // request is still in flight, then flips to the grid.
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-28" />
        </div>
        <SkeletonLayout shapes={ROOMS_TAB_SKELETON} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rooms.length > 0 && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <PlusIcon />
            Add Room
          </Button>
        </div>
      )}

      {rooms.length === 0 ? (
        <EmptyTabState
          icon={BedDoubleIcon}
          title="No rooms added yet"
          description="Add room types with pricing, capacity, and amenities to start taking bookings."
          actionLabel="Add Room"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={() => openEdit(room)}
              onDelete={() => setRoomToDelete(room)}
            />
          ))}
        </div>
      )}

      <RoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        propertySlug={propertySlug}
        room={editingRoom}
      />

      <ConfirmDialog
        open={Boolean(roomToDelete)}
        onOpenChange={(open) => {
          if (!open) setRoomToDelete(undefined);
        }}
        title={`Delete ${roomToDelete?.name ?? "room"}?`}
        description="This permanently removes the room along with its images. This cannot be undone."
        loading={deleteRoom.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
