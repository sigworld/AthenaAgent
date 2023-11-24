## Crafting LLM with User-Customizable, Evolvable AI Agents</h1>

**AthenaAgent** is a TypeScript port of **[GeneralAgent](https://github.com/CosmosShadow/GeneralAgent)** by *[CosmosShadow](https://github.com/CosmosShadow)*, which aims to build an intuitive framework designed for dynamic adaptation. Unlike others, GeneralAgent specializes in equipping users with intelligent agents that are:

- capable of self-evolving through interpretable skills;
- with customizable and dynamic interfaces.

It's more than a tool, it's a companion that grows with users' needs, making AI's advanced capabilities accessible and operational for everyone. 

Refer to [GeneralAgent/README](https://github.com/CosmosShadow/GeneralAgent/blob/main/README.md) for more details about the agent framework.

<img src="https://img.shields.io/static/v1?label=license&message=MIT&color=white&style=flat" alt="License"/> [![Test Coverage](https://github.com/sigworld/AthenaAgent/actions/workflows/test-coverage.yml/badge.svg?branch=main)](https://github.com/sigworld/AthenaAgent/actions/workflows/test-coverage.yml)


## Features

* Simple, fast, stable: support Azure OpenAI models: GPT3.5-turbo, GPT4, GPT4-turbo
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

**The following environment variables are required for LLM inferrence:**

```
### reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
# GPT4 (for LLM ChatCompletion inference
GPT4_URL=https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
GPT4_APIKEY={api-key}

# GPT4-Turbo, GPT4-1106-preview(for LLM ChatCompletion inference, supports json mode and reproducible output)
# It's not stable due to heavy traffic, not recommended. encountering too many empty responses)
GPT4_T_URL=https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
GPT4_T_APIKEY={api-key}

# GPT3.5-Turbo (for LLM ChatCompletion inference)
GPT3_5_URL=https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
GPT3_5_APIKEY={api-key}

# GPT3.5-Turbo-Instruct (for LLM Completion inference)
GPT3_5_I_APIKEY={api-key}
GPT3_5_I_URL=https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/completions?api-version={api-version}

# GPT3.5-Turbo-1106 (for LLM ChatCompletion inference, supports json mode and reproducible output)
GPT3_5_T_APIKEY={api-key}
GPT3_5_T_URL=https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions?api-version={api-version}
```
