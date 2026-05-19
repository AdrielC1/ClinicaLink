export default function RolePage({ title, description, stats = [], actions = [] }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">ClinicaLink</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </section>

      {stats.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.note}</p>
            </article>
          ))}
        </section>
      )}

      {actions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Aktivitas</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {actions.map((item) => (
              <div key={item.title} className="py-4 first:pt-0 last:pb-0">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
