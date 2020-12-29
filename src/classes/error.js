const statuses = {
  401: "NOT_AUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "NOT_ALLOWED",
  413: "TOO_LARGE",
  422: "UNPROCESSABLE_ENTITY",
  500: "INTERNAL_ERROR",
  502: "BAD_GATEWAY",
  503: "UNAVAILABLE"
}

class OAuthError extends Error {
  constructor(message, code) {
    super(`${message} ${code ? `- ${code} ${statuses[code]}` : ""}`);

    this.name = "OAuthError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OAuthError);
    }
  }
}

class ScopeError extends Error {
  constructor(message) {
    super(message);

    this.name = "ScopeError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScopeError);
    }
  }
}

class RuqqusAPIError extends Error {
  constructor(message, code) {
    super(`${message} ${code ? `- ${code} ${statuses[code]}` : ""}`);

    this.name = "RuqqusAPIError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RuqqusAPIError);
    }
  }
}

module.exports = { OAuthError, RuqqusAPIError, ScopeError };