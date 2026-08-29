import { Badge } from "@propertyos/ui/components/badge";
import { Button } from "@propertyos/ui/components/button";
import { DataTableContainer } from "@propertyos/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@propertyos/ui/components/dropdown-menu";
import { useFeedback } from "@propertyos/ui/lib/use-feedback";
import { MoreVerticalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmDestructiveDialog } from "@/features/settings/components/confirm-destructive-dialog";
import { InviteMemberDialog } from "@/features/settings/components/invite-member-dialog";
import {
  type Member,
  type MemberRole,
  MOCK_MEMBERS,
  MOCK_PENDING_INVITES,
  type PendingInvite,
} from "@/features/settings/lib/mock-data";

const ROLE_BADGE: Record<MemberRole, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

export function MembersSection() {
  const feedback = useFeedback();
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [invites, setInvites] = useState<PendingInvite[]>(MOCK_PENDING_INVITES);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  function handleInvite(email: string, role: MemberRole) {
    setInvites((prev) => [
      { id: `inv-${Date.now()}`, email, role, sentAgo: "just now" },
      ...prev,
    ]);
  }

  function handleChangeRole(memberId: string, role: MemberRole) {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
    );
    feedback.success("Role updated");
  }

  function handleRemove(member: Member) {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    feedback.success("Member removed", `${member.name} was removed.`);
  }

  function handleResend(invite: PendingInvite) {
    feedback.success("Invitation resent", `Resent invite to ${invite.email}.`);
  }

  function handleRevoke(inviteId: string) {
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    feedback.success("Invitation revoked");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-sm">Members</h2>
          <p className="text-muted-foreground text-xs">
            Manage organization-level user accounts and their roles.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <PlusIcon />
          Invite Member
        </Button>
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
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{member.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {member.email}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={ROLE_BADGE[member.role]}>
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {member.joinedAt}
                  </td>
                  <td className="px-3 py-2">
                    {member.role === "owner" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                        >
                          <MoreVerticalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleChangeRole(
                                member.id,
                                member.role === "admin" ? "member" : "admin",
                              )
                            }
                          >
                            Change role to{" "}
                            {member.role === "admin" ? "Member" : "Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setRemoveTarget(member)}
                          >
                            Remove from organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableContainer>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Pending Invitations
        </h3>
        {invites.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No pending invitations.
          </p>
        ) : (
          <DataTableContainer className="sm:[--content-inset:17.5rem]">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Sent</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{invite.email}</td>
                    <td className="px-3 py-2">
                      <Badge variant={ROLE_BADGE[invite.role]}>
                        {invite.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {invite.sentAgo}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(invite)}
                        >
                          Resend
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(invite.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableContainer>
        )}
      </section>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />

      <ConfirmDestructiveDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member"
        description={`${removeTarget?.name ?? "This member"} will lose access to the organization immediately.`}
        confirmLabel="Remove Member"
        onConfirm={() => removeTarget && handleRemove(removeTarget)}
      />
    </div>
  );
}
