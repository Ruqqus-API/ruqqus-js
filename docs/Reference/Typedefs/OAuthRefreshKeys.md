---
hide:
  - toc
---

OAuth grant keys for upkeeping an access token.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter | Type                                | Description                         |
|-----------|-------------------------------------|-------------------------------------|
| `id`      | {{ typeURL("String") }}             | The Application ID                  |
| `token`   | {{ typeURL("String") }}             | The Application secret              |
| `type`    | {{ typedefLink("OAuthGrantType") }} | The OAuth grant type                |
| `refresh` | {{ typeURL("String") }}             | The refresh token                   |