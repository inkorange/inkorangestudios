import Script from "next/script";

// Consent Mode v2: everything denied until the visitor chooses.
const CONSENT_DEFAULT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});`;

/**
 * Server component. Render it once in the root layout (src/app/layout.tsx) so
 * the denied defaults are in the page head before Google Tag Manager can load.
 * `Analytics` only mounts GTM after consent is granted.
 */
export function ConsentDefaults() {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- App Router: valid in the root layout; the rule targets the Pages Router _document
    <Script id="consent-default" strategy="beforeInteractive">
      {CONSENT_DEFAULT}
    </Script>
  );
}
