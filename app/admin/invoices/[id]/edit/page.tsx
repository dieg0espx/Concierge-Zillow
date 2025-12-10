import { InvoiceForm } from '@/components/invoice-form'
import { getInvoiceById } from '@/lib/actions/invoices'
import { notFound } from 'next/navigation'

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string }
}) {
  const { data: invoice, error } = await getInvoiceById(params.id)

  if (error || !invoice) {
    notFound()
  }

  if (invoice.status !== 'draft') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="glass-card-accent rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Cannot Edit Invoice</h2>
          <p className="text-white/70">
            Only draft invoices can be edited. This invoice has already been sent.
          </p>
        </div>
      </div>
    )
  }

  return <InvoiceForm invoice={invoice} />
}
