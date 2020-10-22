module.exports = { 
  get version() {
    return require(`${require("path").dirname(__dirname)}/package.json`).version;
  } 
};