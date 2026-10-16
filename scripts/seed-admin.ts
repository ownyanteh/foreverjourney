/**
 * CLI script to create the initial admin account.
 * Usage: npm run seed:admin
 *
 * Required environment variables (in .env.local):
 *   MONGODB_URI, AUTH_SECRET, APP_URL, ORS_API_KEY,
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * You will be prompted for the admin email and password interactively,
 * or you can set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars.
 */

import readline from 'readline'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

async function prompt(question: string, silent = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    if (silent) {
      process.stdout.write(question)
      process.stdin.setRawMode?.(true)
      let input = ''
      process.stdin.on('data', (chunk) => {
        const char = chunk.toString()
        if (char === '\n' || char === '\r') {
          process.stdin.setRawMode?.(false)
          process.stdout.write('\n')
          rl.close()
          resolve(input)
        } else if (char === '\u0003') {
          process.exit()
        } else {
          input += char
        }
      })
    } else {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    }
  })
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set. Add it to your .env.local file.')
    process.exit(1)
  }

  const email =
    process.env.SEED_ADMIN_EMAIL || (await prompt('Admin email: '))
  const password =
    process.env.SEED_ADMIN_PASSWORD || (await prompt('Admin password (min 12 chars): ', true))

  if (!email || !email.includes('@')) {
    console.error('❌  Invalid email.')
    process.exit(1)
  }
  if (!password || password.length < 12) {
    console.error('❌  Password must be at least 12 characters.')
    process.exit(1)
  }

  console.log('\n🔗  Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)

  // Avoid loading the full Next.js env validation; import model directly
  const { AdminUser } = await import('../src/lib/db/models/AdminUser.js')

  const existing = await AdminUser.findOne({ email: email.toLowerCase() })
  if (existing) {
    console.log('ℹ️   An admin with that email already exists. No changes made.')
    await mongoose.disconnect()
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await AdminUser.create({ email: email.toLowerCase(), passwordHash, role: 'admin' })

  console.log(`✅  Admin account created for ${email}`)
  console.log(`    You can now log in at: ${process.env.APP_URL || 'http://localhost:3000'}/admin/login`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('❌  Seed script failed:', err)
  process.exit(1)
})
