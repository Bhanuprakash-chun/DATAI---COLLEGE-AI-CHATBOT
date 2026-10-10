/**
 * OPFS (Origin Private File System) Storage Manager
 * Stores raw file blobs with high I/O throughput in the browser sandbox.
 */

export class OPFSStorage {
  private static rootDir: FileSystemDirectoryHandle | null = null;
  private static isSupported = typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;

  private static async getRoot(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported) return null;
    if (!this.rootDir) {
      try {
        this.rootDir = await navigator.storage.getDirectory();
      } catch (err) {
        console.warn('OPFS not accessible, using fallback:', err);
        return null;
      }
    }
    return this.rootDir;
  }

  static async saveFile(filename: string, data: ArrayBuffer | Blob): Promise<boolean> {
    const root = await this.getRoot();
    if (!root) return false;

    try {
      const fileHandle = await root.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      return true;
    } catch (err) {
      console.error('Failed to write to OPFS:', err);
      return false;
    }
  }

  static async getFile(filename: string): Promise<Blob | null> {
    const root = await this.getRoot();
    if (!root) return null;

    try {
      const fileHandle = await root.getFileHandle(filename);
      return await fileHandle.getFile();
    } catch (err) {
      // File may not exist in OPFS
      return null;
    }
  }

  static async deleteFile(filename: string): Promise<boolean> {
    const root = await this.getRoot();
    if (!root) return false;

    try {
      await root.removeEntry(filename);
      return true;
    } catch (err) {
      return false;
    }
  }

  static async clearAll(): Promise<void> {
    const root = await this.getRoot();
    if (!root) return;

    try {
      // @ts-ignore
      for await (const [name] of root.entries()) {
        try {
          await root.removeEntry(name);
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Error clearing OPFS entries:', err);
    }
  }
}
