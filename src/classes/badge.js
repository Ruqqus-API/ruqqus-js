class Badge {
  constructor(data) {
    Object.assign(this, Badge.formatData(data));
  }

  static formatData(resp) {
    if (!resp.name) return undefined;
    
    return {
      name: resp.name,
      description: resp.text,
      url: resp.url,
      created_at: resp.created_utc
    }
  }
}

module.exports = Badge;