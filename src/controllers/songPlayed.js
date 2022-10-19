import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Lastfm = require('simple-lastfm')

const createLastfmInstance = async (lastfmOptions) => {
  const lastfm = new Lastfm(lastfmOptions)
  return new Promise(resolve => {
    lastfm.getSessionKey(() => {
      resolve(lastfm)
    })
  })
}

const defaultLastfmInstance = await createLastfmInstance({
  api_key: process.env.LASTFM_API_KEY,
  api_secret: process.env.LASTFM_API_SECRET,
  username: process.env.LASTFM_USERNAME,
  password: process.env.LASTFM_PASSWORD
})

const scrobbleTrack = async (lastfmInstance, artist, track) => {
  if (process.env.NODE_ENV === 'development') return
  const promises = [
    new Promise(resolve => {
      lastfmInstance.scrobbleTrack({
        artist,
        track,
        callback: (result) => {
          resolve(result)
        }
      })
    }),
    new Promise(resolve => {
      lastfmInstance.scrobbleNowPlayingTrack({
        artist,
        track,
        callback: (result) => {
          resolve(result)
        }
      })
    })
  ]
  return Promise.all(promises)
}

export default async payload => {
  scrobbleTrack(defaultLastfmInstance, payload.artist, payload.title)
  const roomSpecificLastfmAccount = payload.meta.roomConfig.lastfm
  if (roomSpecificLastfmAccount?.enabled) {
    const roomLastfmInstance = await createLastfmInstance(roomSpecificLastfmAccount)
    scrobbleTrack(roomLastfmInstance, payload.artist, payload.title)
  }
}
