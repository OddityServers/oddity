const fp = require('fastify-plugin')

module.exports = fp(async instance => {
  const userSchema = new instance.mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      max: 30
    },
    password: {
      type: String,
      required: true,
      min: 8,
      max: 40
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    ip: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      max: 30
    },
    role: {
      type: Number,
      required: true
    }
  })

  const User = instance.mongoose.connection.model('User', userSchema)

  instance.decorate('User', User)
})
