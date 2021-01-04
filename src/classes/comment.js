const SubmissionCache = require("./cache.js");
const { ScopeError, RuqqusAPIError } = require("./error.js");

function resolveComment(obj, client, core) {
  if (obj.is_banned) {
    return new BannedComment(obj);
  } else if (obj.is_deleted) {
    return new DeletedComment(obj);
  } else {
    return core ? new CommentCore(obj, client) : new Comment(obj, client);
  }
}

class CommentBase {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  /**
   * Submits a reply to the comment.
   * 
   * @param {String} body The body of the reply.
   */

  async reply(body) {
    if (!this.client.scopes.create) throw new ScopeError(`Missing "create" scope`);
    if (!body || body == " ") throw new RuqqusAPIError("Cannot provide an empty comment body");

    let resp = await this.client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t3_${this.id}`, body: body } });
    return new Comment(resp, this.client);
  }

  /**
   * Upvotes the comment.
   */

  upvote() {
    if (!this.client.scopes.vote) throw new ScopeError(`Missing "vote" scope`);
    this.client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/1` });
  }

  /** 
   * Downvotes the comment.
   */

  downvote() {
    if (!this.client.scopes.vote) throw new ScopeError(`Missing "vote" scope`);
    this.client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the comment.
   */

  removeVote() {
    if (!this.client.scopes.vote) throw new ScopeError(`Missing "vote" scope`);
    this.client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/0` });
  }

  /**
   * Deletes the comment.
   */

  delete() {
    if (!this.client.scopes.delete) throw new ScopeError(`Missing "delete" scope`);
    this.client.APIRequest({ type: "POST", path: `delete/comment/${this.id}` });
  }
}

class Comment extends CommentBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, Comment.formatData(data, client));
  }

  static formatData(resp, client) {
    if (!resp.id) return undefined;
    
    const { resolveUser } = require("./user.js");
    const { resolvePost } = require("./post.js");
    const { resolveGuild } = require("./guild.js");

    return {
      author: resolveUser(resp.author, client, true),
      content: {
        text: resp.body,
        html: resp.body_html
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      chain_level: resp.level,
      awards: resp.award_count,
      parent: resp.parent ? resolveComment(resp.parent, client, true) : null,
      replies: resp.replies ? resp.replies.map(reply => resolveComment(reply, client, true)) : null,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        offensive: resp.is_offensive,
        bot: resp.is_bot,
        edited: resp.edited_utc > 0
      },
      post: resolvePost(resp.post, client, true),
      guild: resolveGuild(resp.guild, client, true)
    }
  }
}

class CommentCore extends CommentBase {
  constructor(data, client) {
    super(client);
    Object.assign(this, CommentCore.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      author_name: resp.author_name,
      content: {
        text: resp.body,
        html: resp.body_html
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      parent_id: resp.parent_comment_id,
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      chain_level: resp.level,
      awards: resp.award_count,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        offensive: resp.is_offensive,
        bot: resp.is_bot,
        edited: resp.edited_utc > 0
      }
    }
  }
}

class BannedComment {
  constructor(data) {
    Object.assign(this, BannedComment.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      parent_id: resp.parent,
      ban_reason: resp.ban_reason,
      flags: {
        banned: true,
      }
    }
  }
}

class DeletedComment {
  constructor(data) {
    Object.assign(this, DeletedComment.formatData(data));
  }

  static formatData(resp) {
    if (!resp.id) return undefined;
    
    return {
      id: resp.id,
      full_id: `t1_${resp.id}`,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      parent_id: resp.parent,
      flags: {
        deleted: true
      }
    }
  }
}

class CommentManager {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  /**
   * Fetches a comment with the specified ID.
   * 
   * @param {String} id The comment ID.
   * @returns {Comment} The comment object.
   */

  async fetch(id) {
    if (!this.client.scopes.read) throw new ScopeError(`Missing "read" scope`);

    let resp = await this.client.APIRequest({ type: "GET", path: `comment/${id}` });
    let comment = resolveComment(resp, this.client);

    this.cache.push(comment);
    return comment;
  }

  cache = new SubmissionCache()
}

module.exports = { resolveComment, CommentBase, Comment, CommentCore, BannedComment, DeletedComment, CommentManager };