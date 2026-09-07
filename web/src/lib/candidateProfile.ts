import { supabase } from './supabase'

export type SocialLink = { platform: string; url: string }

/** The subset of `public.candidates` the Dashboard > Settings tabs read and write. */
export type CandidateProfileRow = {
  id: string
  full_name: string
  avatar_path: string | null
  title: string | null
  personal_website: string | null
  education: string | null
  years_experience: string | null
  nationality: string | null
  date_of_birth: string | null
  gender: string | null
  marital_status: string | null
  biography: string | null
  map_location: string | null
  contact_number: string | null
  email: string | null
  social_links: SocialLink[]
  preferred_category: string | null
  preferred_subcategory: string | null
}

export type ResumeRow = {
  id: string
  candidate_id: string
  storage_path: string
  file_name: string
  size_bytes: number | null
  created_at: string
}

const PROFILE_COLUMNS =
  'id, full_name, avatar_path, title, personal_website, education, years_experience, nationality, date_of_birth, gender, marital_status, biography, map_location, contact_number, email, social_links, preferred_category, preferred_subcategory'

/** Uploads a candidate profile photo to the public `avatars` bucket, returns its URL. */
export async function uploadCandidateAvatar(
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/photo.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  return `${url}?v=${Date.now()}`
}

export async function fetchMyCandidate(
  userId: string,
): Promise<CandidateProfileRow | null> {
  const { data, error } = await supabase
    .from('candidates')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data, social_links: normalizeLinks(data.social_links) } as CandidateProfileRow
}

export async function updateMyCandidate(
  userId: string,
  patch: Partial<Omit<CandidateProfileRow, 'id'>>,
): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .update(patch)
    .eq('user_id', userId)
  if (error) throw error
}

function normalizeLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map((v) => ({ platform: String(v.platform ?? ''), url: String(v.url ?? '') }))
}

/* ---------- Resumes ---------- */

export async function fetchMyResumes(candidateId: string): Promise<ResumeRow[]> {
  const { data, error } = await supabase
    .from('candidate_resumes')
    .select('id, candidate_id, storage_path, file_name, size_bytes, created_at')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ResumeRow[]
}

export async function uploadResume(
  candidateId: string,
  file: File,
): Promise<ResumeRow> {
  const path = `${candidateId}/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data, error: insertError } = await supabase
    .from('candidate_resumes')
    .insert({
      candidate_id: candidateId,
      storage_path: path,
      file_name: file.name,
      size_bytes: file.size,
    })
    .select('id, candidate_id, storage_path, file_name, size_bytes, created_at')
    .single()
  if (insertError) throw insertError
  return data as ResumeRow
}

export async function deleteResume(row: ResumeRow): Promise<void> {
  const { error } = await supabase.from('candidate_resumes').delete().eq('id', row.id)
  if (error) throw error
  await supabase.storage.from('resumes').remove([row.storage_path])
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
