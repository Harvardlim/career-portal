import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Subcategory = {
  id: string
  category_id: string
  name: string
  slug: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export type Category = {
  id: string
  name: string
  slug: string | null
  icon: string | null
  description: string | null
  sort_order: number
  created_at: string
  subcategories: Subcategory[]
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(
      'id, name, slug, icon, description, sort_order, created_at, subcategories ( id, category_id, name, slug, notes, sort_order, created_at )',
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('sort_order', { referencedTable: 'subcategories', ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export function useCategories(): { categories: Category[]; loading: boolean } {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchCategories()
      .then((rows) => alive && setCategories(rows))
      .catch((err: unknown) => console.error('Failed to load categories', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return { categories, loading }
}

/** Live category names, for use as options in selects/checkbox groups. */
export function useCategoryNames(): string[] {
  const { categories } = useCategories()
  return categories.map((c) => c.name)
}
