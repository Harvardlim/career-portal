import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Subcategory = {
  id: string
  category_id: string
  name: string
  created_at: string
}

export type Category = {
  id: string
  name: string
  created_at: string
  subcategories: Subcategory[]
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, created_at, subcategories ( id, category_id, name, created_at )')
    .order('created_at', { ascending: true })
    .order('created_at', { referencedTable: 'subcategories', ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

/** Live category names, for use as options in selects/checkbox groups. */
export function useCategoryNames(): string[] {
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    fetchCategories()
      .then((rows) => {
        if (alive) setNames(rows.map((c) => c.name))
      })
      .catch((err: unknown) => {
        console.error('Failed to load categories', err)
      })
    return () => {
      alive = false
    }
  }, [])

  return names
}
