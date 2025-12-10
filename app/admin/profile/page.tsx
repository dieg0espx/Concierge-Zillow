import { getCurrentManagerProfile } from '@/lib/actions/clients'
import { ProfilePictureUpload } from '@/components/profile-picture-upload'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Phone, AlertCircle } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

export default async function MyProfilePage() {
  // Get current manager profile
  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  // Show error if manager profile not found
  if (managerError || !managerProfile) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white mb-2">My Profile</h1>
          <p className="text-white/70 mt-2 tracking-wide">View and manage your profile information</p>
        </div>

        <Card className="elevated-card overflow-hidden">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3 text-white">Profile Not Found</h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Your account is not linked to a property manager profile.
              Please contact an administrator to set up your profile.
            </p>
            <p className="text-sm text-white/50">
              Error: {managerError || 'Manager profile not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <h1 className="luxury-heading text-3xl sm:text-4xl font-bold tracking-widest text-white mb-2">My Profile</h1>
        <p className="text-white/70 mt-2 tracking-wide">View and manage your profile information</p>
      </div>

      {/* Profile Card */}
      <Card className="elevated-card overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <ProfilePictureUpload
                managerId={managerProfile.id}
                currentPictureUrl={managerProfile.profile_picture_url}
                managerName={managerProfile.name}
              />
            </div>

            {/* Manager Info */}
            <div className="flex-1">
              <h2 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-white mb-4">
                {managerProfile.name}
              </h2>
              <div className="flex flex-col gap-3 text-white/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <span className="tracking-wide">{managerProfile.email}</span>
                </div>
                {managerProfile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <span className="tracking-wide">{formatPhoneNumber(managerProfile.phone)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
