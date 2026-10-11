const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'scripts', 'brand-concierge.js'),
  'utf8',
).replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function');

function setup({ consent = true, pathname = '/us/en', bootstrapError, styleOk = true } = {}) {
  const calls = [];
  const scripts = [];
  const styleRequests = [];
  const mounts = [];
  const errors = [];
  const listeners = new Map();
  const styling = { metadata: { brandName: 'WKND TRENDSETTERS' } };
  const window = {
    location: { pathname },
    wkndConciergeConsent: consent,
    alloy: async (...args) => { calls.push(args); },
    adobe: {
      concierge: {
        bootstrap: async (options) => {
          calls.push(['bootstrap', options]);
          if (bootstrapError) throw bootstrapError;
        },
      },
    },
    addEventListener: (name, callback) => { listeners.set(name, callback); },
  };
  const context = vm.createContext({
    loadCSS: async () => {},
    createConciergeShell: () => {
      mounts.push({});
      return { onEvent: () => {}, fail: () => {} };
    },
    window,
    document: {
      createElement: () => ({}),
      body: { append: (mount) => { mounts.push(mount); } },
      head: {
        append: (script) => {
          scripts.push(script.src);
          queueMicrotask(() => script.onload());
        },
      },
    },
    fetch: async (url) => {
      styleRequests.push(url);
      return { ok: styleOk, json: async () => styling };
    },
    console: { error: (...args) => { errors.push(args); } },
  });
  vm.runInContext(source, context);
  return {
    window, calls, scripts, styleRequests, mounts, errors, listeners, styling,
    load: () => context.loadBrandConcierge(),
  };
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

test('routes conversation requests to the concierge VA7 deployment', async () => {
  const app = setup();
  app.load();
  await settle();
  const [command, config] = app.calls[0];
  assert.equal(command, 'configure');
  assert.equal(config.conversation.region, 'va7');
  assert.equal(config.conversation.stickyConversationSession, false);
  assert.equal(config.datastreamId, '81f2903c-ce3a-4557-a8a6-eac3f07f9021');
  assert.equal(config.orgId, '0B6930256441790E0A495FFE@AdobeOrg');
  assert.equal(config.defaultConsent, 'in');
  assert.equal(app.calls[1][0], 'sendEvent');
  assert.equal(app.calls[2][0], 'bootstrap');
  assert.equal(app.calls[2][1].instanceName, 'alloy');
  assert.equal(app.calls[2][1].stylingConfigurations, app.styling);
  assert.equal(app.calls[2][1].selector, '#brand-concierge-mount');
  assert.equal('stickySession' in app.calls[2][1], false);
  assert.equal(app.scripts.length, 2);
  assert.equal(app.scripts[0], 'https://cdn1.adoberesources.net/alloy/2.32.0/alloy.min.js');
  assert.deepEqual(app.styleRequests, ['/scripts/styling-config-6aa0fe1c89d19d61e7598a59.json']);
  assert.equal(app.errors.length, 0);
});

test('uses the new deployment only on the exact skateparks article', async () => {
  const app = setup({ pathname: '/us/en/magazine/guide-la-skateparks' });
  app.load();
  await settle();
  const [, config] = app.calls[0];
  assert.equal(config.datastreamId, '1ba491a9-198f-4cea-99a4-b26c888cecc3');
  assert.equal(config.orgId, 'B4A122FD69126FF30A495FB9@AdobeOrg');
  assert.equal(config.conversation.region, 'va7');
  assert.equal(config.conversation.stickyConversationSession, false);
  assert.equal(config.debugEnabled, false);
  assert.equal(app.scripts[0], 'https://cdn1.adoberesources.net/alloy/2.35.1/alloy.min.js');
  assert.deepEqual(app.styleRequests, ['/scripts/styling-config-6acbc0a2dea7961321604bd3.json']);
  assert.equal(app.calls[2][1].stylingConfigurations, app.styling);
  assert.equal(app.mounts.length, 1);
  assert.equal(app.errors.length, 0);
});

test('keeps the default deployment on other magazine pages and similar paths', async () => {
  for (const pathname of [
    '/us/en/magazine',
    '/us/en/magazine/guide-la-skateparks-other',
    '/us/en/magazine/guide-la-skateparks/child',
  ]) {
    const app = setup({ pathname });
    app.load();
    await settle();
    assert.equal(app.calls[0][1].datastreamId, '81f2903c-ce3a-4557-a8a6-eac3f07f9021');
    assert.equal(app.calls[0][1].orgId, '0B6930256441790E0A495FFE@AdobeOrg');
    assert.equal(app.scripts[0], 'https://cdn1.adoberesources.net/alloy/2.32.0/alloy.min.js');
    assert.deepEqual(app.styleRequests, ['/scripts/styling-config-6aa0fe1c89d19d61e7598a59.json']);
  }
});

test('gates the skateparks deployment on consent and installs it once', async () => {
  const app = setup({ consent: false, pathname: '/us/en/magazine/guide-la-skateparks' });
  app.load();
  await settle();
  assert.equal(app.scripts.length, 0);
  assert.equal(app.styleRequests.length, 0);
  app.window.wkndConciergeConsent = true;
  app.listeners.get('wknd:concierge-consent-granted')();
  app.load();
  await settle();
  assert.equal(app.calls.length, 3);
  assert.equal(app.mounts.length, 1);
  assert.equal(app.calls[0][1].datastreamId, '1ba491a9-198f-4cea-99a4-b26c888cecc3');
});

test('does not load third-party scripts until consent is granted', async () => {
  const app = setup({ consent: false });
  app.load();
  await settle();
  assert.equal(app.scripts.length, 0);
  assert.equal(app.calls.length, 0);
  app.window.wkndConciergeConsent = true;
  app.listeners.get('wknd:concierge-consent-granted')();
  await settle();
  assert.equal(app.calls.length, 3);
});

test('does not install on unrelated paths', async () => {
  const app = setup({ pathname: '/us/english' });
  app.load();
  await settle();
  assert.equal(app.mounts.length, 0);
  assert.equal(app.listeners.size, 0);
  assert.equal(app.calls.length, 0);
});

test('installs only once on child pages even with repeated consent events', async () => {
  const app = setup({ pathname: '/us/en/magazine' });
  app.load();
  app.listeners.get('wknd:concierge-consent-granted')();
  app.load();
  await settle();
  assert.equal(app.mounts.length, 1);
  assert.equal(app.calls.length, 3);
});

test('reports client API errors without logging submitted queries', async () => {
  const app = setup();
  app.load();
  await settle();
  const { onEvent } = app.calls[2][1];
  onEvent({ eventType: 'query:submitted', data: { query: 'private query' } });
  assert.equal(app.errors.length, 0);
  onEvent({ eventType: 'error:occurred', data: { errorMessage: 'Request failed' } });
  assert.equal(app.errors.length, 1);
  assert.equal(app.errors[0][1], 'Request failed');
});

test('reports asynchronous bootstrap failures through the installation error handler', async () => {
  const error = new Error('Bootstrap failed');
  const app = setup({ bootstrapError: error });
  app.load();
  await settle();
  assert.equal(app.errors.length, 1);
  assert.equal(app.errors[0][1], error);
});

test('stops installation if styling configuration fails to load', async () => {
  const app = setup({ styleOk: false });
  app.load();
  await settle();
  assert.equal(app.scripts.length, 0);
  assert.equal(app.calls.length, 0);
  assert.equal(app.errors.length, 1);
});
