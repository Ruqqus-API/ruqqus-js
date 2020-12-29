---
hide:
  - toc
---

Options for a client.

## Types

- {{ typeURL("Object") }}

## Properties

| Parameter |           Type          |     Optional     | Default |                   Description                   |
|:---------:|:-----------------------:|:----------------:|:-------:|:-----------------------------------------------:|
|    `id`   | {{ typeURL("String") }} | :material-check: |  *none* |                The Application ID               |
|  `token`  | {{ typeURL("String") }} | :material-check: |  *none* |              The Application secret             |
|   `code`  | {{ typeURL("String") }} | :material-check: |  *none* |       The one-time use authorization code       |
|  `agent`  | {{ typeURL("String") }} | :material-check: |  *none* |               Custom `user_agent`               |
| `refresh` | {{ typeURL("String") }} | :material-check: |  *none* | The refresh token. Overrides authorization code |