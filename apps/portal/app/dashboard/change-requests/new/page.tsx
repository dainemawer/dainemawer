import Link from "next/link";
import { createChangeRequest } from "@/lib/actions/change-requests";

export default function NewChangeRequestPage() {
  return (
    <div>
      <p className="m-0 text-faint text-xs">
        <Link href="/dashboard/change-requests" className="text-faint">
          Change requests
        </Link>{" "}
        / New
      </p>
      <h1 className="my-2 text-2xl text-ink">Submit a change request</h1>
      <p className="mb-8 text-md text-muted">
        Describe what you&rsquo;d like changed. Daine will reply with an
        estimate before any work starts.
      </p>

      <form action={createChangeRequest} className="max-w-lg">
        <label htmlFor="title" className="mb-1 block text-faint text-xs">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Add a team page"
          className="mb-6 w-full border-0 border-b border-divider bg-transparent pt-2 pb-2.5 text-md text-ink outline-none"
        />

        <label htmlFor="description" className="mb-1 block text-faint text-xs">
          Details
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="What should change, and why? Links to pages or examples help."
          className="mb-8 w-full border-0 border-b border-divider bg-transparent pt-2 pb-2.5 font-sans text-md text-ink outline-none"
        />

        <button
          type="submit"
          className="rounded-lg bg-ink px-6 py-3 text-base font-medium text-surface"
        >
          Submit request
        </button>
      </form>
    </div>
  );
}
