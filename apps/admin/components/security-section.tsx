import {
  AddPasskeyButton,
  RemovePasskeyButton,
  SignOutOthersButton,
} from "@/components/security";
import { Bone, Skeleton, times, widthFor } from "@/components/skeletons";
import { AUDIT_LABEL } from "@/lib/audit-actions";
import { getSecurityOverview } from "@/lib/security";
import { describeDevice } from "@/lib/user-agent";

const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Johannesburg",
});

/** Passkeys, signed-in sessions and the audit log, at the bottom of Settings. */
export async function SecuritySection() {
  const { passkeys, sessions, events, recoveryOverride } =
    await getSecurityOverview();
  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="mt-16 grid gap-12 border-t pt-10"
    >
      <div>
        <h2 id="security-heading" className="text-2xl font-bold">
          Security
        </h2>
        <p className="text-sm text-muted-foreground">
          Every sign-in is emailed to you and logged below.
        </p>
      </div>

      <Part
        id="passkeys"
        title="Passkeys"
        description={
          passkeys.length === 0
            ? "Add a passkey and sign in with Touch ID, Face ID or a security key. Once you have one, email links stop working, so access to your inbox alone isn't enough to get in."
            : recoveryOverride
              ? "Email links are on because ALLOW_EMAIL_SIGN_IN is set. Remove it in Vercel once you're back in with a passkey."
              : "Email links are off while a passkey exists. Lost them all? Set ALLOW_EMAIL_SIGN_IN=1 in Vercel and redeploy to get a link."
        }
      >
        {passkeys.length ? (
          <ul className="mb-3 divide-y rounded-lg border">
            {passkeys.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 px-4 py-2 text-sm"
              >
                <span>
                  {p.name ?? "Passkey"}
                  <span className="ml-2 text-xs text-muted-foreground">
                    Added {p.createdAt ? when.format(p.createdAt) : "—"}
                    {p.backedUp ? " · synced" : ""}
                  </span>
                </span>
                <RemovePasskeyButton id={p.id} last={passkeys.length === 1} />
              </li>
            ))}
          </ul>
        ) : null}
        <AddPasskeyButton first={passkeys.length === 0} />
      </Part>

      <Part
        id="sessions"
        title="Signed in"
        description="Each browser that's signed in. Sessions end after a week without use."
      >
        <ul className="mb-3 divide-y rounded-lg border">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-2 text-sm"
            >
              <span>
                {describeDevice(s.userAgent)}
                {s.current ? (
                  <span className="ml-2 text-xs font-medium">This browser</span>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {s.ipAddress ?? "Unknown IP"} · last used{" "}
                {when.format(s.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
        {sessions.length > 1 ? <SignOutOthersButton /> : null}
      </Part>

      <Part
        id="activity"
        title="Activity"
        description="The last 50 sign-ins, sends and changes to settings, rules and accounts."
      >
        {events.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th scope="col" className="px-4 py-2 font-medium">
                    When
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    What
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    From
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((e) => (
                  <tr key={e.id} className="align-baseline">
                    <td className="px-4 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                      {when.format(e.at)}
                    </td>
                    <td className="px-4 py-2">
                      {AUDIT_LABEL[e.action] ?? e.action}
                      {e.detail ? (
                        <span className="block text-xs break-all text-muted-foreground">
                          {e.detail}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {[e.location, e.ipAddress].filter(Boolean).join(" · ") ||
                        "—"}
                      {e.userAgent ? (
                        <span className="block">
                          {describeDevice(e.userAgent)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        )}
      </Part>
    </section>
  );
}

function Part({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="text-lg font-bold">
        {title}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

/** The section while it loads: real headings, placeholder rows. */
export function SecuritySectionSkeleton() {
  return (
    <section className="mt-16 grid gap-12 border-t pt-10">
      <div>
        <h2 className="text-2xl font-bold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Every sign-in is emailed to you and logged below.
        </p>
      </div>
      <Part
        id="passkeys-loading"
        title="Passkeys"
        description={<Bone w="60ch" />}
      >
        <ul className="mb-3 divide-y rounded-lg border">
          <li className="px-4 py-2 text-sm">
            <Bone w="16ch" />
          </li>
        </ul>
        <Skeleton className="h-9 w-32" />
      </Part>
      <Part
        id="sessions-loading"
        title="Signed in"
        description="Each browser that's signed in. Sessions end after a week without use."
      >
        <ul className="divide-y rounded-lg border">
          {times(2, (i) => (
            <li
              key={i}
              className="flex justify-between gap-4 px-4 py-2 text-sm"
            >
              <Bone w="14ch" />
              <span className="text-xs">
                <Bone w="24ch" />
              </span>
            </li>
          ))}
        </ul>
      </Part>
      <Part
        id="activity-loading"
        title="Activity"
        description="The last 50 sign-ins, sends and changes to settings, rules and accounts."
      >
        <div className="rounded-lg border">
          <div className="grid grid-cols-3 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>When</span>
            <span>What</span>
            <span>From</span>
          </div>
          {times(4, (i) => (
            <div
              key={i}
              className="grid grid-cols-3 border-b px-4 py-2 text-sm last:border-0"
            >
              <Bone w="15ch" />
              <Bone w={widthFor(i, 1)} />
              <span className="text-xs">
                <Bone w="12ch" />
              </span>
            </div>
          ))}
        </div>
      </Part>
    </section>
  );
}
