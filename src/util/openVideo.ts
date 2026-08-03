import { Linking } from 'react-native';
import { openInApp } from '../../modules/app-intents';

/** NewPipe — open-source, ad-free YouTube front-end. */
export const NEWPIPE_PACKAGE = 'org.schabi.newpipe';
/** Official YouTube app. */
export const YOUTUBE_PACKAGE = 'com.google.android.youtube';

/**
 * Open a video URL, preferring NewPipe, then the official YouTube app, then the
 * system default handler (browser). Each explicit-package launch returns false
 * when that app isn't installed / can't handle the link, so we fall through.
 */
export function openVideo(url: string): void {
  if (openInApp(url, NEWPIPE_PACKAGE)) return;
  if (openInApp(url, YOUTUBE_PACKAGE)) return;
  Linking.openURL(url).catch(() => {
    /* No handler available — nothing to do. */
  });
}
