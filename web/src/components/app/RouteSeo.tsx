import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applySeo, type Seo } from '@/lib/seo'

/**
 * Metadata for every public page, keyed by path. Anything not listed here is
 * private (dashboards, auth, checkout, legacy job-board screens) and is kept
 * out of search results. Pages with dynamic content (an expert's public
 * profile) refine these defaults themselves with useSeo() once they've loaded.
 */
const PUBLIC_PAGES: Record<string, Seo> = {
  '/': {},
  '/for-businesses': {
    title: 'For Businesses — Post your project free, meet verified experts',
    description:
      'Describe what your business needs and partly.asia matches you with up to 10 verified fractional experts in HR, IT, Finance, Marketing, Legal, Sales, Strategy and Operations. Posting is free.',
  },
  '/for-experts': {
    title: 'For Experts — Real leads from verified businesses',
    description:
      'Apply to real projects from verified businesses across Southeast Asia. Pay a small fixed fee only when a business releases contact to you — never for browsing or applying.',
  },
  '/categories': {
    title: 'Expert Categories — HR, IT, Finance, Marketing, Legal, Sales, Strategy, Operations',
    description:
      'Every business function partly.asia covers, and the specialist sub-categories experts serve within each one.',
  },
  '/how-it-works': {
    title: 'How It Works & Pricing — Fixed local fees, no subscriptions',
    description:
      'Businesses post free. Experts pay a fixed local-currency fee per released lead, with an optional annual Fully verified badge. See the exact prices for Singapore, Malaysia, Indonesia, Thailand, Vietnam and the Philippines.',
  },
  '/trust': {
    title: 'Trust & Verification — Verified on both sides',
    description:
      'How partly.asia verifies every expert (identity check, optional document review) and every business (registration number, optional document review) before anyone is matched.',
  },
  '/affiliate': {
    title: 'Affiliate Programme — Earn fixed commissions on referrals',
    description:
      'Refer businesses and experts to partly.asia and earn a fixed commission every time a referral unlocks a lead or buys a Fully verified badge — recurring on every renewal.',
  },
  '/needs': {
    title: 'Open Needs — Projects from verified businesses',
    description:
      'Browse live project needs posted by verified businesses across Southeast Asia and apply to the ones that fit your expertise.',
  },
  '/about': { title: 'About partly.asia', description: 'Who is behind partly.asia and why we built a verified, pay-per-lead marketplace for fractional experts in Southeast Asia.' },
  '/contact': { title: 'Contact', description: 'Get in touch with the partly.asia team.' },
  '/faq': { title: 'FAQ — Questions we hear most', description: 'Answers on how matching, verification, fees and the 2-day unlock window work on partly.asia.' },
  '/terms': { title: 'Terms & Conditions', description: 'The terms that govern the use of partly.asia by businesses and experts.' },
  '/privacy': { title: 'Privacy Policy', description: 'How partly.asia collects, uses and protects personal data.' },
  '/create-account': { title: 'Join partly.asia', description: 'Create your business or expert account on partly.asia.' },
  '/sign-in': { title: 'Sign in', noindex: true },
}

/** Applies the right <head> metadata for the current route; mounted once at the root. */
export function RouteSeo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const known = PUBLIC_PAGES[pathname]
    if (known) {
      applySeo(known, pathname)
    } else if (pathname.startsWith('/expert/')) {
      // Public profile: indexable; the page sets the expert's name once loaded.
      applySeo({ title: 'Expert profile', type: 'profile' }, pathname)
    } else {
      applySeo({ title: 'partly.asia', noindex: true }, pathname)
    }
  }, [pathname])
  return null
}
