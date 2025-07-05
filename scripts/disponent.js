import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://grchulpwtdcgfllzdkoc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h1bHB3dGRjZ2ZsbHpka29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjk4MjYsImV4cCI6MjA2NjY0NTgyNn0.ZNHzBtzZNp7Xi7qPjNis7YgiS8vO-RDpXU7VkGZTKt0'
)

const { data: authData } = await supabase.auth.getUser()
const user = authData?.user

if (!user) window.location.href = '../index.html'




// Nutzername anzeigen
const usernameElement = document.getElementById('username')
const { data: profil } = await supabase
  .from('users')
  .select('name')
  .eq('id', user.id)
  .single()

if (profil?.name) {
  usernameElement.textContent = profil.name
} else {
  usernameElement.textContent = user.email.split('@')[0]
}

// Datum anzeigen
const today = new Date()
document.getElementById('current-date').textContent = today.toLocaleDateString('de-DE', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})



// 2. Einsätze laden
const { data: einsaetze, error } = await supabase
  .from('einsaetze')
  .select(`
    id,
    startzeit,
    endzeit,
    pause_min,
    kommentar,
    status,
    user:users(name),
    event:events(name, ort, datum)
  `)
  .order('startzeit', { ascending: false })

const container = document.getElementById('einsatz-liste')
container.innerHTML = ''

if (error) {
  container.innerHTML = `<p class="text-red-600">Fehler beim Laden der Einsätze.</p>`
} else if (!einsaetze || einsaetze.length === 0) {
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

    const datum = einsatz.event?.datum
      ? new Date(einsatz.event.datum).toLocaleDateString('de-DE', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : 'Unbekannt'

    const ort = einsatz.event?.ort || '–'
    const eventName = einsatz.event?.name || '–'
    const mitarbeiter = einsatz.user?.name || 'Unbekannt'

    const farbe = {
      offen: 'text-yellow-600',
      freigegeben: 'text-green-600',
      abgelehnt: 'text-red-600'
    }[einsatz.status] || 'text-gray-500'

    container.innerHTML += `
      <div class="bg-white p-4 rounded shadow">
        <div class="flex justify-between">
          <div>
            <p class="text-sm text-gray-500">${mitarbeiter}</p>
            <p class="font-semibold">${datum}</p>
            <p class="text-sm text-gray-600">${eventName} – ${ort}</p>
          </div>
          <div class="text-right">
            <p class="text-gray-700 font-medium">${zeitFormatted} h</p>
            <p class="text-xs mt-1 ${farbe}">Status: ${einsatz.status}</p>
          </div>
        </div>

        ${einsatz.kommentar ? `<p class="text-sm mt-2 text-gray-600 italic">${einsatz.kommentar}</p>` : ''}

        <div class="flex gap-2 mt-3 text-sm">
          <button onclick="setStatus('${einsatz.id}', 'freigegeben')" class="text-green-700 hover:underline">✔ Freigeben</button>
          <button onclick="setStatus('${einsatz.id}', 'abgelehnt')" class="text-red-600 hover:underline">✖ Ablehnen</button>
        </div>
      </div>
    `
  })
}

// 3. Funktion zum Status ändern
window.setStatus = async (einsatzId, neuerStatus) => {
  const { error } = await supabase
    .from('einsaetze')
    .update({ status: neuerStatus })
    .eq('id', einsatzId)

  if (error) {
    alert("Fehler beim Aktualisieren.")
  } else {
    location.reload()
  }
}
