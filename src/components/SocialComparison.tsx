import type { SocialComparison as SocialComparisonData } from "@/data/types";

interface SocialComparisonProps {
  data: SocialComparisonData;
}

export function SocialComparison({ data }: SocialComparisonProps) {
  return (
    <section
      aria-labelledby="social-heading"
      className="border border-neutral-200 bg-white p-6 sm:p-8"
    >
      <h2
        id="social-heading"
        className="text-balance text-lg font-medium text-neutral-900"
      >
        Sosyal karşılaştırma
      </h2>
      <p className="mt-1 text-pretty text-sm text-neutral-500">
        {data.profileMatchDescription}
      </p>

      <ul className="mt-6 space-y-5">
        {data.stats.map((stat) => (
          <li key={stat.id}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-pretty text-sm text-neutral-700">
                %{stat.percentage}&apos;i {stat.text}
              </p>
              <span className="tabular-nums text-sm font-medium text-neutral-900">
                %{stat.percentage}
              </span>
            </div>
            <div
              aria-hidden
              className="mt-2 h-1 w-full bg-neutral-100"
            >
              <div
                className="h-full bg-neutral-800"
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-pretty text-xs text-neutral-400">
        {data.sampleSize.toLocaleString("tr-TR")} anonim mezun verisine
        dayanmaktadır.
      </p>
    </section>
  );
}
