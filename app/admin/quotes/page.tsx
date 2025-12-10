import { QuotesList } from '@/components/quotes-list'
import { getQuotes } from '@/lib/actions/quotes'

export default async function QuotesPage() {
  const { data: quotes, error } = await getQuotes()

  if (error) {
    console.error('Error fetching quotes:', error)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white">Quotes</h1>
          <p className="text-white/70 mt-2 tracking-wide">
            Create and manage quotes for exotic cars, private jets, and other luxury services
          </p>
        </div>
      </div>

      <QuotesList quotes={quotes || []} />
    </div>
  )
}
