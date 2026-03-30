import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side helper (service role) – not exposed to client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Brak id' }, { status: 400 })

  // Pobierz URL zdjęcia, żeby usunąć plik ze storage
  const { data: photo } = await supabase
    .from('photos')
    .select('url')
    .eq('id', id)
    .single()

  if (photo?.url) {
    const path = photo.url.split('/bike-photos/')[1]
    if (path) await supabase.storage.from('bike-photos').remove([path])
  }

  const { error } = await supabase.from('photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('taken_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
