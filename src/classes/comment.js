const { OAuthError } = require("./error.js");

class Comment {
  constructor(id, client) {
    this.id = id;
    this.client = client;
  }

  async _fetchData(format) {
    let resp = format || await this.client.APIRequest({ type: "GET", path: `comment/${this.id}` });

    if (!resp.id) return undefined;
    
    return {
      author: {
        username: resp.author,
        title: resp.title ? {
          name: resp.title.text.startsWith(",") ? resp.title.text.split(", ")[1] : resp.title.text,
          id: resp.title.id,
          kind: resp.title.kind,
          color: resp.title.color
        } : null,
      },
      content: {
        text: resp.body,
        html: resp.body_html
      },
      votes: {
        score: resp.score,
        upvotes: resp.upvotes,
        downvotes: resp.downvotes
      },
      parent: {
        post: resp.post,
        comment: resp.parent.startsWith("t3") ? resp.parent : null
      },
      id: resp.id,
      full_id: resp.fullname,
      link: resp.permalink,
      full_link: `https://ruqqus.com${resp.permalink}`,
      created_at: resp.created_utc,
      edited_at: resp.edited_utc,
      chain_level: resp.level,
      flags: {
        archived: resp.is_archived,
        banned: resp.is_banned,
        deleted: resp.is_deleted,
        nsfw: resp.is_nsfw,
        nsfl: resp.is_nsfl,
        offensive: resp.is_offensive,
        edited: resp.edited_utc > 0
      },
      guild: resp.guild_name,
    }
  }

  static formatData(format) {
    return new Comment()._fetchData(format);
  }

  /**
   * Submits a reply to the comment.
   * 
   * @param {String} body The body of the reply.
   */

  reply(body) {
    if (!this.client.scopes.create) return new OAuthError({
      message: 'Missing "Create" Scope',
      code: 401
    });

    if (!body || body == " ") return new OAuthError({
      message: "No Comment Body Provided!",
      code: 405
    });

    this.client.APIRequest({ type: "POST", path: "comment", options: { parent_fullname: `t3_${this.id}`, body: body } });
  }

  /**
   * Upvotes the comment.
   */

  upvote() {
    if (!this.client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });
    
    this.client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/1` });
  }

  /** 
   * Downvotes the comment.
   */

  downvote() {
    if (!this.client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });

    this.client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/-1` });
  }

  /**
   * Removes the client's vote from the comment.
   */

  removeVote() {
    if (!this.client.scopes.vote) return new OAuthError({
      message: 'Missing "Vote" Scope',
      code: 401
    });
    
    this.client.APIRequest({ type: "POST", path: `vote/comment/${this.id}/0` });
  }

  /**
   * Deletes the comment.
   */

  delete() {
    if (!this.client.scopes.delete) return new OAuthError({
      message: 'Missing "Delete" Scope',
      code: 401
    });

    this.client.APIRequest({ type: "POST", path: `delete/comment/${this.id}` })
      .then((resp) => {
        if (resp.error) new OAuthError({
          message: "Comment Deletion Failed",
          code: 403
        });
      });
  }
}

module.exports = Comment;