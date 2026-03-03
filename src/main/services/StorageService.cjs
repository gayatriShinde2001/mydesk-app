const fs = require('fs');
const path = require('path');

class StorageService {
  #dataDir = null;
  #backupDir = null;

  get dataDir() {
    return this.#dataDir;
  }

  get backupDir() {
    return this.#backupDir;
  }

  initialize(userDataPath) {
    this.#dataDir = userDataPath;
    this.#backupDir = path.join(userDataPath, 'backups');

    if (!fs.existsSync(this.#backupDir)) {
      fs.mkdirSync(this.#backupDir, { recursive: true });
    }
  }

  getFilePath(filename) {
    return path.join(this.#dataDir, filename);
  }

  exists(filepath) {
    return fs.existsSync(filepath);
  }

  read(filepath) {
    if (!this.exists(filepath)) {
      return null;
    }
    const data = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  }

  write(filepath, data) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  copyFile(source, destination) {
    fs.copyFileSync(source, destination);
  }

  getBackupPath(filename, timestamp) {
    return path.join(this.#backupDir, `${filename}.${timestamp}.json`);
  }

  listFiles(dir) {
    if (!fs.existsSync(dir)) {
      return [];
    }
    return fs.readdirSync(dir);
  }

  deleteFile(filepath) {
    if (this.exists(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  createBackup(filename) {
    const filepath = this.getFilePath(filename);
    if (!this.exists(filepath)) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.getBackupPath(filename, timestamp);
    this.copyFile(filepath, backupPath);

    return backupPath;
  }

  cleanupOldBackups(filename, keepCount = 5) {
    const files = this.listFiles(this.#backupDir)
      .filter(f => f.startsWith(`${filename}.`))
      .sort()
      .reverse();

    files.slice(keepCount).forEach(f => {
      this.deleteFile(path.join(this.#backupDir, f));
    });
  }
}

module.exports = new StorageService();
