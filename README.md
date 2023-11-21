
**AthenaAgent** is a TypeScript port of **[GeneralAgent](https://github.com/CosmosShadow/GeneralAgent)** by *[CosmosShadow](https://github.com/CosmosShadow)*.

Refer to [GeneralAgent README](https://github.com/CosmosShadow/GeneralAgent/blob/main/README.md) for more details about the agent framework.


## Features (Specific to AthenaAgent)

* Simple, fast, stable: compatible with Azure OpenAI models: GPT3.5-turbo, GPT4, GPT4-turbo
* Build-in interpreters: JavaScript


### Coming Soon

- Interpreters: File, Plan, Shell, AppleScript, Retrieve Embedding, etc.
- Memory: File Memory, Compressed Memory, Link Memory, etc.
- Command Line Interface
- Dynamic UI: cross-platform UI
- Web UI

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
