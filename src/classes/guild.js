const { ScopeError, RuqqusAPIError } = require("./error.js");

class GuildBase {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  /**
   * Submits a post to the guild.
   * 
   * @param {String} title The title of the post.
   * @param {Object} options The post parameters.
   * @param {String} [body] The body of the post. Can include HTML and Markdown.
   * @param {String} [url] The post URL.
   * @param {Boolean} [nsfw=false] Whether or not the post should be marked as NSFW.
   */

  async post(title, options) {
    if (!this.client.scopes.create) throw new ScopeError(`Missing "create" scope`);

    if (!title || title == " ") throw new RuqqusAPIError("Cannot provide an empty post title");
    if (!options || ((!options.body || options.body == " ") && (!options.url || options.url == " "))) {
      throw new RuqqusAPIError("Submissions must have at least either a valid body or URL");
    }

    let resp = await this.client.APIRequest({ type: "POST", path: "submit", options: { board: this.all ? "general" : this.name, title, ...options || {} } });
    return new (require("./post.js")).Post(resp);
  }

  /**
   * Fetches an array of post objects from the guild.
   * 
   * @param {Object} [options] The post sorting parameters.
   * @param {String} [options.sort=new] The post sorting method.
   * @param {Number} [options.page=1] The page index to fetch posts from.
   * @param {String} [options.filter=all] The post filter method.
   * @param {Array} [options.timeframe=[0, 0]] The UTC timeframe in which to fetch posts from.
   * @param {Boolean} [options.ignore_pinned=false] Whether or not to ignore pinned posts.
   * @param {Boolean} [cache=true] Whether or not the posts should be cached.
   * @returns {Array} The post objects.
   */

  async fetchPosts(options) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);

    let resp = await this.client.APIRequest({ type: "GET", path: this.all ? "all/listing" : `guild/${this.name}/listing`, options: { 
      sort: options && options.sort || "new", 
      page: options && options.page || 1, 
      t: options && options.filter || "all", 
      utc_greater_than: options && options.timeframe && options.timeframe[0] || 0,
      utc_less_than: options && options.timeframe && options.timeframe[1] || 0,
      ignore_pinned: options && options.ignore_pinned || false
    } });
    
    const { Post } = require("./post.js");
    let posts = resp.data.map(post => new Post(post, this.client));

    if (!options || options.cache !== false) this.client.posts.cache.add(posts);
    return posts;
  }

  /**
   * Fetches an array of comment objects from the guild.
   * 
   * @param {Object} [options] The post sorting parameters.
   * @param {Number} [options.page=1] The page index to fetch comments from.
   * @param {Boolean} [cache=true] Whether or not the posts should be cached.
   * @returns {Array} The comment objects.
   */

  async fetchComments(options) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);

    let resp = await this.client.APIRequest({ type: "GET", path: this.all ? "front/comments" : `guild/${this.name}/comments`, options: { 
      page: options && options.page || 1 
    } });

    const { Comment } = require("./comment.js");
    let comments = resp.data.map(comment => new Comment(comment, this.client));

    if (!options || options.cache !== false) this.client.comments.cache.add(comments);
    return comments;
  }
}

class Guild extends GuildBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, Guild.formatData(data, client));
  }

  static formatData(resp, client) {
    if (!resp.id) return undefined;

    const { UserCore, BannedUser, DeletedUser } = require("./user.js");

    return {
      name: resp.name,
      description: {
        text: resp.description,
        html: resp.description_html
      },
      color: resp.color,
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      subscribers: resp.subscriber_count,
      guildmasters: resp.guildmasters.map(mod => {
        if (mod.is_banned) {
          return new BannedUser(mod);
        } else if (mod.is_deleted) {
          return new DeletedUser(mod);
        } else {
          return new UserCore(mod, client);
        }
      }),
      icon_url: resp.profile_url.startsWith("/assets") ? `https://ruqqus.com/${resp.profile_url}` : resp.profile_url,
      banner_url: resp.banner_url.startsWith("/assets") ? `https://ruqqus.com/${resp.banner_url}` : resp.banner_url,
      created_at: resp.created_utc,
      flags: {
        banned: resp.is_banned,
        private: resp.is_private,
        restricted: resp.is_restricted,
        age_restricted: resp.over_18,
        siege_protected: resp.is_siege_protected
      }
    }
  }
}

class GuildCore extends GuildBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, GuildCore.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    return {
      name: resp.name,
      description: {
        text: resp.description,
        html: resp.description_html
      },
      color: resp.color,
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      icon_url: resp.profile_url.startsWith("/assets") ? `https://ruqqus.com/${resp.profile_url}` : resp.profile_url,
      banner_url: resp.banner_url.startsWith("/assets") ? `https://ruqqus.com/${resp.banner_url}` : resp.banner_url,
      created_at: resp.created_utc,
      flags: {
        banned: resp.is_banned,
        private: resp.is_private,
        restricted: resp.is_restricted,
        age_restricted: resp.over_18,
        siege_protected: resp.is_siege_protected
      }
    }
  }
}

class BannedGuild {
  constructor(data) {
    Object.assign(this, BannedGuild.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      name: resp.name,
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      ban_reason: resp.ban_reason,
      flags: {
        banned: true
      }
    }
  }
}

class All extends GuildBase {
  constructor(client) {
    super(client);
    this.all = true;
  }

  /**
   * Fetches an array of post objects from the guild.
   * 
   * @param {Object} [options] The post sorting parameters.
   * @param {String} [options.sort=trending] The post sorting method.
   * @param {Number} [options.page=1] The page index to fetch posts from.
   * @returns {Array} The guild objects.
   */

  async fetchGuilds(options) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);

    let resp = await this.client.APIRequest({ type: "GET", path: "guilds", options: { 
      sort: options && options.sort || "trending",
      page: options && options.page || 1
    } });

    return resp.data.map(guild => new Guild(guild, this.client));
  }
}

class GuildManager {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
    this.all = new All(client);
  }

  /**
   * Fetches a guild with the specified name.
   * 
   * @param {String} name The guild name.
   * @returns {Guild} The guild object.
   */

  async fetch(name) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);
    
    let resp = await this.client.APIRequest({ type: "GET", path: `guild/${name}` });

    if (resp.is_banned) {
      return new BannedGuild(resp);
    } else {
      return new Guild(resp, this.client);
    }
  }

  /**
   * Fetches whether or not a guild with the specified name is available.
   * 
   * @param {String} name The guild name.
   * @returns {Boolean}
   */

  async isAvailable(name) {
    if (!name) return undefined;
    let resp = await this.client.APIRequest({ type: "GET", path: `board_available/${name}` });

    return resp.available;
  }
}

module.exports = { GuildBase, Guild, GuildCore, BannedGuild, All, GuildManager };