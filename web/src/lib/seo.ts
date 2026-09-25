// Per-route <head> management for a client-rendered app: title, description,
// canonical URL, robots and the social-preview (Open Graph / Twitter) tags.
// index.html carries the site-wide defaults; this rewrites them as the route
// changes so search engines and link previews see the right page, not the
// home page's copy every time.
import { useEffect } from 'react'
import { SITE_URL } from './site'

export const SITE_NAME = 'partly.asia'
export const DEFAULT_TITLE = 'partly.asia — Verified experts, matched to real business needs'
export const DEFAULT_DESCRIPTION =
  'partly.asia matches businesses with verified fractional experts across Southeast Asia — post free, pay only when a business shows real interest.'
export const OG_IMAGE = `${SITE_URL}/og-image.png`

export type Seo = {
  /** Page title. Suffixed with the site name unless it already contains it. */
  title?: string
  description?: string
  /** Path for the canonical URL, e.g. "/for-experts". Defaults to the current path. */
  path?: string
  /** Keep the page out of search results (dashboards, auth, anything personal). */
  noindex?: boolean
  image?: string
  type?: 'website' | 'profile' | 'article'
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applySeo(seo: Seo, currentPath: string) {
  const title = !seo.title
    ? DEFAULT_TITLE
    : seo.title.includes(SITE_NAME)
      ? seo.title
      : `${seo.title} | ${SITE_NAME}`
  const description = seo.description ?? DEFAULT_DESCRIPTION
  const path = seo.path ?? currentPath
  const url = `${SITE_URL}${path === '/' ? '/' : path.replace(/\/+$/, '')}`
  const image = seo.image ?? OG_IMAGE

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow')
  upsertLink('canonical', url)

  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:type', seo.type ?? 'website')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', image)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)
}

/** Set this page's <head> metadata; re-applies whenever the values change. */
export function useSeo(seo: Seo) {
  const { title, description, path, noindex, image, type } = seo
  useEffect(() => {
    applySeo({ title, description, path, noindex, image, type }, window.location.pathname)
  }, [title, description, path, noindex, image, type])
}
