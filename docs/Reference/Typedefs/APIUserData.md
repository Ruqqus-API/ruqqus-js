---
hide:
  - toc
---

An object returned by a user data request.

{{ interfaceExtension("APIUserBaseData") }}

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter       | Type                                                      | Description                  |
|:---------------:|:---------------------------------------------------------:|:----------------------------:|
| `post_count`    | {{ typeURL("Number") }}                                   | The user post count          |
| `post_rep`      | {{ typeURL("Number") }}                                   | The user post rep            |
| `comment_count` | {{ typeURL("Number") }}                                   | The user comment count       |
| `comment_rep`   | {{ typeURL("Number") }}                                   | The user comment rep         |
| `badges`        | {{ typedefArray("APIBadgeData") }}                        | The user badge data array    |