import { Button } from "@propertyos/ui/components/button";
import { Card, CardContent } from "@propertyos/ui/components/card";
import { Checkbox } from "@propertyos/ui/components/checkbox";
import { Field, FieldLabel } from "@propertyos/ui/components/field";
import { Label } from "@propertyos/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { useState } from "react";

import { ConfirmDestructiveDialog } from "@/features/settings/components/confirm-destructive-dialog";
import {
  MOCK_ACTIVE_SESSIONS,
  MOCK_SECURITY_SETTINGS,
} from "@/features/settings/lib/mock-data";

export function SecuritySection() {
  const feedback = useFeedback();
  const [settings, setSettings] = useState(MOCK_SECURITY_SETTINGS);
  const [sessions, setSessions] = useState(MOCK_ACTIVE_SESSIONS);
  const [revokeTarget, setRevokeTarget] = useState<
    (typeof MOCK_ACTIVE_SESSIONS)[number] | null
  >(null);

  function handleRevoke(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    feedback.success("Session revoked");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium text-sm">Security</h2>
        <p className="text-muted-foreground text-xs">
          Authentication policies and active sessions across your organization.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Authentication
        </h3>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Password Policy</FieldLabel>
                <Select
                  value={settings.passwordPolicy}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      passwordPolicy: value as string,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{settings.passwordPolicy}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minimum 8 characters">
                      Minimum 8 characters
                    </SelectItem>
                    <SelectItem value="Minimum 12 characters + symbol">
                      Minimum 12 characters + symbol
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Session Timeout</FieldLabel>
                <Select
                  value={settings.sessionTimeout}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      sessionTimeout: value as string,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{settings.sessionTimeout}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 day">1 day</SelectItem>
                    <SelectItem value="7 days">7 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>2FA Enforcement</FieldLabel>
              <div className="flex gap-4">
                <Label className="items-center gap-1.5">
                  <input
                    type="radio"
                    name="2fa"
                    checked={settings.twoFactorEnforcement === "optional"}
                    onChange={() =>
                      setSettings((prev) => ({
                        ...prev,
                        twoFactorEnforcement: "optional",
                      }))
                    }
                  />
                  Optional
                </Label>
                <Label className="items-center gap-1.5">
                  <input
                    type="radio"
                    name="2fa"
                    checked={settings.twoFactorEnforcement === "required_admin"}
                    onChange={() =>
                      setSettings((prev) => ({
                        ...prev,
                        twoFactorEnforcement: "required_admin",
                      }))
                    }
                  />
                  Required for Admin
                </Label>
              </div>
            </Field>

            <Field>
              <FieldLabel>OAuth Providers</FieldLabel>
              <div className="flex gap-4">
                <Label className="items-center gap-1.5">
                  <Checkbox
                    checked={settings.oauthGoogle}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        oauthGoogle: checked,
                      }))
                    }
                  />
                  Google
                </Label>
                <Label className="items-center gap-1.5">
                  <Checkbox
                    checked={settings.oauthMicrosoft}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        oauthMicrosoft: checked,
                      }))
                    }
                  />
                  Microsoft
                </Label>
              </div>
            </Field>

            <div>
              <Button
                onClick={() => feedback.success("Security settings saved")}
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Active Sessions
        </h3>
        <div className="overflow-x-auto border">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Device</th>
                <th className="px-3 py-2 font-medium">IP Address</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{session.device}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {session.ipAddress}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {session.location}
                  </td>
                  <td className="px-3 py-2">
                    {session.isCurrent ? (
                      <span className="text-muted-foreground">
                        Current Session
                      </span>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevokeTarget(session)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDestructiveDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke session"
        description={`This will immediately sign out ${revokeTarget?.device ?? "this device"}.`}
        confirmLabel="Revoke Session"
        onConfirm={() => revokeTarget && handleRevoke(revokeTarget.id)}
      />
    </div>
  );
}
