---
hide:
  - toc
---

Formatted data representing a deleted user.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter     | Type                                  | Description                                                  |
|:-------------:|:-------------------------------------:|:------------------------------------------------------------:|
| `username`    | {{ typeURL("String") }}               | The user's name                                              |
| `id`          | {{ typedefLink("RuqqusID") }}         | The user Ruqqus ID                                           |
| `full_id`     | {{ typedefLink("UserID") }}           | The user User ID                                             |
| `link`        | {{ typeURL("String") }}               | The link to the user's Ruqqus profile                        |
| `full_link`   | {{ typeURL("String") }}               | The usable link to the user's Ruqqus profile                 |
| `flags`       | {{ typedefLink("DeletedUserFlags") }} | The user flags                                               |