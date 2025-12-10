import { QuoteForm } from '@/components/quote-form'
import { getQuoteById } from '@/lib/actions/quotes'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

interface EditQuotePageProps {
  params: { id: string }
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { data: quote, error } = await getQuoteById(params.id)

  if (error || !quote) {
    notFound()
  }

  if (quote.status !== 'draft') {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/admin/quotes"
            className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Link>
        </div>
        <div className="p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
          Only draft quotes can be edited. This quote has already been sent.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/quotes"
          className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Link>
        <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white">
          Edit Quote
        </h1>
        <p className="text-white/70 mt-2 tracking-wide">
          {quote.quote_number} - {quote.client_name}
        </p>
      </div>

      <QuoteForm quote={quote} mode="edit" />
    </div>
  )
}
