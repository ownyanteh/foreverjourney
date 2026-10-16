/** Shared TypeScript types used across client and server code */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface GeolocationState {
  position: GeolocationCoordinates | null
  error: GeolocationError | null
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported'
  accuracy: number | null
}

export interface RouteSegment {
  geometry: GeoJSON.LineString
  distance: number       // metres
  duration: number       // seconds
  steps: RouteStep[]
}

export interface RouteStep {
  instruction: string
  distance: number
  duration: number
  maneuver?: {
    type: string
    modifier?: string
  }
}

export interface CheckpointPublic {
  _id: string
  title: string
  sequence: number
  coordinates: Coordinates
  geofenceRadius: number
  required: boolean
  skippable: boolean
  isActive: boolean
}

export interface CheckpointContent {
  instructionText: string
  romanticMessage: string
  imageUrl?: string | null
  audioUrl?: string | null
  clue?: string | null
}

export interface JourneyState {
  journeyId: string
  status: 'active' | 'completed' | 'deactivated'
  title: string
  welcomeContent: {
    greeting: string
    introduction: string
    backgroundImageUrl?: string | null
    musicUrl?: string | null
  }
  theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
  }
  sessionStatus: 'active' | 'completed'
  currentCheckpointIndex: number
  totalCheckpoints: number
  completedCheckpointIds: string[]
  finalDestinationUnlocked: boolean
  responseStatus: 'pending' | 'yes' | 'no' | null
}

export interface ActiveCheckpointResponse {
  checkpoint: CheckpointPublic | null
  isLastCheckpoint: boolean
  nextIsFinalDestination: boolean
}

export interface FinalDestinationApproach {
  isApproaching: boolean
  isArrived: boolean
  approachingMessage: string
  distance: number
}

export type JourneyStatusType = 'draft' | 'active' | 'completed' | 'deactivated'

export interface AdminJourneySummary {
  _id: string
  title: string
  status: JourneyStatusType
  checkpointCount: number
  completedCheckpointCount: number
  hasInvitation: boolean
  invitationRevokedAt: string | null
  responseStatus: 'pending' | 'yes' | 'no' | null
  activatedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
