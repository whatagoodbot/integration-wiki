import broker from 'message-broker'
import services from './services/index.js'
import { logger } from './utils/logging.js'
import { metrics } from './utils/metrics.js'
import { performance } from 'perf_hooks'

const topicPrefix = `${process.env.NODE_ENV}/`
const broadcastTopic = 'broadcast'

const subscribe = () => {
  const topic = 'externalRequest'
  broker.client.subscribe(`${topicPrefix}${topic}`, (err) => {
    logger.info(`subscribed to ${topicPrefix}${topic}`)
    if (err) {
      logger.error({
        error: err.toString(),
        topic
      })
    }
  })
}

if (broker.client.connected) {
  subscribe()
} else {
  broker.client.on('connect', subscribe)
}

broker.client.on('error', (err) => {
  logger.error({
    error: err.toString()
  })
})

broker.client.on('message', async (topic, data) => {
  const startTime = performance.now()
  const topicName = topic.substring(topicPrefix.length)
  logger.debug(`Received ${topic}`)
  metrics.count('receivedMessage', { topicName })
  let requestPayload
  try {
    requestPayload = JSON.parse(data.toString())
    const validatedRequest = broker[topicName].validate(requestPayload)
    if (validatedRequest.errors) throw { message: validatedRequest.errors } // eslint-disable-line
    if (validatedRequest.service !== process.env.npm_package_name) return
    const processedResponse = await services[validatedRequest.name](validatedRequest)
    if (!processedResponse) return
    const replyTopic = processedResponse.topic ?? broadcastTopic
    const validatedResponse = broker[replyTopic].validate({
      ...validatedRequest,
      ...processedResponse.payload
    })
    if (validatedResponse.errors) throw { message: validatedResponse.errors } // eslint-disable-line
    broker.client.publish(`${topicPrefix}${replyTopic}`, JSON.stringify(validatedResponse))

    metrics.timer('responseTime', performance.now() - startTime, { topic })
  } catch (error) {
    logger.error(error.message)
    requestPayload = requestPayload || {
      messageId: 'ORPHANED'
    }
    const validatedResponse = broker.responseRead.validate({
      key: 'somethingWentWrong',
      category: 'system',
      ...requestPayload
    })
    metrics.count('error', { topicName })
    broker.client.publish(`${topicPrefix}responseRead`, JSON.stringify(validatedResponse))
  }
})
