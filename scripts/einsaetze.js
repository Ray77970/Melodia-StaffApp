import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://grchulpwtdcgfllzdkoc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h1bHB3dGRjZ2ZsbHpka29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjk4MjYsImV4cCI6MjA2NjY0NTgyNn0.ZNHzBtzZNp7Xi7qPjNis7YgiS8vO-RDpXU7VkGZTKt0'
)

// 1. User checken
const { data: sessionData } = await supabase.auth.getUser()
const user = sessionData.user
if (!user) {
  window.location.href = '../index.html'
}

// 2. Einsätze laden
const { data: einsaetze, error } = await supabase
  .from('einsaetze')
  .select('startzeit, endzeit, pause_min, kommentar')
  .eq('user_id', user.id)
  .order('startzeit', { ascending: false })

const container = document.getElementById('einsatz-liste')

if (error) {
  container.innerHTML = `<p class="text-red-600">Fehler beim Laden der Daten.</p>`
} else if (einsaetze.length === 0) {
  container.innerHTML = `<p class="text-gray-500">Noch keine Einsätze eingetragen.</p>`
} else {
  einsaetze.forEach(einsatz => {
    const start = new Date(einsatz.startzeit)
    const end = new Date(einsatz.endzeit)
    const pause = einsatz.pause_min || 0

    const diffMs = end - start - pause * 60000
    const stunden = Math.floor(diffMs / 3600000)
    const minuten = Math.floor((diffMs % 3600000) / 60000)
    const zeitFormatted = `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`

    const datum = start.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    container.innerHTML += `
      <div class="bg-white p-4 rounded shadow">
        <div class="flex justify-between">
          <span class="font-semibold">${datum}</span>
          <span class="text-gray-700">${zeitFormatted} h</span>
        </div>
        ${einsatz.kommentar ? `<p class="text-sm mt-1 text-gray-600">${einsatz.kommentar}</p>` : ''}
      </div>
    `
  })
}
