# Your Project's Title
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
pages automatically; no `?consent=accept` parameter is required. Open `/us/en`
or `/us/en/magazine/guide-la-skateparks` directly.

Concierge no longer waits for the demo consent flag or event and configures its
SDK with `defaultConsent: 'in'`. The separate `scripts/consent-check.js` flow for
analytics/martech remains unchanged. Automatic loading is not evidence of user
consent; integrate your approved CMP if consent is required for this deployment.

Conversation requests are explicitly routed to `va7` to match the concierge's
**Prod (VA7)** deployment. Standard page events still use the nearest Edge data
center. Session persistence is configured with Web SDK's
`conversation.stickyConversationSession`, not a Web Client bootstrap option.

If the chat still returns an error, check the browser Network panel for the
failed conversation request and its response. Confirm in Adobe Experience
Platform that datastream `81f2903c-ce3a-4557-a8a6-eac3f07f9021` is enabled for
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

### Page-specific deployment

Only `/us/en/magazine/guide-la-skateparks` uses Concierge
`6acbc0a2dea7961321604bd3`: datastream
`1ba491a9-198f-4cea-99a4-b26c888cecc3`, organization
`B4A122FD69126FF30A495FB9@AdobeOrg`, VA7, Web SDK 2.35.1, and
`scripts/styling-config-6acbc0a2dea7961321604bd3.json`.
Other `/us/en` pages retain the existing deployment and Web SDK 2.32.0.
Both deployments load automatically and use the same compact chat controls.
Debug logging stays disabled, and cross-page session persistence stays disabled.

In the new Concierge's published deployment, configure this website surface:

- Domain: `main--eds-assignment-sudhansu--sudhansu-acharya.aem.live`
- Path: `/us/en/magazine/guide-la-skateparks`

Add the preview domain separately if testing on `.aem.page`. Test the article
using its direct URL; no consent query parameter is needed.
The supplied styling export still contains a placeholder privacy-policy URL;
replace it with your approved policy in the Concierge console and re-export
the styling before production use.

### Compact chat

On page load, Concierge's own input appears in a fixed bottom bar. Submitting
opens a modal through the `query:submitted` callback, so the question is sent
once by the existing Web Client. Open chat also expands it without a question.
Minimize, Escape and backdrop clicks return to the bar; Dismiss hides it and
leaves an Ask WKND button. The same client stays mounted across these actions.

`scripts/concierge-shell.js` owns the controls and focus handling;
`styles/brand-concierge.css` scopes the presentation. Compact mode styles the
Web Client's `.input-section` / `.chat-interface` markup; check those selectors
after vendor updates. If input markup is unavailable, Open chat remains available.
The existing page scope is unchanged. Cross-page conversation
persistence is still disabled.

Browser interaction coverage (uses installed Chrome):

```sh
node --test test/brand-concierge.test.cjs test/concierge-shell.test.cjs
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
