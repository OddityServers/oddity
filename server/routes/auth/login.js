module.exports = async fastify => {
  fastify.get(
    '/auth/login',
    {
      preHandler: fastify.auth([
        fastify.verify.basic.portal,
        fastify.verify.basic.user
      ])
    },
    (request, reply) => {
      fastify.User.findById(request.credentials.id)
        .then(user => {
          request.session.user = request.credentials

          fastify.Role.findById(user.roleId)
            .then(role => {
              if (role === null) {
                // every user should have a role
                throw Error('User does not have a role')
              }

              const userCookie = {
                _id: user._id.toString(),
                username: user.username,
                email: user.email,
                roleId: role._id.toString(),
                permissions: role.permissions
              }

              reply.setCookie('user', JSON.stringify(userCookie), {
                httpOnly: !(fastify.config.NODE_ENV === 'development'), // set httpOnly and secure off when in dev
                secure: false,//!(fastify.config.NODE_ENV === 'development'),
                path: '/'
              })
              reply.send()
            })
            .catch(err => {
              fastify.log.error(err)
              reply.send(fastify.httpErrors.internalServerError())
            })
        })
        .catch(err => {
          fastify.log.error(err)
          reply.send(fastify.httpErrors.internalServerError())
        })
    }
  )
}
