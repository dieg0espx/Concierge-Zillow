import { getInvoices } from '@/lib/actions/invoices'
import { InvoicesList } from '@/components/invoices-list'

export default async function InvoicesPage() {
  const { data: invoices, error } = await getInvoices()

  if (error) {
    console.error('Error fetching invoices:', error)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider sm:tracking-widest text-white">Invoices</h1>
          <p className="text-white/70 mt-1 sm:mt-2 tracking-wide text-sm sm:text-base">Create and manage client invoices</p>
        </div>
      </div>

      <InvoicesList invoices={invoices || []} />
    </div>
  )
}
