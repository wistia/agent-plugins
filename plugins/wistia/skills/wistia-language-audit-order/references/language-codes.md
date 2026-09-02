# Language code mapping

Wistia analytics, caption, translation, and localization tools may expose
different language-code formats. The connected tool schemas are authoritative;
use this reference to normalize common cases before comparing coverage.

## Normalization

- Audience analytics commonly return browser-language tags such as `en`,
  `en-US`, `es-MX`, `pt-BR`, or `zh-TW`. Compare the base subtag by default.
- Caption and localization tools commonly use three-letter codes. Preserve the
  exact code expected by the tool being called.
- Treat bibliographic and terminology aliases as the same language when
  checking existing coverage.

| Browser code | Common three-letter code or aliases | Language |
| --- | --- | --- |
| en | eng | English |
| es | spa | Spanish |
| pt | por | Portuguese |
| fr | fra, fre | French |
| de | deu, ger | German |
| it | ita | Italian |
| ja | jpn | Japanese |
| ko | kor | Korean |
| zh | zho, chi | Chinese |
| nl | nld, dut | Dutch |
| ru | rus | Russian |
| ar | ara | Arabic |
| hi | hin | Hindi |
| pl | pol | Polish |
| tr | tur | Turkish |
| vi | vie | Vietnamese |
| id | ind | Indonesian |
| th | tha | Thai |
| sv | swe | Swedish |
| da | dan | Danish |
| no | nor | Norwegian |
| fi | fin | Finnish |

For a language absent from this table, look up the standard mapping from an
authoritative source and state the mapping used. Do not silently guess. When a
regional distinction such as `pt-BR` versus `pt-PT` matters, confirm the
desired output language against the target tool's supported values.
