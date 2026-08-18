import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Field, FieldLabel } from "@propertyos/ui/components/field";
import { Input } from "@propertyos/ui/components/input";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useState } from "react";

import { ConfirmDestructiveDialog } from "@/features/settings/components/confirm-destructive-dialog";
import {
  MOCK_PAYMENT_GATEWAYS,
  type PaymentGateway,
} from "@/features/settings/lib/mock-data";

export function PaymentGatewaysSection() {
  const feedback = useFeedback();
  const [gateways, setGateways] = useState<PaymentGateway[]>(
    MOCK_PAYMENT_GATEWAYS,
  );
  const [connectTarget, setConnectTarget] = useState<PaymentGateway | null>(
    null,
  );
  const [disconnectTarget, setDisconnectTarget] =
    useState<PaymentGateway | null>(null);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");

  function handleConnect() {
    if (!connectTarget) {
      return;
    }
    setGateways((prev) =>
      prev.map((g) =>
        g.id === connectTarget.id
          ? { ...g, status: "connected", keyIdPreview: keyId || "key_xxxx" }
          : g,
      ),
    );
    feedback.success("Gateway connected", `${connectTarget.name} is now live.`);
    setConnectTarget(null);
    setKeyId("");
    setKeySecret("");
  }

  function handleDisconnect(gateway: PaymentGateway) {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === gateway.id
          ? { ...g, status: "not_connected", keyIdPreview: undefined }
          : g,
      ),
    );
    feedback.success(
      "Gateway disconnected",
      `${gateway.name} was disconnected.`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium text-sm">Payment Gateways</h2>
        <p className="text-muted-foreground text-xs">
          These gateways process guest booking payments. Each property can be
          assigned a specific gateway.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {gateways.map((gateway) => (
          <Card key={gateway.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{gateway.name}</span>
                <span className="flex items-center gap-1.5 text-xs">
                  Status:
                  <Badge
                    variant={
                      gateway.status === "connected" ? "success" : "outline"
                    }
                  >
                    {gateway.status === "connected"
                      ? "Connected"
                      : "Not Connected"}
                  </Badge>
                </span>
                {gateway.status === "connected" && (
                  <>
                    <span className="text-muted-foreground text-xs">
                      Key ID: {gateway.keyIdPreview}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Used by:{" "}
                      {gateway.usedByProperties.length > 0
                        ? gateway.usedByProperties.join(", ")
                        : "No properties yet"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {gateway.status === "connected" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        feedback.success(
                          "Connection healthy",
                          `${gateway.name} responded successfully.`,
                        )
                      }
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDisconnectTarget(gateway)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setConnectTarget(gateway)}>
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={connectTarget !== null}
        onOpenChange={(open) => !open && setConnectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {connectTarget?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to enable guest payments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <Field>
              <FieldLabel>Key ID</FieldLabel>
              <Input value={keyId} onChange={(e) => setKeyId(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Key Secret</FieldLabel>
              <Input
                type="password"
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleConnect}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={disconnectTarget !== null}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
        title={`Disconnect ${disconnectTarget?.name ?? "gateway"}`}
        description="Properties using this gateway will no longer be able to accept guest payments until reconnected."
        confirmLabel="Disconnect"
        onConfirm={() => disconnectTarget && handleDisconnect(disconnectTarget)}
      />
    </div>
  );
}
