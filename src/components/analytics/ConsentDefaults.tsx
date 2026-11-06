import Script from "next/script";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

// Consent Mode v2: denied until the visitor chooses. A returning visitor who
// accepted starts granted, so GTM's first page view isn't recorded as denied.
const CONSENT_DEFAULT = `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments)}window.gtag=gtag;var s='denied';try{if(window.localStorage.getItem('${CONSENT_STORAGE_KEY}')==='granted')s='granted'}catch(e){}gtag('consent','default',{analytics_storage:s,ad_storage:s,ad_user_data:s,ad_personalization:s});`;

/**
 * Server component. Render it once in the root layout (src/app/layout.tsx) so
 * the defaults are in the page head before Google Tag Manager can load.
 * `Analytics` only mounts GTM after consent is granted and the update is pushed.
 */
export function ConsentDefaults() {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- App Router: valid in the root layout; the rule targets the Pages Router _document
    <Script id="consent-default" strategy="beforeInteractive">
      {CONSENT_DEFAULT}
    </Script>
  );
}
