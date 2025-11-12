const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://esdkkyekfnpmwifyohac.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM'
)

async function findPropertyWithManager() {
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      id,
      address,
      property_manager_assignments (
        property_managers (
          name,
          email
        )
      )
    `)
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  // Find a property with managers
  for (const property of properties) {
    const managers = property.property_manager_assignments
      ?.map(pa => pa.property_managers)
      .filter(Boolean)

    if (managers && managers.length > 0) {
      console.log('\nProperty found:')
      console.log('ID:', property.id)
      console.log('Address:', property.address)
      console.log('Managers:')
      managers.forEach(m => {
        console.log(`  - ${m.name} (${m.email})`)
      })
      console.log('\nTest URL: http://localhost:3001/property/' + property.id)
      return
    }
  }

  console.log('No properties with managers found')
}

findPropertyWithManager()
