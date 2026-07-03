export interface YoutubeResponse {
  responseContext: ResponseContext
  playabilityStatus: PlayabilityStatus
  streamingData?: StreamingData
  videoDetails: VideoDetails
  microformat: Microformat
  trackingParams: string
  adBreakHeartbeatParams: string
  frameworkUpdates: FrameworkUpdates
}

export interface StreamingData {
  expiresInSeconds: string
  formats?: Format[]
  adaptiveFormats: Format[]
}

export interface Format {
  itag: number
  url?: string
  mimeType: string
  bitrate: number
  width?: number
  height?: number
  initRange?: { start: string; end: string }
  indexRange?: { start: string; end: string }
  lastModified: string
  contentLength: string
  quality: string
  fps?: number
  qualityLabel?: string
  projectionType: string
  averageBitrate?: number
  audioQuality?: string
  audioSampleRate?: string
  audioChannels?: number
  signatureCipher?: string
  cipher?: string
  approxDurationMs?: string
}

export interface FrameworkUpdates {
  entityBatchUpdate: EntityBatchUpdate
}

export interface EntityBatchUpdate {
  mutations: Mutation[]
  timestamp: Timestamp
}

export interface Mutation {
  entityKey: string
  type: string
  payload: Payload
}

export interface Payload {
  offlineabilityEntity: OfflineabilityEntity
}

export interface OfflineabilityEntity {
  key: string
  addToOfflineButtonState: string
}

export interface Timestamp {
  seconds: string
  nanos: number
}

export interface Microformat {
  playerMicroformatRenderer: PlayerMicroformatRenderer
}

export interface PlayerMicroformatRenderer {
  thumbnail: PlayerMicroformatRendererThumbnail
  embed: Embed
  title: Description
  description: Description
  lengthSeconds: string
  ownerProfileUrl: string
  externalChannelId: string
  isFamilySafe: boolean
  availableCountries: string[]
  isUnlisted: boolean
  hasYpcMetadata: boolean
  viewCount: string
  category: string
  publishDate: Date
  ownerChannelName: string
  uploadDate: Date
  isShortsEligible: boolean
  externalVideoId: string
  likeCount: string
  canonicalUrl: string
}

export interface Description {
  simpleText: string
}

export interface Embed {
  iframeUrl: string
  width: number
  height: number
}

export interface PlayerMicroformatRendererThumbnail {
  thumbnails: ThumbnailElement[]
}

export interface ThumbnailElement {
  url: string
  width: number
  height: number
}

export interface PlayabilityStatus {
  status: string
  reason: string
  errorScreen: ErrorScreen
  skip: Skip
  contextParams: string
}

export interface ErrorScreen {
  playerErrorMessageRenderer: PlayerErrorMessageRenderer
}

export interface PlayerErrorMessageRenderer {
  subreason: Description
  reason: Reason
  proceedButton: ProceedButton
  thumbnail: PlayerMicroformatRendererThumbnail
  icon: Icon
}

export interface Icon {
  iconType: string
}

export interface ProceedButton {
  buttonRenderer: ButtonRenderer
}

export interface ButtonRenderer {
  style: string
  size: string
  isDisabled: boolean
  text: Reason
  trackingParams: string
  command: Command
}

export interface Command {
  clickTrackingParams: string
  signalAction: SignalAction
}

export interface SignalAction {
  signal: string
}

export interface Reason {
  runs: Run[]
}

export interface Run {
  text: string
}

export interface Skip {
  playabilityErrorSkipConfig: PlayabilityErrorSkipConfig
}

export interface PlayabilityErrorSkipConfig {
  skipOnPlayabilityError: boolean
}

export interface ResponseContext {
  visitorData: string
  serviceTrackingParams: ServiceTrackingParam[]
  maxAgeSeconds: number
  mainAppWebResponseContext: MainAppWebResponseContext
  responseId: string
  webResponseContextExtensionData: WebResponseContextExtensionData
}

export interface MainAppWebResponseContext {
  loggedOut: boolean
  trackingParam: string
}

export interface ServiceTrackingParam {
  service: string
  params: Param[]
}

export interface Param {
  key: string
  value: string
}

export interface WebResponseContextExtensionData {
  webResponseContextPreloadData: WebResponseContextPreloadData
  hasDecorated: boolean
}

export interface WebResponseContextPreloadData {
  preloadMessageNames: string[]
}

export interface VideoDetails {
  videoId: string
  title: string
  lengthSeconds: string
  keywords: string[]
  channelId: string
  isOwnerViewing: boolean
  shortDescription: string
  isCrawlable: boolean
  thumbnail: PlayerMicroformatRendererThumbnail
  allowRatings: boolean
  viewCount: string
  author: string
  isPrivate: boolean
  isUnpluggedCorpus: boolean
  isLiveContent: boolean
  isTvfilmVideo: boolean
}
