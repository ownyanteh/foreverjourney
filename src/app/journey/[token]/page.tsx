import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { hashToken } from '@/lib/tokens'
import InvitationLanding from '@/components/journey/InvitationLanding'

export const metadata: Metadata = {
  title: 'A Special Journey For You',
  description: 'A personal journey made just for you.',
}

type Props = { params: Promise<{ token: string }> }

export default async function JourneyInvitationPage({ params }: Props) {
  const { token } = await params
  if (!token) notFound()

  await connectDB()
  const tokenHash = hashToken(token)
  const journey = await Journey.findOne({
    invitationTokenHash: tokenHash,
    invitationRevokedAt: null,
  }).lean()

  if (!journey) {
    return <JourneyUnavailable />
  }

  if (journey.status === 'completed') {
    return <JourneyUnavailable message="This journey has already been completed." />
  }

  if (journey.status !== 'active') {
    return <JourneyUnavailable />
  }

  return (
    <InvitationLanding
      token={token}
      mode={journey.mode === 'questions' ? 'questions' : 'route'}
      title={journey.title}
      welcomeContent={{
        greeting: journey.welcomeContent.greeting,
        introduction: journey.welcomeContent.introduction,
        backgroundImageUrl: journey.welcomeContent.backgroundImageUrl ?? null,
        musicUrl: journey.welcomeContent.musicUrl ?? null,
      }}
      theme={{
        primaryColor: journey.theme.primaryColor,
        accentColor: journey.theme.accentColor,
        backgroundColor: journey.theme.backgroundColor,
      }}
    />
  )
}

function JourneyUnavailable({ message }: { message?: string }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-cream px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-6">💌</div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal mb-3">
          This link is unavailable
        </h1>
        <p className="text-charcoal/60 text-sm">
          {message ?? 'This invitation link may have expired or been revoked. Please check with the sender.'}
        </p>
      </div>
    </div>
  )
}
