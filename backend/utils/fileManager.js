const path = require('path');
const fs = require('fs').promises;

const HOSTS_BASE_PATH = '/var/www/hosts';

/**
 * Constructs a safe, absolute path within a user's home directory and ensures it does not escape the sandbox.
 * @param {number} userId - The ID of the user.
 * @param {string} userProvidedPath - The path provided by the user, relative to their home.
 * @returns {string} A safe, resolved, absolute path.
 * @throws {Error} If the path is outside the user's sandbox.
 */
const getSafePath = (userId, userProvidedPath = '') => {
    // Define the user's personal sandbox directory
    const userHomeDir = path.resolve(path.join(HOSTS_BASE_PATH, `user_${userId}`));

    // Resolve the full path based on user input
    const intendedPath = path.resolve(path.join(userHomeDir, userProvidedPath));

    // Security Check: Ensure the resolved path is still within the user's home directory
    if (!intendedPath.startsWith(userHomeDir)) {
        throw new Error('Forbidden: Access outside of designated directory is not allowed.');
    }

    return intendedPath;
};

/**
 * Lists the contents of a directory.
 * @param {string} safeDirPath - A safe, absolute path to the directory.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of file/folder objects.
 */
const listDirectoryContents = async (safeDirPath) => {
    const dirents = await fs.readdir(safeDirPath, { withFileTypes: true });
    const files = await Promise.all(dirents.map(async (dirent) => {
        const fullPath = path.join(safeDirPath, dirent.name);
        try {
            const stats = await fs.stat(fullPath);
            return {
                name: dirent.name,
                isDirectory: dirent.isDirectory(),
                size: stats.size,
                mtime: stats.mtime,
            };
        } catch (error) {
            // Handle cases where file might be inaccessible, e.g., broken symlink
            console.error(`Could not stat file ${fullPath}:`, error);
            return null;
        }
    }));
    return files.filter(file => file !== null); // Filter out any nulls from failed stats
};


module.exports = {
    getSafePath,
    listDirectoryContents,
    HOSTS_BASE_PATH
};
