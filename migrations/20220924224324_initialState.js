
export const up = (knex) => {
  return knex.schema
    .createTable('users', function (table) {
      table.string('id', 255).notNullable().primary()
      table.string('name', 255)
      table.timestamp('lastWelcomed')
      table.timestamp('lastDisconnected')
      table.timestamps(true, true, true)
    })
}

export const down = (knex) => {
  return knex.schema
    .dropTable('users')
}
