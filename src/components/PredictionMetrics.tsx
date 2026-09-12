import type { CareerPrediction } from "@/data/types";

interface PredictionMetricsProps {
  prediction: CareerPrediction;
}

export function PredictionMetrics({ prediction }: PredictionMetricsProps) {
  return (
    <section aria-labelledby="prediction-heading">
      <h2
        id="prediction-heading"
        className="text-balance text-lg font-medium text-neutral-900"
      >
        Tahmin metrikleri
      </h2>
      <p className="mt-1 text-pretty text-sm text-neutral-500">
        Seçiminize göre istatistiksel tahminler
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {prediction.metrics.map((metric) => (
          <article
            key={metric.id}
            className="flex flex-col border border-neutral-200 bg-white p-5"
          >
            <p className="text-pretty text-sm text-neutral-500">
              {metric.label}
            </p>
            <p className="mt-3 tabular-nums text-3xl font-medium text-neutral-900">
              {metric.value}
              {metric.unit && (
                <span className="ml-1 text-base font-normal text-neutral-600">
                  {metric.unit}
                </span>
              )}
            </p>
            <p className="mt-auto pt-4 text-pretty text-xs leading-relaxed text-neutral-400">
              {metric.disclaimer}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
