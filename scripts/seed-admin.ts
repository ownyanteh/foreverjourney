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
 *
 * To change the password of an existing admin: npm run seed:admin -- --reset
 */

import readline from 'readline'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const RESET = process.argv.includes('--reset')

async function prompt(question: string, silent = false): Promise<string> {
  if (!silent) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })
  }

  return new Promise((resolve) => {
    process.stdout.write(question)
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    let input = ''
    const onData = (chunk: Buffer) => {
      // A chunk can hold several characters (e.g. a paste), so handle each one
      for (const char of chunk.toString('utf8')) {
        if (char === '\n' || char === '\r') {
          process.stdin.off('data', onData)
          process.stdin.setRawMode?.(false)
          process.stdin.pause()
          process.stdout.write('\n')
          resolve(input)
          return
        } else if (char === '\u0003') {
          process.exit(1)
        } else if (char === '\u007f' || char === '\b') {
          input = input.slice(0, -1)
        } else if (char >= ' ') {
          input += char
        }
      }
    }
    process.stdin.on('data', onData)
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
  if (password.length > 128) {
    console.error('❌  Password must be at most 128 characters (the login form rejects longer ones).')
    process.exit(1)
  }
  if (!process.env.SEED_ADMIN_PASSWORD) {
    const confirm = await prompt('Confirm password: ', true)
    if (confirm !== password) {
      console.error('❌  Passwords do not match.')
      process.exit(1)
    }
  }

  console.log('\n🔗  Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)

  // Avoid loading the full Next.js env validation; import model directly
  const { AdminUser } = await import('../src/lib/db/models/AdminUser.js')

  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await AdminUser.findOne({ email: email.toLowerCase() })
  if (existing) {
    if (!RESET) {
      console.log('ℹ️   An admin with that email already exists. No changes made.')
      console.log('    To change its password, run: npm run seed:admin -- --reset')
      await mongoose.disconnect()
      return
    }
    await AdminUser.updateOne({ _id: existing._id }, { passwordHash })
    console.log(`✅  Password reset for ${email}`)
    await mongoose.disconnect()
    return
  }
  await AdminUser.create({ email: email.toLowerCase(), passwordHash, role: 'admin' })

  console.log(`✅  Admin account created for ${email}`)
  console.log(`    You can now log in at: ${process.env.APP_URL || 'http://localhost:3000'}/admin/login`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('❌  Seed script failed:', err)
  process.exit(1)
})
