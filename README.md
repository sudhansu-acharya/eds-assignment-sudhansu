# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Brand Concierge

The integration in `scripts/brand-concierge.js` loads on `/us/en` and its child
pages only after consent. The current consent implementation is a test stub;
use `/us/en?consent=accept` to enable Concierge locally.

Conversation requests are explicitly routed to `va7` to match the concierge's
**Prod (VA7)** deployment. Standard page events still use the nearest Edge data
center. Session persistence is configured with Web SDK's
`conversation.stickyConversationSession`, not a Web Client bootstrap option.

If the chat still returns an error, check the browser Network panel for the
failed conversation request and its response. Confirm in Adobe Experience
Platform that datastream `1721b156-01d1-446a-92f4-6fb4934d4abd` is enabled for
Brand Concierge and points to the published concierge in the correct sandbox
and organization (`0B6930256441790E0A495FFE@AdobeOrg`). Working in the console's
Design preview alone does not confirm that the website deployment is published
and configured. Client errors are also reported in the browser console; submitted
queries are not logged by the site's event callback.

Offline integration regression tests use Node's built-in test runner and mock
the Adobe scripts without downloading or executing them:

```sh
node --test test/brand-concierge.test.cjs
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
