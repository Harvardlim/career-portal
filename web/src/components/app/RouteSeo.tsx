import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applySeo, type Seo } from '@/lib/seo'
import { tr, useI18n } from '@/lib/i18n'

/**
 * Metadata for every public page, keyed by path. Anything not listed here is
 * private (dashboards, auth, checkout, legacy job-board screens) and is kept
 * out of search results. Pages with dynamic content (an expert's public
 * profile) refine these defaults themselves with useSeo() once they've loaded.
 */
const PUBLIC_PAGES: Record<string, Seo> = {
  '/': {},
  '/for-businesses': {
    get title() { return tr('seo.biz.title') },
    get description() { return tr('seo.biz.desc') },
  },
  '/for-experts': {
    get title() { return tr('seo.exp.title') },
    get description() { return tr('seo.exp.desc') },
  },
  '/categories': {
    get title() { return tr('seo.cat.title') },
    get description() { return tr('seo.cat.desc') },
  },
  '/how-it-works': {
    get title() { return tr('seo.how.title') },
    get description() { return tr('seo.how.desc') },
  },
  '/trust': {
    get title() { return tr('seo.trust.title') },
    get description() { return tr('seo.trust.desc') },
  },
  '/affiliate': {
    get title() { return tr('seo.aff.title') },
    get description() { return tr('seo.aff.desc') },
  },
  '/needs': {
    get title() { return tr('seo.needs.title') },
    get description() { return tr('seo.needs.desc') },
  },
  '/about': { get title() { return tr('seo.about.title') }, get description() { return tr('seo.about.desc') } },
  '/contact': { get title() { return tr('seo.contact.title') }, get description() { return tr('seo.contact.desc') } },
  '/faq': { get title() { return tr('seo.faq.title') }, get description() { return tr('seo.faq.desc') } },
  '/terms': { get title() { return tr('seo.terms.title') }, get description() { return tr('seo.terms.desc') } },
  '/privacy': { get title() { return tr('seo.privacy.title') }, get description() { return tr('seo.privacy.desc') } },
  '/create-account': { get title() { return tr('seo.join.title') }, get description() { return tr('seo.join.desc') } },
  '/sign-in': { get title() { return tr('seo.signin.title') }, noindex: true },
}

/** Applies the right <head> metadata for the current route; mounted once at the root. */
export function RouteSeo() {
  const { t, locale } = useI18n()
  const { pathname } = useLocation()
  useEffect(() => {
    const known = PUBLIC_PAGES[pathname]
    if (known) {
      applySeo(known, pathname)
    } else if (pathname.startsWith('/expert/')) {
      // Public profile: indexable; the page sets the expert's name once loaded.
      applySeo({ title: t('ui.expert_profile'), type: 'profile' }, pathname)
    } else {
      applySeo({ title: 'partly.asia', noindex: true }, pathname)
    }
  }, [pathname, locale])
  return null
}
