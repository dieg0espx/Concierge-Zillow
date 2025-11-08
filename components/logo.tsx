import Image from 'next/image'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ''}`}>
      <Image
        src="/logo/CL White LOGO.png"
        alt="Cadiz & Lluis Logo"
        width={56}
        height={56}
        priority
        className="h-10 w-auto"
      />
    </div>
  )
}

