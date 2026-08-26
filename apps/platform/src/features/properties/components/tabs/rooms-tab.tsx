import { Button } from "@propertyos/ui/components/button";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { BedDoubleIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useDeleteRoom } from "@/features/rooms/api/use-delete-room";
import { useRooms } from "@/features/rooms/api/use-rooms";
import { RoomCard } from "@/features/rooms/components/room-card";
import { RoomDialog } from "@/features/rooms/components/room-dialog";
import type { Room } from "@/features/rooms/lib/room";
import { api } from "@/shared/lib/api-client";
import { EmptyTabState } from "../empty-tab-state";

export function RoomsTab({ propertyId }: { propertyId: string }) {
  const feedback = useFeedback();
  const { data: response } = useRooms(propertyId);
  const rooms = response?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  const deleteRoom = useDeleteRoom();

  function openCreate() {
    setEditingRoom(undefined);
    setDialogOpen(true);
  }

  function openEdit(room: Room) {
    setEditingRoom(room);
    setDialogOpen(true);
  }

  function handleDelete(room: Room) {
    deleteRoom.mutate(
      { param: { id: room.id } },
      {
        onSuccess: () => {
          api.api.platform.rooms.$get.invalidate({ query: { propertyId } });
          feedback.success("Room removed", `${room.name} has been deleted.`);
        },
        onError: () => {
          feedback.error(
            "Couldn't delete room",
            "Something went wrong. Please try again.",
          );
        },
      },
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
              onDelete={() => handleDelete(room)}
            />
          ))}
        </div>
      )}

      <RoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        room={editingRoom}
      />
    </div>
  );
}
