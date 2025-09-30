export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-brand-100 border-b border-brand-300">
      <div className="container-responsive py-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">{title}</h1>
        {subtitle && <p className="mt-3 text-gray-700">{subtitle}</p>}
      </div>
    </section>
  )
}

