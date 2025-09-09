// ================= CONFIG =================
const MESSAGE_TEXT = "Halo semua 👋 ini pesan otomatis dari bot!" // pesan text
const DELAY_MINUTES = 1 // waktu delay antar broadcast dalam menit
// ==========================================

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  })

  sock.ev.on("creds.update", saveCreds)

  // Auto reconnect
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      console.log("❌ Connection closed due to", lastDisconnect?.error, " reconnecting:", shouldReconnect)
      if (shouldReconnect) {
        startBot()
      }
    } else if (connection === "open") {
      console.log("✅ Bot WhatsApp connected")
    }
  })

  // Fungsi broadcast ke semua grup
  async function sendToAllGroups() {
    try {
      const groups = await sock.groupFetchAllParticipating()
      const groupIds = Object.keys(groups)

      console.log(`📢 Mengirim pesan ke ${groupIds.length} grup...`)

      for (const id of groupIds) {
        await sock.sendMessage(id, { text: MESSAGE_TEXT })
        console.log(`✅ Pesan terkirim ke grup: ${groups[id].subject}`)
      }
    } catch (err) {
      console.error("⚠️ Gagal kirim pesan:", err)
    }
  }

  // Jalankan pertama kali
  sendToAllGroups()

  // Loop tiap DELAY_MINUTES menit
  setInterval(sendToAllGroups, DELAY_MINUTES * 60 * 1000)
}

startBot()
