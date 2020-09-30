const { OAuthError } = require("./error.js");

class User {
  constructor(username, client) {
    this.username = username;
    this.client = client;
  }

  async _fetchData(format) {
    let resp = format || await this.client.APIRequest({ type: "GET", path: `user/${this.username}` });

    if (!resp.id) return undefined;

    if (resp.is_banned) {
      return {
        username: resp.username,
        id: resp.id,
        link: resp.permalink,
        full_link: `https://ruqqus.com${resp.permalink}`,
        ban_reason: resp.ban_reason,
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
        banned: resp.is_banned
      },
      badges: 
        resp.badges.map(b => {
          return { 
            name: b.name,
            description: b.text,
            url: b.url,
            created_at: b.created_utc
          }
        }),
    }
  }

  static formatData(format) {
    return new User()._fetchData(format);
  }

  /**
   * Fetches an array of post objects from the user.
   * 
   * @param {String} [sort=new] The post sorting method.
   * @param {Number} [limit=24] The amount of post objects to return.
   * @param {Number} [page=1] The page index to fetch posts from.
   * @returns {Array} The post objects.
   */

  async fetchPosts(sort, limit, page) {
    const Post = require("./post.js");

    if (!this.client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let posts = [];
    
    let resp = await this.client.APIRequest({ type: "GET", path: `user/${this.username}/listing`, options: { sort: sort || "new", page: page || 1 } });
    if (limit) resp.data.splice(limit, resp.data.length - limit);

    for await (let post of resp.data) {
      posts.push(await Post.formatData(post));
    }

    return posts;
  }

  /**
   * Fetches an array of comment objects from the user.
   * 
   * @param {Number} [limit=24] The amount of comment objects to return.
   * @param {Number} [page=1] The page index to fetch comments from.
   * @returns {Array} The comment objects.
   */

  async fetchComments(limit, page) {
    const Comment = require("./comment.js");

    if (!this.client.scopes.read) {
      new OAuthError({
        message: 'Missing "Read" Scope',
        code: 401
      }); return;
    }

    let comments = [];

    let resp = await this.client.APIRequest({ type: "GET", path: `user/${this.username}/comments`, options: { page: page || 1 } });
    if (limit) resp.data.splice(limit, resp.data.length - limit);
    
    for await (let comment of resp.data) {
      comments.push(await Comment.formatData(comment));
    }

    return comments;
  }
}

module.exports = User;