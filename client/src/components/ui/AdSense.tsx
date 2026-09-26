import React, { useEffect, useRef, useState } from 'react';

// Script loading state tracker across components to prevent redundant injection
let scriptLoadingPromise: Promise<void> | null = null;

const loadAdSenseScript = (clientId: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();

  // If already loaded or present in DOM
  if (document.querySelector(`script[src*="adsbygoogle.js"]`)) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

export interface AdSenseProps {
  /** Optional custom client ID (defaults to VITE_ADSENSE_CLIENT_ID env var) */
  clientId?: string;
  /** Optional AdSense Slot ID (if empty, responsive auto-ads display format can be used) */
  slotId?: string;
  /** Format of the ad: auto, fluid, rectangle, horizontal, vertical */
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  /** Responsive layout behavior toggle (default true) */
  responsive?: boolean;
  /** Custom CSS classes for container wrapping */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
  /** Label tag to distinguish advertisement from site content */
  label?: string;
}

export const AdSense: React.FC<AdSenseProps> = ({
  clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID,
  slotId,
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' },
  label = 'Advertisement',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef<boolean>(false);
  const [adError, setAdError] = useState<boolean>(false);

  // If no client ID configured in env or props, render nothing gracefully
  if (!clientId || clientId.trim() === '') {
    return null;
  }

  useEffect(() => {
    let isMounted = true;

    loadAdSenseScript(clientId)
      .then(() => {
        if (!isMounted || pushedRef.current) return;
        try {
          // Initialize adsbygoogle array if not already initialized
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          pushedRef.current = true;
        } catch (err) {
          console.warn('AdSense push error:', err);
          if (isMounted) setAdError(true);
        }
      })
      .catch((err) => {
        console.warn('Failed to load AdSense script:', err);
        if (isMounted) setAdError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, slotId]);

  if (adError) {
    return null; // Gracefully fail without breaking page layout
  }

  return (
    <div className={`adsense-container overflow-hidden max-w-full my-6 flex flex-col items-center ${className}`}>
      {label && (
        <span className="text-[10px] tracking-wider uppercase text-ink/40 font-medium mb-1 select-none">
          {label}
        </span>
      )}
      <div className="w-full max-w-full overflow-hidden flex justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={style}
          data-ad-client={clientId}
          {...(slotId ? { 'data-ad-slot': slotId } : {})}
          {...(format ? { 'data-ad-format': format } : {})}
          {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
        />
      </div>
    </div>
  );
};

export default AdSense;
