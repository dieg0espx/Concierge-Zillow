import { getInvoices } from '@/lib/actions/invoices'
import { InvoicesList } from '@/components/invoices-list'

export default async function InvoicesPage() {
  const { data: invoices, error } = await getInvoices()

  if (error) {
    console.error('Error fetching invoices:', error)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white">Invoices</h1>
          <p className="text-white/70 mt-2 tracking-wide">Create and manage client invoices</p>
        </div>
      </div>

      <InvoicesList invoices={invoices || []} />
    </div>
  )
}
