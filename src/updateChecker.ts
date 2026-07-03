import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

const REPO = 'yuchoi-bb/Morning';
const RELEASE_TAG_PATTERN = /^apk-(\d+)$/;

export interface UpdateInfo {
  buildNumber: number;
  releaseName: string;
  downloadUrl: string;
}

export function getCurrentBuildNumber(): number {
  return Number(Constants.expoConfig?.extra?.buildNumber ?? 0);
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (Platform.OS !== 'android') return null;

  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
  if (!response.ok) return null;
  const release = await response.json();

  const match = RELEASE_TAG_PATTERN.exec(release.tag_name ?? '');
  if (!match) return null;

  const latestBuildNumber = parseInt(match[1], 10);
  if (latestBuildNumber <= getCurrentBuildNumber()) return null;

  const apkAsset = (release.assets ?? []).find((asset: { name?: string }) =>
    asset.name?.endsWith('.apk')
  );
  if (!apkAsset) return null;

  return {
    buildNumber: latestBuildNumber,
    releaseName: release.name ?? release.tag_name,
    downloadUrl: apkAsset.browser_download_url,
  };
}

export async function downloadAndInstall(
  update: UpdateInfo,
  onProgress?: (fraction: number) => void
): Promise<void> {
  const fileUri = `${FileSystem.cacheDirectory}morning-update-${update.buildNumber}.apk`;

  const downloadResumable = FileSystem.createDownloadResumable(
    update.downloadUrl,
    fileUri,
    {},
    (progress) => {
      onProgress?.(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) throw new Error('APK 다운로드에 실패했어요.');

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: 'application/vnd.android.package-archive',
  });
}
