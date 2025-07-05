import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://grchulpwtdcgfllzdkoc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h1bHB3dGRjZ2ZsbHpka29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjk4MjYsImV4cCI6MjA2NjY0NTgyNn0.ZNHzBtzZNp7Xi7qPjNis7YgiS8vO-RDpXU7VkGZTKt0'
)

// 1. Nutzer prüfen
const { data: sessionData } = await supabase.auth.getUser()
const user = sessionData.user
if (!user) {
  window.location.href = '../index.html'
}

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
  event:events(name, ort, datum)
`)
  .eq('user_id', user.id)
  .order('startzeit', { ascending: false })

const container = document.getElementById('einsatz-liste')
container.innerHTML = '' // Ladeanzeige entfernen

if (error) {
  container.innerHTML = `<p class="text-red-600">Fehler beim Laden der Daten.</p>`
} else if (!einsaetze || einsaetze.length === 0) {
  container.innerHTML = `<p class="text-gray-500">Noch keine Einsätze eingetragen.</p>`
} else {
  einsaetze.forEach(einsatz => {
    const start = new Date(einsatz.startzeit)
    const end = new Date(einsatz.endzeit)
    const pause = einsatz.pause_min || 0

    const isValidTime = end > start
    let zeitFormatted = '–'

    if (isValidTime) {
      const diffMs = end - start - pause * 60000
      const stunden = Math.floor(diffMs / 3600000)
      const minuten = Math.floor((diffMs % 3600000) / 60000)
      zeitFormatted = `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`
    }

    const datum = einsatz.event?.datum
      ? new Date(einsatz.event.datum).toLocaleDateString('de-DE', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'Unbekanntes Datum'

    const ort = einsatz.event?.ort || 'Unbekannter Ort'
    const eventName = einsatz.event?.name || 'Unbenanntes Event'

    const statusClass = {
      offen: 'text-yellow-600',
      freigegeben: 'text-green-600',
      abgelehnt: 'text-red-600'
    }[einsatz.status] || 'text-gray-500'

    const statusLabel = einsatz.status || 'Unbekannt'

    // Optional: visuelle Warnung für fehlerhafte Zeiten
    const cardClass = isValidTime ? 'bg-white' : 'bg-red-50 border border-red-300'

    container.innerHTML += `
      <div class="bg-white p-4 rounded shadow">
    <div class="flex justify-between">
      <div>
        <span class="font-semibold">${datum}</span><br />
        <span class="text-sm text-gray-600">${eventName} – ${ort}</span>
      </div>
      <div class="text-right">
        <span class="text-gray-700">${zeitFormatted} h</span>
      </div>
    </div>
    ${einsatz.kommentar ? `<p class="text-sm mt-1 text-gray-600">${einsatz.kommentar}</p>` : ''}
    <p class="text-xs mt-1 font-medium ${statusClass}">Status: ${statusLabel}</p>

    <div class="flex gap-2 mt-3 text-sm">
      <button class="text-blue-600 hover:underline" onclick="editEinsatz('${einsatz.id}')">Bearbeiten</button>
      <button class="text-red-600 hover:underline" onclick="deleteEinsatz('${einsatz.id}')">Löschen</button>
  </div>
    `
  })
}

window.deleteEinsatz = async function(einsatzId) {
  const bestaetigt = confirm("Möchtest du diesen Eintrag wirklich löschen?")
  if (!bestaetigt) return

  const { error } = await supabase
    .from('einsaetze')
    .delete()
    .eq('id', einsatzId)

  if (error) {
    alert("Fehler beim Löschen: " + error.message)
  } else {
    alert("Eintrag gelöscht.")
    window.location.reload()
  }
}

let currentEinsatzId = null

window.editEinsatz = async function (einsatzId) {
  currentEinsatzId = einsatzId

  // Lade den aktuellen Eintrag
  const { data, error } = await supabase
    .from('einsaetze')
    .select('*')
    .eq('id', einsatzId)
    .single()

  if (error || !data) return alert('Fehler beim Laden')

  // Fülle das Formular vor
  document.getElementById('edit-start').value = data.startzeit?.slice(0, 16)
  document.getElementById('edit-end').value = data.endzeit?.slice(0, 16)
  document.getElementById('edit-pause').value = data.pause_min || ''
  document.getElementById('edit-kommentar').value = data.kommentar || ''

  // Zeige das Modal
  document.getElementById('edit-modal').classList.remove('hidden')
}

document.getElementById('cancel-edit').addEventListener('click', () => {
  document.getElementById('edit-modal').classList.add('hidden')
})

document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const newStart = document.getElementById('edit-start').value
  const newEnd = document.getElementById('edit-end').value
  const newPause = parseInt(document.getElementById('edit-pause').value)
  const newKommentar = document.getElementById('edit-kommentar').value

  const { error } = await supabase
    .from('einsaetze')
    .update({
      startzeit: newStart,
      endzeit: newEnd,
      pause_min: newPause,
      kommentar: newKommentar,
    })
    .eq('id', currentEinsatzId)

  if (error) {
    alert('Fehler beim Speichern')
    console.error(error)
  } else {
    document.getElementById('edit-modal').classList.add('hidden')
    location.reload()
  }
})



