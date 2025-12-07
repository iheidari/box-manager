import * as FileSystemLegacy from "expo-file-system/legacy";

const {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
} = FileSystemLegacy;

// Directory for storing images permanently
const IMAGES_DIR = `${documentDirectory || ""}images/`;

/**
 * Ensures the images directory exists
 */
async function ensureImagesDirectory(): Promise<void> {
  const dirInfo = await getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

/**
 * Saves an image from a temporary URI to a permanent location
 * @param tempUri - The temporary URI from the camera/image picker
 * @param itemId - The ID of the item (used for filename)
 * @returns The permanent URI of the saved image
 */
export async function saveImagePermanently(
  tempUri: string,
  itemId: string
): Promise<string> {
  try {
    await ensureImagesDirectory();

    // Generate a unique filename using itemId and timestamp
    const timestamp = Date.now();
    const extension = tempUri.split(".").pop() || "jpg";
    const filename = `${itemId}_${timestamp}.${extension}`;
    const permanentUri = `${IMAGES_DIR}${filename}`;

    // Copy the file from temporary location to permanent location
    await copyAsync({
      from: tempUri,
      to: permanentUri,
    });

    return permanentUri;
  } catch (error) {
    console.error("Error saving image permanently:", error);
    throw error;
  }
}

/**
 * Checks if an image file exists at the given URI
 */
export async function imageExists(uri: string): Promise<boolean> {
  try {
    const fileInfo = await getInfoAsync(uri);
    return fileInfo.exists;
  } catch (error) {
    console.error("Error checking image existence:", error);
    return false;
  }
}

/**
 * Deletes an image file
 */
export async function deleteImage(uri: string): Promise<void> {
  try {
    const exists = await imageExists(uri);
    if (exists) {
      await deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    // Don't throw - allow deletion to fail silently
  }
}

/**
 * Migrates a temporary image URI to a permanent location
 * This is useful when upgrading from temporary to permanent storage
 */
export async function migrateImageToPermanent(
  tempUri: string | null,
  itemId: string
): Promise<string | null> {
  if (!tempUri) {
    return null;
  }

  // Check if it's already a permanent URI (starts with documentDirectory)
  if (tempUri.startsWith(documentDirectory || "")) {
    // Already permanent, just verify it exists
    const exists = await imageExists(tempUri);
    return exists ? tempUri : null;
  }

  // It's a temporary URI, migrate it
  try {
    return await saveImagePermanently(tempUri, itemId);
  } catch (error) {
    console.error("Error migrating image:", error);
    return null;
  }
}
