'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('configs', [
      {
        name: 'default',
        isActive: true,
        title: 'Default',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('configs', {
      name: 'default'
    })
  }
}
