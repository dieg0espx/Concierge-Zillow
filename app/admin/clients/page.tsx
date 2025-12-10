import { getAllClients } from '@/lib/actions/clients'
import { ClientsList } from '@/components/clients-list'

export default async function ClientsPage() {
  const { data: clients, error } = await getAllClients()

  if (error) {
    console.error('Error fetching clients:', error)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white">My Clients</h1>
          <p className="text-white/70 mt-2 tracking-wide">Manage your client portfolio</p>
        </div>
      </div>

      <ClientsList clients={clients || []} />
    </div>
  )
}
