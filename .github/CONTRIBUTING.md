# Contributing

The following is a set of guidelines for contributing to ruqqus-js, hosted on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Bug Reports](#bug-reports)
  - [Pull Requests](#pull-requests)
  - [Suggestions](#suggestions)
- [Styleguides](#styleguides)
  - [Code Style](#code-style)
  - [Git Commit Messages](#git-commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by the [ruqqus-js Code of Conduct](https://github.com/acikek/ruqqus-js/blob/master/.github/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to spiralixp@gmail.com.

## How Can I Contribute?

### Bug Reports

Bug reports are marked as Github issues. Before submitting a new issue, please:
- Perform a cursory search on the [issues page](https://github.com/acikek/ruqqus-js/issues) to check for duplicates
- Review [Github's article about issues](https://guides.github.com/features/issues/)

> Note: If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

To get started, fill out a new issue under the [Bug Report template](https://github.com/acikek/ruqqus-js/blob/master/.github/ISSUE_TEMPLATE/bug-report.md). To clearly convey the issue at hand, please:
- Use a clear and descriptive title
- Describe the issue in a clear and concise manner
- List the **exact steps** which reproduce the problem, and explain how you did it
- Explain which behavior you expected to see instead and why
- Include screenshots, GIFs, or code snippets if possible

### Pull Requests

The following process, and the [Pull Request template](https://github.com/acikek/ruqqus-js/blob/master/.github/PULL_REQUEST_TEMPLATE.md), are here to:
- Maintain the quality of the package
- Fix problems that are important to users
- Encourage an environment where users feel free to contribute
- Enable a sustainable system for the maintainers to review contributions

Please follow these steps to have your contribution accepted:
1. Follow the template
2. Try to follow the [code style](#code-style)
3. Join the [Discord Server](https://discord.com/invite/GWRutXB) if you would like to get your request noticed sooner

### Suggestions

Please refrain from clogging up the issues section with suggestions. If you would like to suggest a new feature, a fix, or any new updates related to the package, consider joining the [Ruqqus API Discord Server](https://discord.com/invite/GWRutXB). The maintainers as well as the users of the package are usually quick to respond with comments and constructive criticism.

## Styleguides

### Code Style

ruqqus-js does not use a linter. Try and follow the spacing and styling, and keep methods consistent.
- Only use `let` and `const`
- Use the spread operator (`{ ...obj }`)
- Group lines of code into applicable and related segments
  - Make sure to space out groups with a double newline
- Shorten redundant code with readable syntax 
```js
// For example, do this:
let instance = new (require("./filename.js"))(parameters);

// Instead of:
const myClass = require("./filename.js");
let instance = new myClass(parameters);
```
- Places requires in the following order:
  - Built-in Node modules (such as `path`)
  - Local modules (using relative paths)
- Place class properties in the following order:
  - Class methods and properties (methods starting with `static`)
  - Instance methods and properties

### Git Commit Messages

- You don't have to include unnecessary emojis
- Try to keep the title concise
  - Put extra comments in the commit description
- Be descriptive
