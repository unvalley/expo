import { deprecate, Platform, UnavailabilityError, CodedError } from '@unimodules/core';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

import StoreReview from './ExpoStoreReview';
import { StoreReviewPreviewOptions, StoreReviewPreviewResultType } from './StoreReview.types';

/**
 * Determine if the platform has the capabilities to use `requestedReview`
 * - iOS: `true` if iOS 10.3 or greater and the StoreKit framework is linked
 * - Android: Always `true` (open URL to app store)
 * - web: Always `false`
 */
export async function isAvailableAsync(): Promise<boolean> {
  return StoreReview.isAvailableAsync();
}

/**
 * @deprecated use `isAvailableAsync()` instead
 */
export function isSupported(): void {
  deprecate('expo-store-review', 'StoreReview.isSupported', {
    replacement: 'StoreReview.isAvailableAsync',
  });
}

/**
 * Use the iOS `SKStoreReviewController` API to prompt a user rating without leaving the app,
 * or open a web browser to the play store on Android.
 */
export async function requestReview(): Promise<void> {
  if (StoreReview?.requestReviewAsync) {
    await StoreReview.requestReviewAsync();
    return;
  }
  // If StoreReview is unavailable then get the store URL from `app.config.js` or `app.json` and open the store
  const url = storeUrl();
  if (url) {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      console.warn("Expo.StoreReview.requestReview(): Can't open store url: ", url);
    } else {
      await Linking.openURL(url);
    }
  } else {
    // If the store URL is missing, let the dev know.
    console.warn(
      "Expo.StoreReview.requestReview(): Couldn't link to store, please make sure the `android.playStoreUrl` & `ios.appStoreUrl` fields are filled out in your `app.json`"
    );
  }
}

/**
 * Get your app's store URLs from `app.config.js` or `app.json`:
 * - iOS: https://docs.expo.io/versions/latest/workflow/configuration#appstoreurlurl-to-your-app-on-the-apple-app-store-if-you-have-deployed-it-there-this-is-used-to-link-to-your-store-page-from-your-expo-project-page-if-your-app-is-public
 * - Android: https://docs.expo.io/versions/latest/workflow/configuration#playstoreurlurl-to-your-app-on-the-google-play-store-if-you-have-deployed-it-there-this-is-used-to-link-to-your-store-page-from-your-expo-project-page-if-your-app-is-public
 * - web: returns `null`
 */
export function storeUrl(): string | null {
  const { manifest } = Constants;
  // eslint-disable-next-line no-undef
  if (Platform.OS === 'ios' && manifest?.ios) {
    return manifest.ios.appStoreUrl;
    // eslint-disable-next-line no-undef
  } else if (Platform.OS === 'android' && manifest?.android) {
    return manifest.android.playStoreUrl;
  }
  return null;
}

/**
 * A flag to detect if this module can do anything.
 */
export async function hasAction(): Promise<boolean> {
  return !!storeUrl() || (await isAvailableAsync());
}

let controllerLocked = false;

/**
 * Present an iOS App Store preview for a published app.
 * iOS only.
 *
 * @param options
 */
export async function presentPreviewAsync(
  options: StoreReviewPreviewOptions
): Promise<{ type: StoreReviewPreviewResultType }> {
  if (!StoreReview.presentPreviewAsync)
    throw new UnavailabilityError('StoreReview', 'presentPreviewAsync');
  if (typeof options.itemId !== 'number')
    throw new CodedError(
      'ERR_STORE_REVIEW_PREVIEW_INVALID_OPTIONS',
      'A valid itemId number must be provided.'
    );

  // Prevent multiple sessions from running at the same time, WebBrowser doesn't
  // support it this makes the behavior predictable.
  if (controllerLocked) {
    if (__DEV__) {
      console.warn(
        'Attempted to call StoreReview.presentPreviewAsync multiple times while already active. Only one iTunes preview can be active at any given time.'
      );
    }

    return { type: 'locked' };
  }

  // About to present preview, set lock
  controllerLocked = true;

  let result;
  try {
    result = await StoreReview.presentPreviewAsync(options);
  } finally {
    // Preview complete, unset lock
    controllerLocked = false;
  }

  return result;
}

/**
 * Dismiss the currently presented App Store preview controller.
 * iOS only.
 */
export async function dismissPreviewAsync(): Promise<void> {
  if (!StoreReview.dismissPreviewAsync)
    throw new UnavailabilityError('StoreReview', 'dismissPreviewAsync');
  return StoreReview.dismissPreviewAsync();
}

export { StoreReviewPreviewOptions, StoreReviewPreviewResultType };
