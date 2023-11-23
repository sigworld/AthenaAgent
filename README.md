
**AthenaAgent** is a TypeScript port of **[GeneralAgent](https://github.com/CosmosShadow/GeneralAgent)** by *[CosmosShadow](https://github.com/CosmosShadow)*.

<img src="https://img.shields.io/static/v1?label=license&message=MIT&color=white&style=flat" alt="License"/> [![Test Coverage](https://github.com/sigworld/AthenaAgent/actions/workflows/test-coverage.yml/badge.svg?branch=main)](https://github.com/sigworld/AthenaAgent/actions/workflows/test-coverage.yml)

Refer to [GeneralAgent README](https://github.com/CosmosShadow/GeneralAgent/blob/main/README.md) for more details about the agent framework.


## Features (Specific to AthenaAgent)

* Simple, fast, stable: compatible with Azure OpenAI models: GPT3.5-turbo, GPT4, GPT4-turbo
* Build-in interpreters: JavaScript(built-in vm context)

### Coming Soon

- `functions` and `json_mode` support for more stable and consistent response
- Interpreters: File, Shell, AppleScript, Retrieve Embedding, etc.
- Skill Set: txt-to-img(DALLE-3), txt-to-voice
- Memory: File Memory, Compressed Memory, Link Memory, etc.
- UI: Command Line Interface, Dynamic UI (a cross-platform native UI), Web UI


## Status 👨‍💻

This project is now under active 🔥 development with daily updates.


## Installation

```shell
yarn install
```

Add the following environment variables before running `yarn test`:

```
GPT3_5_APIKEY={AZURE_APIKEY}
GPT3_5_URL={AZURE_ENDPOINT_URL}  #example: https://{azure-gpt-model-endpoint}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={azure-openai-api-version}

GPT4_APIKEY={AZURE_APIKEY}
GPT4_URL={AZURE_ENDPOINT_URL}
```
