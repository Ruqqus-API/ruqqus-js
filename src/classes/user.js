const Client = require("./client.js");
const { OAuthError } = require("./error.js");

class UserBase {
  /**
   * Fetches an array of post objects from the user.
   * 
   * @param {Object} [options] The post sorting parameters.
   * @param {Number} [options.page=1] The page index to fetch posts from.
   * @param {Number} [options.limit=24] The amount of post objects to return.
   * @returns {Array} The post objects.
   */

  async fetchPosts(options) {
    const { Post } = require("./post.js");

    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let posts = [];
    
    let resp = await Client.APIRequest({ type: "GET", path: `user/${this.username}/listing`, options: { page: options && options.page ? options.page : 1 } }); if (resp.error) return;
    if (options && options.limit) resp.data.splice(options.limit, resp.data.length - options.limit);

    for await (let post of resp.data) {
      posts.push(new Post(post));
    }

    return posts;
  }

  /**
   * Fetches an array of comment objects from the user.
   * 
   * @param {Object} [options] The comment sorting parameters.
   * @param {Number} [options.page=1] The page index to fetch comments from.
   * @param {Number} [options.limit=24] The amount of comment objects to return.
   * @returns {Array} The comment objects.
   */

  async fetchComments(options) {
    const { Comment } = require("./comment.js");

    if (!Client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let comments = [];

    let resp = await Client.APIRequest({ type: "GET", path: `user/${this.username}/comments`, options: { page: options && options.page ? options.page : 1 } }); if (resp.error) return;
    if (options && options.limit) resp.data.splice(options.limit, resp.data.length - options.limit);
    
    for await (let comment of resp.data) {
      comments.push(new Comment(comment));
    }

    return comments;
  }
}

class User extends UserBase {
  constructor(data) {
    super();
    Object.assign(this, User.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    if (resp.is_banned) {
      return {
        username: resp.username,
        id: resp.id,
        link: resp.permalink,
        full_link: `https://ruqqus.com${resp.permalink}`,
        ban_reason: resp.ban_reason,
      }
    } else if (resp.is_deleted) {
      return {
        username: resp.username,
        id: resp.id,
        link: resp.permalink,
        full_link: `https://ruqqus.com${resp.permalink}`,
        deleted: true
      }
    }
    
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
      badges: 
        resp.badges.map(badge => {
          return new (require("./badge.js"))(badge);
        }),
    }
  }
}

class UserCore extends UserBase {
  constructor(data) {
    super();
    Object.assign(this, UserCore.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    if (resp.is_banned) {
      return {
        username: resp.username,
        id: resp.id,
        link: resp.permalink,
        full_link: `https://ruqqus.com${resp.permalink}`,
        ban_reason: resp.ban_reason,
      }
    } else if (resp.is_deleted) {
      return {
        username: resp.username,
        id: resp.id,
        link: resp.permalink,
        full_link: `https://ruqqus.com${resp.permalink}`,
        deleted: true
      }
    }
    
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
        comments: resp.comment_count,
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

module.exports = { UserBase, User, UserCore }