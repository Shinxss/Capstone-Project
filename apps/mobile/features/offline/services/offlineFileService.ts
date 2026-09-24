import * as FileSystem from "expo-file-system/legacy";

function getExtension(fileName?: string, mimeType?: string): string {
  if (fileName && fileName.includes(".")) {
    const ext = fileName.split(".").pop()?.trim().toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/heic") return "heic";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export class OfflineFileService {
  async persistDurableProof(
    sourceUri: string,
    clientRequestId: string,
    mimeType?: string,
    fileName?: string
  ): Promise<{ localUri: string; mimeType: string; fileName: string }> {
    const ext = getExtension(fileName, mimeType);
    const resolvedMime = mimeType ?? (ext === "png" ? "image/png" : "image/jpeg");
    const resolvedName = fileName ?? `proof_${clientRequestId}.${ext}`;

    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      throw new Error("Local document directory is not available on this device.");
    }

    const baseDir = `${docDir}Lifeline/offline-reports/${clientRequestId}/`;
    await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });

    const targetUri = `${baseDir}proof.${ext}`;

    // If source is already the target, return early
    if (sourceUri === targetUri) {
      return { localUri: targetUri, mimeType: resolvedMime, fileName: resolvedName };
    }

    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetUri,
    });

    const info = await FileSystem.getInfoAsync(targetUri);
    if (!info.exists) {
      throw new Error(`Failed to copy proof file to durable storage: ${targetUri}`);
    }

    return {
      localUri: targetUri,
      mimeType: resolvedMime,
      fileName: resolvedName,
    };
  }

  async readDurableProofAsBase64(localUri: string): Promise<string> {
    const info = await FileSystem.getInfoAsync(localUri);
    if (!info.exists) {
      throw new Error(`Durable proof file does not exist at path: ${localUri}`);
    }

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64 || base64.trim().length === 0) {
      throw new Error(`Durable proof file is empty: ${localUri}`);
    }

    return base64;
  }

  async deleteDurableProof(localUri: string, clientRequestId?: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    } catch {
      // Ignore deletion errors
    }

    if (clientRequestId && FileSystem.documentDirectory) {
      try {
        const folderUri = `${FileSystem.documentDirectory}Lifeline/offline-reports/${clientRequestId}/`;
        await FileSystem.deleteAsync(folderUri, { idempotent: true });
      } catch {
        // Ignore folder deletion errors
      }
    }
  }
}

export const offlineFileService = new OfflineFileService();
