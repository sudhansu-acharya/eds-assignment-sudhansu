import { loadCSS } from './aem.js';
import createConciergeShell from './concierge-shell.js';

const DEFAULT_DEPLOYMENT = {
  sdkVersion: '2.32.0',
  styleConfiguration: '/scripts/styling-config-6aa0fe1c89d19d61e7598a59.json',
  datastreamId: '81f2903c-ce3a-4557-a8a6-eac3f07f9021',
  orgId: '0B6930256441790E0A495FFE@AdobeOrg',
  region: 'va7',
};
const SKATEPARKS_DEPLOYMENT = {
  sdkVersion: '2.35.1',
  styleConfiguration: '/scripts/styling-config-6acbc0a2dea7961321604bd3.json',
  datastreamId: '1ba491a9-198f-4cea-99a4-b26c888cecc3',
  orgId: 'B4A122FD69126FF30A495FB9@AdobeOrg',
  region: 'va7',
};

let loading;
let shell;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.append(script);
  });
}

function prepareAlloy() {
  if (window.alloy) return;

  // eslint-disable-next-line no-underscore-dangle
  window.__alloyNS = window.__alloyNS || [];
  // eslint-disable-next-line no-underscore-dangle
  window.__alloyNS.push('alloy');
  window.alloy = (...args) => new Promise((resolve, reject) => {
    window.alloy.q.push([resolve, reject, args]);
  });
  window.alloy.q = [];
}

async function loadStyleConfiguration(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Brand Concierge style configuration failed to load');
  window.styleConfiguration = await response.json();
}

async function install() {
  const deployment = window.location.pathname === '/us/en/magazine/guide-la-skateparks'
    ? SKATEPARKS_DEPLOYMENT : DEFAULT_DEPLOYMENT;
  const scripts = [
    `https://cdn1.adoberesources.net/alloy/${deployment.sdkVersion}/alloy.min.js`,
    'https://experience.adobe.net/solutions/experience-platform-brand-concierge-web-agent/static-assets/main.js',
  ];
  await loadCSS('/styles/brand-concierge.css');
  shell = createConciergeShell();

  prepareAlloy();
  await loadStyleConfiguration(deployment.styleConfiguration);
  await scripts.reduce(
    (chain, src) => chain.then(() => loadScript(src)),
    Promise.resolve(),
  );

  if (!window.styleConfiguration || !window.adobe?.concierge?.bootstrap) {
    throw new Error('Brand Concierge configuration or bootstrap is unavailable');
  }

  await window.alloy('configure', {
    defaultConsent: 'in',
    edgeDomain: 'edge.adobedc.net',
    edgeBasePath: 'ee',
    datastreamId: deployment.datastreamId,
    orgId: deployment.orgId,
    conversation: {
      // Match the concierge's Prod (VA7) deployment, not the nearest Edge region.
      region: deployment.region,
      stickyConversationSession: false,
    },
    debugEnabled: false,
    idMigrationEnabled: false,
    thirdPartyCookiesEnabled: false,
    prehidingStyle: '.personalization-container { opacity: 0 !important }',
  });

  await window.alloy('sendEvent', {});
  await window.adobe.concierge.bootstrap({
    instanceName: 'alloy',
    stylingConfigurations: window.styleConfiguration,
    selector: '#brand-concierge-mount',
    onEvent: (event) => {
      shell.onEvent(event);
      if (event.eventType === 'error:occurred') {
        // eslint-disable-next-line no-console
        console.error('Brand Concierge request failed:', event.data.errorMessage);
      }
    },
  });
}

function loadOnce() {
  if (loading) return;
  loading = install().catch((error) => {
    shell?.fail();
    // eslint-disable-next-line no-console
    console.error('Brand Concierge failed to load:', error);
  });
}

export default function loadBrandConcierge() {
  // Include /us/en and its child pages; exclude unrelated site paths.
  if (!/^\/us\/en(?:\/|$)/.test(window.location.pathname)) return;

  loadOnce();
}
