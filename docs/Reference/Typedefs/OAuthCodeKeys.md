---
hide:
  - toc
---

OAuth initial access token grant keys.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter | Type                                | Description                         |
|-----------|-------------------------------------|-------------------------------------|
| `id`      | {{ typeURL("String") }}             | The Application ID                  |
| `token`   | {{ typeURL("String") }}             | The Application secret              |
| `type`    | {{ typedefLink("OAuthGrantType") }} | The OAuth grant type                |
| `code`    | {{ typeURL("String") }}             | The one-time use authorization code |