import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://grchulpwtdcgfllzdkoc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2h1bHB3dGRjZ2ZsbHpka29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjk4MjYsImV4cCI6MjA2NjY0NTgyNn0.ZNHzBtzZNp7Xi7qPjNis7YgiS8vO-RDpXU7VkGZTKt0';
const supabase = createClient(supabaseUrl, supabaseKey)

// Nutzer laden
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

// Events laden
const eventSelect = document.getElementById('event')
const { data: events } = await supabase
  .from('events')
  .select('id, name')
  .order('datum', { ascending: true })

events?.forEach(event => {
  const option = document.createElement('option')
  option.value = event.id
  option.textContent = event.name
  eventSelect.appendChild(option)
})

// Formular-Logik
const form = document.getElementById('einsatz-form')
const meldung = document.getElementById('meldung')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  meldung.classList.add('hidden')

  const start = document.getElementById('startzeit').value
  const end = document.getElementById('endzeit').value
  const pause = document.getElementById('pause').value || 0
  const kommentar = document.getElementById('kommentar').value
  const eventId = eventSelect.value

  if (!eventId) {
    meldung.textContent = 'Bitte ein Event auswählen.'
    meldung.className = 'text-sm mt-2 text-red-600 block'
    return
  }

  const einsatz = {
    user_id: user.id,
    event_id: eventId,
    startzeit: start,
    endzeit: end,
    pause_min: parseInt(pause),
    kommentar: kommentar,
    status: 'offen',
  }

  const { error } = await supabase.from('einsaetze').insert(einsatz)

  if (error) {
    meldung.textContent = 'Fehler beim Speichern.'
    meldung.className = 'text-sm mt-2 text-red-600 block'
  } else {
    meldung.textContent = 'Erfolgreich gespeichert!'
    meldung.className = 'text-sm mt-2 text-green-600 block'
    form.reset()
  }
})
