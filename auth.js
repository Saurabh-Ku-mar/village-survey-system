class AuthSystem {
    constructor() {
        this.HASH_KEY = 'vfs_hash';
        this.AUTH_KEY = 'vfs_auth';
        this.TIMESTAMP_KEY = 'vfs_timestamp';
        this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    }

    // SHA-256 hash function using Web Crypto API
    async hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // Initial setup - create password hash
    async setup(password) {
        try {
            const isSetup = await this.isSetup();
            if (isSetup) {
                return { success: false, message: 'System already initialized' };
            }

            const hash = await this.hashPassword(password);
            localStorage.setItem(this.HASH_KEY, hash);
            return { success: true, message: 'Setup completed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Check if system is already set up
    async isSetup() {
        return localStorage.getItem(this.HASH_KEY) !== null;
    }

    // Login with password
    async login(password, rememberMe = false) {
        try {
            const storedHash = localStorage.getItem(this.HASH_KEY);
            
            if (!storedHash) {
                return { success: false, message: 'System not initialized. Please set up first.' };
            }

            const inputHash = await this.hashPassword(password);

            if (inputHash === storedHash) {
                localStorage.setItem(this.AUTH_KEY, 'true');
                localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
                
                if (rememberMe) {
                    localStorage.setItem('vfs_remember', 'true');
                }

                return { success: true, message: 'Login successful' };
            } else {
                return { success: false, message: 'Invalid password' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Logout
    logout() {
        localStorage.removeItem(this.AUTH_KEY);
        localStorage.removeItem(this.TIMESTAMP_KEY);
        localStorage.removeItem('vfs_remember');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return localStorage.getItem(this.AUTH_KEY) === 'true';
    }

    // Check session timeout
    isSessionValid() {
        const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
        if (!timestamp) return false;

        const elapsed = Date.now() - parseInt(timestamp);
        return elapsed < this.SESSION_TIMEOUT;
    }

    // Change password
    async changePassword(oldPassword, newPassword) {
        try {
            const storedHash = localStorage.getItem(this.HASH_KEY);
            const oldHash = await this.hashPassword(oldPassword);

            if (oldHash !== storedHash) {
                return { success: false, message: 'Current password is incorrect' };
            }

            if (newPassword.length < 6) {
                return { success: false, message: 'New password must be at least 6 characters' };
            }

            const newHash = await this.hashPassword(newPassword);
            localStorage.setItem(this.HASH_KEY, newHash);

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Verify password for sensitive operations
    async verifyPassword(password) {
        try {
            const storedHash = localStorage.getItem(this.HASH_KEY);
            const inputHash = await this.hashPassword(password);
            return inputHash === storedHash;
        } catch (error) {
            return false;
        }
    }

    // Delete all data
    deleteAllData() {
        // Clear IndexedDB
        if (window.db) {
            window.db.deleteAllData();
        }

        // Clear localStorage (except hash)
        const hash = localStorage.getItem(this.HASH_KEY);
        localStorage.clear();
        if (hash) {
            localStorage.setItem(this.HASH_KEY, hash);
        }

        return { success: true, message: 'All data deleted successfully' };
    }

    // Extend session timeout
    extendSession() {
        localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
    }

    // Get remaining session time in seconds
    getRemainingSessionTime() {
        const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
        if (!timestamp) return 0;

        const elapsed = Date.now() - parseInt(timestamp);
        const remaining = Math.max(0, this.SESSION_TIMEOUT - elapsed);
        return Math.floor(remaining / 1000);
    }
}

// Global authentication instance
const authSystem = new AuthSystem();
