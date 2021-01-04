const { ScopeError } = require("./error.js");

function resolveUser(obj, client, core) {
  if (obj.is_banned) {
    return new BannedUser(obj);
  } else if (obj.is_deleted) {
    return new DeletedUser(obj);
  } else {
    return core ? new UserCore(obj, client) : new User(obj, client);
  }
}

class UserBase {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  /**
   * Fetches an array of post objects from the user.
   * 
   * @param {Object} [options] The post sorting parameters.
   * @param {Number} [options.page=1] The page index to fetch posts from.
   * @param {Boolean} [cache=true] Whether or not the posts should be cached.
   * @returns {Array} The post objects.
   */

  async fetchPosts(options) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);
    
    let resp = await this.client.APIRequest({ type: "GET", path: `user/${this.username}/listing`, options: { 
      page: options && options.page || 1 
    } }); if (resp.error) return;

    const { resolvePost } = require("./post.js");
    let posts = resp.data.map(post => resolvePost(post, this.client));

    if (!options || options.cache !== false) this.client.posts.cache.add(posts);
    return posts;
  }

  /**
   * Fetches an array of comment objects from the user.
   * 
   * @param {Object} [options] The comment sorting parameters.
   * @param {Number} [options.page=1] The page index to fetch comments from.
   * @param {Boolean} [cache=true] Whether or not the posts should be cached.
   * @returns {Array} The comment objects.
   */

  async fetchComments(options) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);

    let resp = await this.client.APIRequest({ type: "GET", path: `user/${this.username}/comments`, options: { 
      page: options && options.page || 1 
    } }); if (resp.error) return;

    const { resolveComment } = require("./comment.js");
    let comments = resp.data.map(comment => resolveComment(comment, this.client));

    if (!options || options.cache !== false) this.client.comments.cache.add(comments);
    return comments;
  }
}

class User extends UserBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, User.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    const Badge = require("./badge.js");
    
    return {
      username: resp.username,
      title: resp.title ? {
        name: resp.title.text.startsWith(",") ? resp.title.text.split(", ")[1] : resp.title.text,
        id: resp.title.id,
        kind: resp.title.kind,
        color: resp.title.color
      } : null,
      bio: {
        text: resp.bio,
        html: resp.bio_html
      },
      stats: {
        posts: resp.post_count,
        post_rep: resp.post_rep,
        comments: resp.comment_count,
        comment_rep: resp.comment_rep
      },
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      avatar_url: resp.profile_url.startsWith("/assets") ? `https://ruqqus.com${resp.profile_url}` : resp.profile_url,
      banner_url: resp.banner_url.startsWith("/assets") ? `https://ruqqus.com${resp.banner_url}` : resp.banner_url,
      created_at: resp.created_utc,
      flags: {
        banned: resp.is_banned,
        private: resp.is_private,
        premium: resp.is_premium
      },
      badges: resp.badges.map(badge => new Badge(badge))
    }
  }
}

class UserCore extends UserBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, UserCore.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    return {
      username: resp.username,
      title: resp.title ? {
        name: resp.title.text.startsWith(",") ? resp.title.text.split(", ")[1] : resp.title.text,
        id: resp.title.id,
        kind: resp.title.kind,
        color: resp.title.color
      } : null,
      bio: {
        text: resp.bio,
        html: resp.bio_html
      },
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      avatar_url: resp.profile_url.startsWith("/assets") ? `https://ruqqus.com${resp.profile_url}` : resp.profile_url,
      banner_url: resp.banner_url.startsWith("/assets") ? `https://ruqqus.com${resp.banner_url}` : resp.banner_url,
      created_at: resp.created_utc,
      flags: {
        banned: resp.is_banned,
        private: resp.is_private,
        premium: resp.is_premium
      }
    }
  }
}

class BannedUser {
  constructor(data) {
    Object.assign(this, DeletedUser.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      username: resp.username,
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

class DeletedUser {
  constructor(data) {
    Object.assign(this, DeletedUser.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    return {
      username: resp.username,
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      flags: {
        deleted: true
      }
    }
  }
}

class UserManager {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  /**
   * Fetches a user with the specified username.
   * 
   * @param {String} username The user's name.
   * @returns {User} The user object.
   */

  async fetch(username) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);

    let resp = await this.client.APIRequest({ type: "GET", path: `user/${username}` });

    return resolveUser(resp, this.client);
  }

  /**
   * Fetches whether or not a user with the specified username is available.
   * 
   * @param {String} username The user's name.
   * @returns {Boolean}
   */
  
  async isAvailable(username) {
    if (!username) return undefined;
    let resp = await this.client.APIRequest({ type: "GET", path: `is_available/${username}` });

    return Object.values(resp)[0];
  }
}

module.exports = { resolveUser, UserBase, User, UserCore, BannedUser, DeletedUser, UserManager }