const chalk = require("chalk");

class OAuthWarning {
  /**
   * Creates and throws a new OAuth Warning.
   * 
   * @param {Object} options The Warning parameters.
   * @param {String} options.message The Warning message.
   * @param {String} options.warning The Warning consequence.
   * @constructor
   */

  constructor(options) {
    this.message = `${chalk.yellow("WARN!")} ${options.message} - ${chalk.yellow(options.warning || "")}`

    this.throw();
  }

  throw() {
    console.log(this.message);
  }
}

class OAuthError extends Error {
  /**
   * Creates and throws a new OAuth Error.
   * 
   * @param {Object} options The Error parameters.
   * @param {String} options.message The Error message.
   * @param {Number} options.code The Error code. Status messages are handled automatically.
   * @param {Boolean} options.fatal Whether or not the Error should be treated as fatal.
   * @constructor
   */

  constructor(options) {
    super(options);
    
    const codeStatuses = {
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

    this.message = `${chalk.red(options.fatal ? "FATAL ERR!" : "ERR!")} ${options.message} - ${chalk.yellow(`${options.code} ${codeStatuses[options.code] || ""}`)}`;

    this.error = options.message;
    this.code = options.code;
    this.status = codeStatuses[options.code];
    this.fatal = options.fatal || false;
  
    this.throw();
  }

  throw() {
    let stack = this.stack.split("\n").slice(1); 
    stack = stack.map((x, i) => {
      if (i == 0) return x;
      if (i == 1 && x.trim().startsWith("at Object")) return x;
      return chalk.gray(x);
    });

    console.log(this.message);
    console.log(stack.join("\n"));

    this.message = ""; this.stack = "";

    if (this.fatal) process.exit();
  }
}

module.exports = { OAuthWarning, OAuthError };