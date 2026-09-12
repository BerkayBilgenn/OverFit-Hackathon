import type { UserProfile, UserSelection } from "@/data/types";

interface ProfileSummaryCardProps {
  profile: UserProfile;
  selection: UserSelection;
  onViewTest?: () => void;
}

export function ProfileSummaryCard({
  profile,
  selection,
  onViewTest,
}: ProfileSummaryCardProps) {
  return (
    <section className="border border-neutral-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 text-base font-medium text-neutral-700"
          >
            {profile.initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase text-neutral-500">
              Profil özeti
            </p>
            <h1 className="mt-1 text-balance text-2xl font-medium text-neutral-900">
              {profile.name}
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-neutral-600">
              {profile.description}
            </p>
            <p className="mt-4 text-pretty text-sm text-neutral-500">
              {selection.department} · {selection.university} ·{" "}
              {selection.city}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewTest}
          className="shrink-0 border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Testi gör
        </button>
      </div>
    </section>
  );
}
