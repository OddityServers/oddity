const fp = require('fastify-plugin')

module.exports = fp(async instance => {
  const PERMISSIONS = {
    ADMIN: 0x1,
    MANAGE_ROLES: 0x2,
    MANAGE_MODULES: 0x4
  }

  const ROUTES = {
    USERS: PERMISSIONS.ADMIN,
    ROLES: [PERMISSIONS.ADMIN, PERMISSIONS.MANAGE_ROLES],
    CONFIGS: PERMISSIONS.ADMIN,
    FORUM: PERMISSIONS.ADMIN,
    MODULES: PERMISSIONS.ADMIN
  }

  const getPathFromUrl = url => {
    return url.split('/')[2]
  }

  const validateRouteAuth = (url, perms) => {
    const route = getPathFromUrl(url)

    // get permissions for the base route (/forum/test would be forum)
    const routePerm = ROUTES[route.toUpperCase()]

    if (routePerm === null) {
      return false
    }

    // check for all permissions set on route
    if (Array.isArray(routePerm)) {
      for (let i in routePerm) {
        if (perms & routePerm[i]) {
          return true
        }
      }
    }

    // check single permission set on route
    if (perms & routePerm) {
      return true
    }

    return false
  }

  const calcPermission = tags => {
    let result = 0
    for (let i in tags) {
      result += PERMISSIONS[tags[i]]
    }
    return result
  }

  instance.decorate('permissions', {
    validateRouteAuth,
    calcPermission
  })
})
