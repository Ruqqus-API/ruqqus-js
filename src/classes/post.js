const SubmissionCache = require("./cache.js");
const { ScopeError, RuqqusAPIError } = require("./error.js");

function resolvePost(obj, client, core) {
  if (obj.is_banned) {
    return new BannedPost(obj);
  } else if (obj.is_deleted) {
    return new DeletedPost(obj);
  } else {
    return core ? new PostCore(obj, client) : new Post(obj, client);
  }
}

class PostBase {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  /**
   * Submits a comment to the post.
   * 
   * @param {String} body The body of the comment.
   */

  async comment(body) {
    if (!this.client.scopes.create) throw new ScopeError(`Missing "create" scope`);
    if (!body || body == " ") throw new RuqqusAPIError("Cannot provide an empty comment body");

    let resp = await this.client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t2_${this.id}`, body: body } });
    return new (require("./comment.js")).Comment(resp, this.client);
  }

  /**
   * Upvotes the post.
   */

  upvote() {
    if (!this.client.scopes.vote) throw new ScopeError(`Missing "vote" scope`);
    this.client.APIRequest({ type: "POST", path: `vote/post/${this.id}/1` });
  }
  
  /**
   * Downvotes the post.
   */

  downvote() {
    if (!this.client.scopes.vote) throw new ScopeError(`Missing "vote" scope`);
    this.client.APIRequest({ type: "POST", path: `vote/post/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the post.
   */

  removeVote() {
    if (!this.client.scopes.vote) throw new ScopeError(`Missing "vote" scope`);
    this.client.APIRequest({ type: "POST", path: `vote/post/${this.id}/0` });
  }

  /**
   * Deletes the post.
   */

  delete() {
    if (!this.client.scopes.delete) throw new ScopeError(`Missing "delete" scope`);
    this.client.APIRequest({ type: "POST", path: `delete_post/${this.id}` });
  }

  /**
   * Toggles post NSFW.
   */

  toggleNSFW() {
    if (!this.client.scopes.update) throw new ScopeError(`Missing "update" scope`);
    this.client.APIRequest({ type: "POST", path: `toggle_post_nsfw/${this.id}` });
  }

  /**
   * Toggles post NSFL.
   */

  toggleNSFL() {
    if (!this.client.scopes.update) throw new ScopeError(`Missing "update" scope`);
    this.client.APIRequest({ type: "POST", path: `toggle_post_nsfl/${this.id}` });
  }
}

class Post extends PostBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, Post.formatData(data, client));
  }

  static formatData(resp, client) {
    if (!resp.id) return undefined;

    const { resolveUser } = require("./user.js");
    const { resolveComment } = require("./comment.js");
    const { resolveGuild } = require("./guild.js");

    return {
      author: resolveUser(resp.author, client, true),
      content: {
        title: resp.title,
        body: {
          text: resp.body,
          html: resp.body_html
        },
        domain: resp.domain,
        url: resp.url,
        thumbnail: resp.thumb_url,
        embed: resp.embed_url
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes,
        voted: resp.voted
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      comments: resp.comment_count,
      awards: resp.award_count,
      replies: resp.replies ? resp.replies.map(reply => resolveComment(reply, client, true)) : null,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        offensive: resp.is_offensive,
        political: resp.is_politics,
        edited: resp.edited_utc > 0,
        yanked: resp.original_guild ? true : false
      },
      guild: resolveGuild(resp.guild, client, true),
      original_guild: resp.original_guild ? resolveGuild(resp.original_guild, client, true) : null
    }
  }
}

class PostCore extends PostBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, PostCore.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;

    return {
      author_name: resp.author_name,
      content: {
        title: resp.title,
        body: {
          text: resp.body,
          html: resp.body_html
        },
        domain: resp.domain,
        url: resp.url,
        thumbnail: resp.thumb_url,
        embed: resp.embed_url
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes,
        voted: resp.voted
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      comments: resp.comment_count,
      awards: resp.award_count,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        offensive: resp.is_offensive,
        political: resp.is_politics,
        edited: resp.edited_utc > 0,
        yanked: resp.original_guild ? true : false
      },
      guild_name: resp.guild_name,
      original_guild_name: resp.original_guild_name
    }
  }
}

class BannedPost {
  constructor(data) {
    Object.assign(this, BannedPost.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      content: {
        title: resp.title
      },
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      ban_reason: resp.ban_reason,
      flags: {
        banned: true,
        deleted: resp.is_deleted
      }
    }
  }
}

class DeletedPost {
  constructor(data) {
    Object.assign(this, DeletedPost.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      content: {
        title: resp.title
      },
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      flags: {
        banned: resp.is_banned,
        deleted: true
      }
    }
  }
}

class PostManager {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  /**
   * Fetches a post with the specified ID.
   * 
   * @param {String} id The post ID.
   * @returns {Post} The post object.
   */

  async fetch(id) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);

    let resp = await this.client.APIRequest({ type: "GET", path: `post/${id}` });
    let post = resolvePost(resp, this.client);

    this.cache.push(post);
    return post;
  }

  cache = new SubmissionCache()
}

module.exports = { resolvePost, PostBase, Post, PostCore, BannedPost, DeletedPost, PostManager };