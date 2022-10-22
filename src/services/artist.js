import queryWiki from '../libs/wiki.cjs'

export default async payload => {
  const firstAttempt = await queryWiki(payload.nowPlaying.artist)
  if (firstAttempt) {
    return {
      topic: 'broadcast',
      payload: {
        image: await firstAttempt.mainImage(),
        message: await firstAttempt.summary()
      }
    }
  } else {
    const secondAttempt = await queryWiki(`${payload.nowPlaying.artist} (band)`)
    if (secondAttempt) {
      return {
        topic: 'broadcast',
        payload: {
          image: await secondAttempt.mainImage(),
          message: await secondAttempt.summary()
        }
      }
    } else {
      const thirdAttempt = await queryWiki(`${payload.nowPlaying.artist} (musician)`)
      if (thirdAttempt) {
        return {
          topic: 'broadcast',
          payload: {
            image: await thirdAttempt.mainImage(),
            message: await thirdAttempt.summary()
          }
        }
      }
      return {
        topic: 'responseRead',
        payload: {
          key: 'noWiki',
          category: 'system'
        }
      }
    }
  }
}
