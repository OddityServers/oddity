const fp = require('fastify-plugin')

// TODO: optimize tree like structure & write some tests
class PermissionRoute {
  constructor() {
    this.root = {}
  }

  addRoute(method, route, value) {
    const routeParts = route.split('/')
    routeParts.shift()

    const addCurrentPart = (currentRoute, partIndex) => {
      if (partIndex > routeParts.length - 1) {
        currentRoute._value = value
        return
      }

      const part = routeParts[partIndex]
      if (currentRoute[part]) {
        addCurrentPart(currentRoute[part], partIndex + 1)
      } else {
        currentRoute[part] = {}
        addCurrentPart(currentRoute[part], partIndex + 1)
      }
    }
    if (!this.root[method]) {
      this.root[method] = {}
    }
    addCurrentPart(this.root[method], 0)
  }

  lookup(method, route) {
    const routeParts = route.split('/')
    routeParts.shift()

    const getValueCurrentPart = (currentRoute, partIndex) => {
      if (partIndex > routeParts.length - 1) {
        if (currentRoute) return currentRoute._value
      }

      const part = routeParts[partIndex]
      if (currentRoute[part]) {
        return getValueCurrentPart(currentRoute[part], partIndex + 1)
      } else {
        const keys = Object.keys(currentRoute)
        for (const index in keys) {
          if (keys[index].startsWith(':'))
            return getValueCurrentPart(currentRoute[keys[index]], partIndex + 1)
        }
        if (currentRoute['*']) {
          return currentRoute['*']._value
        } else {
          console.error('NO ROUTE FOUND')
        }
      }
    }

    return getValueCurrentPart(this.root[method], 0)
  }
}

module.exports = fp(
  async (instance) => {
    const PERMISSIONS = instance.PERMISSIONS
    const PERMISSIONS_DESCRIPTIONS = instance.PERMISSIONS_DESCRIPTIONS

    const permissionRoutes = new PermissionRoute()

    // Add Permission to schema summary of route
    const addPermissionToDocumentation = (routeOptions, permission) => {
      const permissionStrings = Object.keys(PERMISSIONS).filter(
        (key) => PERMISSIONS[key] & permission
      )
      if (permissionStrings.length === 0) {
        return
      }

      let permissionMessage = `[${permissionStrings.join(' | ')}]`

      routeOptions.schema = routeOptions.schema ? routeOptions.schema : {}

      routeOptions.schema.summary = routeOptions.schema.summary
        ? routeOptions.schema.summary + ' ' + permissionMessage
        : permissionMessage

      permissionMessage = `You need one of these permissions:\n${permissionStrings.join(
        ', '
      )}`
      routeOptions.schema.description = routeOptions.schema.description
        ? routeOptions.schema.descripton + `\n` + permissionMessage
        : permissionMessage
    }

    const getPermission = (permissions) => {
      if (Array.isArray(permissions)) {
        let permission = 0
        permissions.forEach((perm) => (permission += perm))
        return permission
      } else if (permissions !== null || permissions !== undefined) {
        return permissions
      } else {
        return undefined
      }
    }

    const getHighestPermission = () => {
      let highest = 0
      Object.keys(PERMISSIONS).forEach((key) => {
        if (highest < PERMISSIONS[key]) highest = PERMISSIONS[key]
      })
      return highest
    }

    const authorizeRoute = (route, method, permission) => {
      // if root always true
      if (permission & PERMISSIONS.ADMIN) {
        return true
      }

      // get permissions based on route and method by looking up in a tree
      let routePermission = permissionRoutes.lookup(method, route)

      if (routePermission === null || routePermission === undefined) {
        return false
      }

      // If you want to use authentication without permissions set
      if (routePermission === 0) {
        return true
      }

      // check permission with an bitwise AND operation
      if (permission & routePermission) {
        return true
      }

      return false
    }

    // Add multiple permissions togheter
    const calcPermission = (...perms) => {
      let result = 0
      for (let i in perms) {
        result = result | perms[i]
      }
      return result
    }

    /**
     * Dynamically add a permission
     * @param {String} name - Name of permission, will be screaming snake case to access it
     * @param {String} module - Name of module, used for catogorizing permissions, if none given will be general
     * @param {String} description - Very short description of permission, few words
     * @param {String} details - More details explanation of permission, few lines
     */
    const addPermission = (name, module, description, details) => {
      PERMISSIONS[name.toUpperCase()] = getHighestPermission() * 2
      PERMISSIONS_DESCRIPTIONS[name.toUpperCase()] = {
        module: module || '',
        description: description || name,
        details: details || '',
      }
    }

    /**
     * Check permissions for each route
     */
    instance.addHook('onRoute', (opts) => {
      const permission = getPermission(opts.permissions)
      const methods = Array.isArray(opts.method) ? opts.method : [opts.method]

      if (
        (!opts.preHandler || opts.preHandler.length === 0) &&
        permission > 0
      ) {
        instance.log.warn(
          `Permission set but no preHandler for route: ${methods.join(', ')}: ${
            opts.path
          }`
        )
      }

      if (permission !== undefined) {
        addPermissionToDocumentation(opts, permission)
        methods.forEach((method) => {
          permissionRoutes.addRoute(method, opts.path, permission)
        })
      } else {
        instance.log.warn(
          `No permissions set for route: ${methods.join(', ')}: ${opts.path}`
        )
      }
    })

    instance.decorate('permissions', {
      calcPermission,
      authorizeRoute,
      addPermission,
    })
  },
  { name: 'permission_handler', dependencies: ['permission_decorator'] }
)
