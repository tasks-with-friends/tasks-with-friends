import { useEffect, useMemo, useState } from 'react';

export function useDocumentVisibility() {
  const [hidden, setHidden] = useState(false);
  const [visibilityState, setVisibilityState] = useState<
    'visible' | 'hidden' | 'prerender' | 'unloaded'
  >('visible');
  useEffect(() => {
    const crossBrowserDocument = document as any;
    let hiddenProp: string | undefined = undefined;
    let visibilityChange: string | undefined = undefined;
    if (typeof crossBrowserDocument.hidden !== 'undefined') {
      // Opera 12.10 and Firefox 18 and later support
      hiddenProp = 'hidden';
      visibilityChange = 'visibilitychange';
    } else if (typeof crossBrowserDocument.msHidden !== 'undefined') {
      hiddenProp = 'msHidden';
      visibilityChange = 'msvisibilitychange';
    } else if (typeof crossBrowserDocument.webkitHidden !== 'undefined') {
      hiddenProp = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }

    function handleVisibilityChange() {
      setHidden(!!crossBrowserDocument[hiddenProp || '']);
      setVisibilityState(crossBrowserDocument['visibilityState']);
    }
    setHidden(!!crossBrowserDocument[hiddenProp || '']);
    setVisibilityState(crossBrowserDocument['visibilityState']);

    if (
      typeof document.addEventListener === 'undefined' ||
      hiddenProp === undefined ||
      visibilityChange === undefined
    ) {
      console.warn('This browser does not support Page Visibility API.');
    } else {
      document.addEventListener(
        visibilityChange,
        handleVisibilityChange,
        false,
      );
    }

    return () => {
      if (
        typeof document.removeEventListener !== 'undefined' &&
        visibilityChange !== undefined
      ) {
        document.removeEventListener(
          visibilityChange,
          handleVisibilityChange,
          false,
        );
      }
    };
  }, []);

  return useMemo(
    () => ({ hidden, visibilityState }),
    [hidden, visibilityState],
  );
}
