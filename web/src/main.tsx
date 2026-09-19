import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'
import { captureRefFromUrl } from './lib/affiliate'
import { LanguageProvider } from './lib/i18n'

// Stash any ?ref= affiliate code before the router touches the URL; it's
// consumed later when the visitor registers.
captureRefFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <Toaster position="top-center" richColors closeButton />
      <RouterProvider router={router} />
    </LanguageProvider>
  </StrictMode>,
)
