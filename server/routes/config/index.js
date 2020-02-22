module.exports = async fastify => {
  require('./routes')(fastify)

  // Get Default Config (NOT USED)
  fastify.get('/config', (request, reply) => {
    fastify.models.config
      .findOne({ where: { isActive: true }, include: [fastify.models.route] })
      .then(config => {
        reply.send(config)
      })
      .catch(err => {
        fastify.log.error(err)
        fastify.sentry.captureException(err)
        reply.send(fastify.httpErrors.internalServerError())
      })
  })
}
