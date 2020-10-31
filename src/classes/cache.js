class SubmissionCache {
  constructor() {
    this.cache = {};
    this._count = 0;
  }

  /**
   * Adds a submission to the cache.
   * 
   * @param {Object} data The submission object.
   */

  push(data) {
    if (!data.id) return;
    this.cache[data.id] = data;
  }
  
  /**
   * Gets a submission from the cache.
   * 
   * @param {String} id The submission ID.
   */

  get(id) {
    return this.cache[id];
  }
}

module.exports = SubmissionCache;