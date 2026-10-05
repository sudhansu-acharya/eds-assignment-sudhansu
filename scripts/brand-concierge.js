const SCRIPTS = [
  'https://cdn1.adoberesources.net/alloy/2.32.0/alloy.min.js',
  'https://experience.adobe.net/solutions/experience-platform-brand-concierge-web-agent/static-assets/main.js',
];
const STYLE_CONFIGURATION = '/scripts/styling-config-6aa0fe1c89d19d61e7598a59.json';

let loading;

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

async function loadStyleConfiguration() {
  const response = await fetch(STYLE_CONFIGURATION);
  if (!response.ok) throw new Error('Brand Concierge style configuration failed to load');
  window.styleConfiguration = await response.json();
}

async function install() {
  const mount = document.createElement('div');
  mount.id = 'brand-concierge-mount';
  mount.className = 'brand-concierge';
  document.body.append(mount);

  prepareAlloy();
  await loadStyleConfiguration();
  await SCRIPTS.reduce(
    (chain, src) => chain.then(() => loadScript(src)),
    Promise.resolve(),
  );

  if (!window.styleConfiguration || !window.adobe?.concierge?.bootstrap) {
    throw new Error('Brand Concierge configuration or bootstrap is unavailable');
  }

  // This function runs only after the site has confirmed the required consent.
  await window.alloy('configure', {
    defaultConsent: 'in',
    edgeDomain: 'edge.adobedc.net',
    edgeBasePath: 'ee',
    datastreamId: '81f2903c-ce3a-4557-a8a6-eac3f07f9021',
    orgId: '0B6930256441790E0A495FFE@AdobeOrg',
    conversation: {
      // Match the concierge's Prod (VA7) deployment, not the nearest Edge region.
      region: 'va7',
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
      if (event.eventType === 'error:occurred') {
        // eslint-disable-next-line no-console
        console.error('Brand Concierge request failed:', event.data.errorMessage);
      }
    },
  });
}

function loadAfterConsent() {
  if (window.wkndConciergeConsent !== true || loading) return;
  loading = install().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Brand Concierge failed to load:', error);
  });
}

export default function loadBrandConcierge() {
  // Include /us/en and its child pages; exclude unrelated site paths.
  if (!/^\/us\/en(?:\/|$)/.test(window.location.pathname)) return;

  window.addEventListener('wknd:concierge-consent-granted', loadAfterConsent, {
    once: true,
  });
  loadAfterConsent();
}
