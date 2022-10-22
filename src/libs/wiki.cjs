const wiki = require('wikijs').default

module.exports = async (searchTerm) => {
  return new Promise(resolve => {
    wiki()
      .page(searchTerm)
      .then(resolve)
      .catch(() => {
        resolve()
      })
  })
}
