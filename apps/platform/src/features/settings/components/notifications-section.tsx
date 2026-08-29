import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import { DataTableContainer } from "@propertyos/ui/components/data-table";
import { Field, FieldLabel } from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useState } from "react";
import {
  MOCK_GUEST_NOTIFICATIONS,
  MOCK_HOST_NOTIFICATIONS,
  MOCK_WHATSAPP_CONFIG,
  type NotificationChannel,
  type NotificationEvent,
} from "@/features/settings/lib/mock-data";

function NotificationMatrix({
  title,
  events,
  channels,
  onToggle,
}: {
  title: string;
  events: NotificationEvent[];
  channels: NotificationChannel[];
  onToggle: (eventId: string, channel: NotificationChannel) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <DataTableContainer className="sm:[--content-inset:17.5rem]">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Event</th>
              {channels.map((channel) => (
                <th
                  key={channel}
                  className="px-3 py-2 text-center font-medium capitalize"
                >
                  {channel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{event.label}</td>
                {channels.map((channel) => (
                  <td key={channel} className="px-3 py-2 text-center">
                    <Checkbox
                      checked={event.channels[channel]}
                      onCheckedChange={() => onToggle(event.id, channel)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableContainer>
    </section>
  );
}

export function NotificationsSection() {
  const feedback = useFeedback();
  const [guestEvents, setGuestEvents] = useState(MOCK_GUEST_NOTIFICATIONS);
  const [hostEvents, setHostEvents] = useState(MOCK_HOST_NOTIFICATIONS);
  const [whatsappConfig, setWhatsappConfig] = useState(MOCK_WHATSAPP_CONFIG);

  function toggleGuest(eventId: string, channel: NotificationChannel) {
    setGuestEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              channels: { ...e.channels, [channel]: !e.channels[channel] },
            }
          : e,
      ),
    );
  }

  function toggleHost(eventId: string, channel: NotificationChannel) {
    setHostEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              channels: { ...e.channels, [channel]: !e.channels[channel] },
            }
          : e,
      ),
    );
  }

  function handleSave() {
    feedback.success("Notification preferences saved");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-sm">Notifications</h2>
          <p className="text-muted-foreground text-xs">
            Control which events trigger guest and host notifications.
          </p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <NotificationMatrix
        title="Guest Notifications (sent to guests)"
        events={guestEvents}
        channels={["email", "whatsapp", "sms"]}
        onToggle={toggleGuest}
      />

      <NotificationMatrix
        title="Host Notifications (sent to you / staff)"
        events={hostEvents}
        channels={["email", "whatsapp", "push"]}
        onToggle={toggleHost}
      />

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          WhatsApp Configuration
        </h3>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Provider</FieldLabel>
                <Select
                  value={whatsappConfig.provider}
                  onValueChange={(value) =>
                    setWhatsappConfig((prev) => ({
                      ...prev,
                      provider: value as string,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{whatsappConfig.provider}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MSG91">MSG91</SelectItem>
                    <SelectItem value="Twilio">Twilio</SelectItem>
                    <SelectItem value="Gupshup">Gupshup</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Sender ID</FieldLabel>
                <Input
                  value={whatsappConfig.senderId}
                  onChange={(e) =>
                    setWhatsappConfig((prev) => ({
                      ...prev,
                      senderId: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>API Key</FieldLabel>
                <div className="flex gap-2">
                  <Input value={whatsappConfig.apiKeyMasked} disabled />
                  <Button
                    variant="outline"
                    onClick={() => feedback.success("API key updated")}
                  >
                    Update
                  </Button>
                </div>
              </Field>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>Status:</span>
              <Badge variant="solid-success">{whatsappConfig.status}</Badge>
              <span className="text-muted-foreground">
                Last sent: {whatsappConfig.lastSent}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
