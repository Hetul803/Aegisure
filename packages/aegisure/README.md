# Aegisure CLI

Aegisure is the control and audit plane for AI coding agents. The CLI gives a local-first path for generating a repo Constitution, scanning diffs, exporting cross-agent memory files, capturing provenance, and preparing repair prompts.

```bash
pip install aegisure
aegisure init
aegisure scan --staged
aegisure export
```

The static scanner is fully offline and does not call an LLM. Optional review features can use Anthropic, OpenAI, or Ollama when configured.
