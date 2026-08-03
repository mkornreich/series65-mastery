import { Linking } from 'react-native';
import { openInApp, isAppInstalled } from '../../modules/app-intents';

/** NewPipe — open-source, ad-free YouTube front-end. */
export const NEWPIPE_PACKAGE = 'org.schabi.newpipe';

/** Whether NewPipe is installed (so the setting is worth offering). */
export function isNewPipeInstalled(): boolean {
  return isAppInstalled(NEWPIPE_PACKAGE);
}

/**
 * Open a video URL. When `preferNewPipe`, try NewPipe first (an explicit
 * package intent); if it isn't installed or can't handle the link, fall back
 * to the system default handler (browser or the YouTube app).
 */
export function openVideo(url: string, preferNewPipe: boolean): void {
  if (preferNewPipe && openInApp(url, NEWPIPE_PACKAGE)) return;
  Linking.openURL(url).catch(() => {
    /* No handler available — nothing to do. */
  });
}
