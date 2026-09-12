import type { WhatIfComparison as WhatIfComparisonData } from "@/data/types";
import { cn } from "@/lib/cn";

interface WhatIfComparisonProps {
  data: WhatIfComparisonData;
}

function ScenarioCard({
  title,
  scenario,
  highlighted,
}: {
  title: string;
  scenario: WhatIfComparisonData["current"];
  highlighted?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex flex-col border bg-white p-6",
        highlighted ? "border-neutral-900" : "border-neutral-200",
      )}
    >
      <p className="text-xs uppercase text-neutral-500">{title}</p>
      <h3 className="mt-2 text-balance text-base font-medium text-neutral-900">
        {scenario.department}
      </h3>
      <p className="mt-1 text-pretty text-sm text-neutral-500">
        {scenario.university} · {scenario.city}
      </p>

      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-xs text-neutral-500">Başlangıç maaşı</dt>
          <dd className="mt-0.5 tabular-nums text-sm font-medium text-neutral-900">
            {scenario.salaryRange}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">İstihdam olasılığı</dt>
          <dd className="mt-0.5 tabular-nums text-sm font-medium text-neutral-900">
            %{scenario.employmentProbability}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">İş bulma süresi</dt>
          <dd className="mt-0.5 tabular-nums text-sm font-medium text-neutral-900">
            {scenario.jobSearchMonths}
          </dd>
        </div>
      </dl>

      <p className="mt-auto pt-6 text-pretty text-sm leading-relaxed text-neutral-600">
        {scenario.summary}
      </p>
    </article>
  );
}

export function WhatIfComparison({ data }: WhatIfComparisonProps) {
  return (
    <section aria-labelledby="whatif-heading">
      <h2
        id="whatif-heading"
        className="text-balance text-lg font-medium text-neutral-900"
      >
        Ne olurdu?
      </h2>
      <p className="mt-1 text-pretty text-sm text-neutral-500">
        Aynı profille farklı bir bölüm ve şehir seçilseydi sonuçlar nasıl
        değişirdi?
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ScenarioCard
          title="Mevcut seçim"
          scenario={data.current}
          highlighted
        />
        <ScenarioCard title="Alternatif senaryo" scenario={data.alternative} />
      </div>
    </section>
  );
}
