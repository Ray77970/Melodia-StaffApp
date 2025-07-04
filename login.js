// login.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

// Supabase-Client initialisieren
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const form = document.getElementById("login-form")
const message = document.getElementById("message")

form.addEventListener("submit", async function (e) {
  e.preventDefault()

  const email = document.getElementById("email").value.trim().toLowerCase()

  // Schritt 1: Prüfen, ob die E-Mail in der `users` Tabelle existiert
  const { data: users, error: userCheckError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)

  if (userCheckError) {
    message.textContent = "Technischer Fehler beim Prüfen der E-Mail."
    message.style.color = "red"
    return
  }

  if (!users || users.length === 0) {
    message.textContent = "Diese E-Mail ist nicht registriert bei Melodia."
    message.style.color = "red"
    return
  }

  // Schritt 2: Magic Link senden
  const { error } = await supabase.auth.signInWithOtp({ email })

  if (error) {
    message.textContent = "Fehler beim Senden: " + error.message
    message.style.color = "red"
  } else {
    message.textContent = "Magic Link wurde gesendet. Bitte E-Mail prüfen."
    message.style.color = "green"
  }
})



supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    const userEmail = session.user.email

    // Rolle des Users aus Tabelle holen
    const { data: userData, error } = await supabase
      .from("users")
      .select("rolle")
      .eq("email", userEmail)
      .single()

    if (error || !userData) {
      alert("Fehler beim Abrufen der Rolle.")
      return
    }

    const rolle = userData.rolle

    if (rolle === "disponent") {
      window.location.href = './pages/disponent.html'
    } else {
      window.location.href = './pages/dashboard.html'
    }
  }
})

