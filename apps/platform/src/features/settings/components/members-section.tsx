import { roleLabels } from "@propertyos/auth/permissions";
import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { DataTableContainer } from "@propertyos/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@propertyos/ui/components/dropdown-menu";
import { Skeleton } from "@propertyos/ui/components/skeleton";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { MoreVerticalIcon } from "lucide-react";
import { useState } from "react";
import { useActiveHq } from "@/features/auth/api/use-cached-organizations";
import { useCachedSession } from "@/features/auth/api/use-cached-session";
import { useHasPermission } from "@/features/auth/api/use-permission";
import { ConfirmDestructiveDialog } from "@/features/settings/components/confirm-destructive-dialog";
import { api } from "@/shared/lib/api-client";
import { useMemberInvitations } from "../api/use-member-invitations";
import { useMembers } from "../api/use-members";
import { useRemoveMember } from "../api/use-remove-member";
import { useRevokeInvitation } from "../api/use-revoke-invitation";
import { useUpdateMemberRole } from "../api/use-update-member-role";

type WorkspaceMember = NonNullable<
  ReturnType<typeof useMembers>["data"]
>["data"][number];

const ROLE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  "property-manager": "secondary",
  staff: "outline",
};

function roleLabel(role: string) {
  return roleLabels[role as keyof typeof roleLabels] ?? role;
}

/** "24 Aug 2026" -- unambiguous without being long. */
function formatJoined(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * What a person's access covers, in words.
 *
 * An owner reaches everything through their HQ membership, so listing each
 * property for them is noise; for everyone else the property names are the
 * useful part.
 */
function describeAccess(member: WorkspaceMember) {
  if (member.isOwner) return "All properties";

  const properties = member.organizations.filter((o) => o.kind !== "hq");
  if (properties.length === 0) return "No properties";
  if (properties.length <= 2) {
    return properties.map((o) => o.name).join(", ");
  }
  return `${properties.length} properties`;
}

export function MembersSection() {
  const feedback = useFeedback();
  const { activeScopeId } = useActiveHq();
  const { data: session } = useCachedSession();
  const canManage = useHasPermission("member", "update");

  const { data: membersResponse, isLoading } = useMembers(activeScopeId);
  const { data: invitesResponse } = useMemberInvitations(activeScopeId);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();

  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(
    null,
  );

  const members = membersResponse?.data ?? [];
  const invites = invitesResponse?.data ?? [];

  function refresh() {
    const query = { activeOrganizationId: activeScopeId ?? "" };
    return Promise.all([
      api.api.platform.settings.members.$get.invalidate({ query }),
      api.api.platform.settings.members.invitations.$get.invalidate({ query }),
    ]);
  }

  async function handleChangeRole(member: WorkspaceMember, role: string) {
    try {
      await updateRole.mutateAsync({
        param: { id: member.id },
        json: { role: role as "owner" | "property-manager" | "staff" },
      });
      await refresh();
      feedback.success(
        "Role updated",
        `${member.name} is now ${roleLabel(role)}.`,
      );
    } catch (error) {
      feedback.error("Couldn't update role", messageFrom(error));
    }
  }

  async function handleRemove(member: WorkspaceMember) {
    try {
      await removeMember.mutateAsync({ param: { id: member.id } });
      await refresh();
      feedback.success(
        "Member removed",
        `${member.name} no longer has access.`,
      );
    } catch (error) {
      feedback.error("Couldn't remove member", messageFrom(error));
    }
  }

  async function handleRevoke(inviteId: string, email: string) {
    try {
      await revokeInvitation.mutateAsync({ param: { id: inviteId } });
      await refresh();
      feedback.success(
        "Invitation revoked",
        `The invite to ${email} was cancelled.`,
      );
    } catch (error) {
      feedback.error("Couldn't revoke invitation", messageFrom(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-sm">Members</h2>
          <p className="text-muted-foreground text-xs">
            Everyone with access to this workspace, across the HQ and all its
            properties.
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Active Members
        </h3>
        <DataTableContainer className="sm:[--content-inset:17.5rem]">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Access</th>
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                ["a", "b", "c"].map((key) => (
                  <tr key={key} className="border-b last:border-b-0">
                    {["n", "e", "r", "a", "j", "x"].map((cell) => (
                      <td key={cell} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No members yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isSelf = member.userId === session?.user.id;
                  return (
                    <tr
                      key={member.userId}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-3 py-2">
                        {member.name}
                        {isSelf ? (
                          <span className="ml-1 text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={ROLE_BADGE[member.role] ?? "outline"}>
                          {roleLabel(member.role)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {describeAccess(member)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatJoined(member.joinedAt)}
                      </td>
                      <td className="px-3 py-2">
                        {/* Owners keep the workspace working and nobody may act
                            on their own row, so neither offers actions. */}
                        {!canManage || member.isOwner || isSelf ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button variant="ghost" size="icon-sm" />}
                            >
                              <MoreVerticalIcon />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {member.role !== "property-manager" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeRole(member, "property-manager")
                                  }
                                >
                                  Make Property Manager
                                </DropdownMenuItem>
                              ) : null}
                              {member.role !== "staff" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeRole(member, "staff")
                                  }
                                >
                                  Make Staff
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setRemoveTarget(member)}
                              >
                                Remove from workspace
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTableContainer>
        <p className="text-[11px] text-muted-foreground">
          People are given access when they are added to the staff directory
          with a login. Manage who works where in Staff.
        </p>
      </section>

      {invites.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
            Pending Invitations
          </h3>
          <DataTableContainer className="sm:[--content-inset:17.5rem]">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Sent</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{invite.email}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={ROLE_BADGE[invite.role ?? ""] ?? "outline"}
                      >
                        {roleLabel(invite.role ?? "staff")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {invite.organizationName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatJoined(invite.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      {canManage ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(invite.id, invite.email)}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableContainer>
        </section>
      ) : null}

      <ConfirmDestructiveDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member"
        description={`${removeTarget?.name ?? "This member"} will lose access to every property in this workspace immediately.`}
        confirmLabel="Remove Member"
        onConfirm={() => removeTarget && handleRemove(removeTarget)}
      />
    </div>
  );
}

/** Surfaces the server's reason -- "only owner", "cannot remove yourself". */
function messageFrom(error: unknown) {
  const message = error instanceof Error ? error.message : "Please try again.";
  return message || "Please try again.";
}
