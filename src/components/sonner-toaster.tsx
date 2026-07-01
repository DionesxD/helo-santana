'use client'

import { Toaster, toast } from 'sonner'

export { toast }

export function SonnerToaster() {
  return <Toaster richColors closeButton position="top-center" />
}
