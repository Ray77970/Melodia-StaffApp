// login.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

// Supabase-Client initialisieren
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 1. Login-Formular abfangen
const form = document.getElementById("login-form")
const message = document.getElementById("message")

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault()

    const email = document.getElementById("email").value
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      message.textContent = "Fehler: " + error.message
      message.style.color = "red"
    } else {
      message.textContent = "Magic Link wurde gesendet. Bitte E-Mail prüfen."
      message.style.color = "green"
    }
  })
}

// 2. Redirect, wenn Magic Link geöffnet wurde
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    window.location.href = './pages/dashboard.html'
  }
})


// 3. Redirect auch nach erfolgreichem Login
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    window.location.href = './pages/dashboard.html'
  }
})
