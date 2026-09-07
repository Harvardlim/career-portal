import { supabase, isSupabaseConfigured } from './supabase'

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

export const categoriesEnabled = isSupabaseConfigured

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await client()
    .from('categories')
    .select('id, name, created_at, subcategories ( id, category_id, name, created_at )')
    .order('created_at', { ascending: true })
    .order('created_at', { referencedTable: 'subcategories', ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await client()
    .from('categories')
    .insert({ name: name.trim(), slug: slugify(name) })
    .select('id, name, created_at')
    .single()
  if (error) throw error
  return { ...(data as Omit<Category, 'subcategories'>), subcategories: [] }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await client().from('categories').delete().eq('id', id)
  if (error) throw error
}

/** Insert one or more subcategories at once. Names already present on the
 *  category are skipped, and the created rows are returned. */
export async function createSubcategories(
  categoryId: string,
  names: string[],
): Promise<Subcategory[]> {
  const seen = new Set<string>()
  const rows = names
    .map((n) => n.trim())
    .filter((n) => {
      const key = n.toLowerCase()
      if (!n || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((name) => ({ category_id: categoryId, name, slug: slugify(name) }))
  if (rows.length === 0) return []
  const { data, error } = await client()
    .from('subcategories')
    .upsert(rows, { onConflict: 'category_id,name', ignoreDuplicates: true })
    .select('id, category_id, name, created_at')
  if (error) throw error
  return (data ?? []) as Subcategory[]
}

export async function deleteSubcategory(id: string): Promise<void> {
  const { error } = await client().from('subcategories').delete().eq('id', id)
  if (error) throw error
}
