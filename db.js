class Database {
    constructor() {
        this.dbName = 'VillageSurveyDB';
        this.version = 1;
        this.db = null;
        this.stores = {
            villages: { keyPath: 'id', autoIncrement: true },
            houses: { keyPath: 'id', autoIncrement: true },
            members: { keyPath: 'id', autoIncrement: true },
            settings: { keyPath: 'key' },
            aadhaarImages: { keyPath: 'memberId' }
        };
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create stores
                for (const [storeName, config] of Object.entries(this.stores)) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, config);
                        
                        // Create indexes
                        if (storeName === 'houses') {
                            store.createIndex('villageId', 'villageId', { unique: false });
                            store.createIndex('houseNumber', 'houseNumber', { unique: false });
                        }
                        if (storeName === 'members') {
                            store.createIndex('houseId', 'houseId', { unique: false });
                            store.createIndex('familyId', 'familyId', { unique: false });
                            store.createIndex('gender', 'gender', { unique: false });
                            store.createIndex('caste', 'caste', { unique: false });
                        }
                    }
                }
            };
        });
    }

    // Add village
    async addVillage(villageData) {
        const transaction = this.db.transaction(['villages'], 'readwrite');
        const store = transaction.objectStore('villages');
        
        return new Promise((resolve, reject) => {
            const request = store.add({
                name: villageData.name,
                createdAt: new Date().toISOString(),
                notes: villageData.notes || ''
            });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get all villages
    async getVillages() {
        const transaction = this.db.transaction(['villages'], 'readonly');
        const store = transaction.objectStore('villages');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get village by ID
    async getVillage(id) {
        const transaction = this.db.transaction(['villages'], 'readonly');
        const store = transaction.objectStore('villages');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Update village
    async updateVillage(id, villageData) {
        const transaction = this.db.transaction(['villages'], 'readwrite');
        const store = transaction.objectStore('villages');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const village = getRequest.result;
                village.name = villageData.name;
                village.notes = villageData.notes || '';
                village.updatedAt = new Date().toISOString();

                const updateRequest = store.put(village);
                updateRequest.onerror = () => reject(updateRequest.error);
                updateRequest.onsuccess = () => resolve(village);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // Delete village and associated data
    async deleteVillage(id) {
        const transaction = this.db.transaction(['villages', 'houses', 'members'], 'readwrite');
        
        try {
            // Delete houses and members
            const houses = await this.getHousesByVillage(id);
            for (const house of houses) {
                await this.deleteHouse(house.id);
            }

            // Delete village
            const villageStore = transaction.objectStore('villages');
            return new Promise((resolve, reject) => {
                const request = villageStore.delete(id);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(true);
            });
        } catch (error) {
            throw error;
        }
    }

    // Add house
    async addHouse(houseData) {
        const transaction = this.db.transaction(['houses'], 'readwrite');
        const store = transaction.objectStore('houses');

        // Check for duplicate house number
        const index = store.index('houseNumber');
        const duplicates = await new Promise((resolve, reject) => {
            const request = index.getAll(houseData.houseNumber);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });

        if (duplicates.some(h => h.villageId === houseData.villageId)) {
            throw new Error('House number already exists in this village');
        }

        return new Promise((resolve, reject) => {
            const request = store.add({
                villageId: houseData.villageId,
                houseNumber: houseData.houseNumber,
                familyId: this.generateFamilyId(),
                headName: houseData.headName,
                headMobile: houseData.headMobile || '',
                casteCategory: houseData.casteCategory,
                houseType: houseData.houseType,
                toilet: houseData.toilet,
                drinkingWater: houseData.drinkingWater,
                electricity: houseData.electricity,
                notes: houseData.notes || '',
                createdAt: new Date().toISOString()
            });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get houses by village
    async getHousesByVillage(villageId) {
        const transaction = this.db.transaction(['houses'], 'readonly');
        const store = transaction.objectStore('houses');
        const index = store.index('villageId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(villageId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get all houses
    async getHouses() {
        const transaction = this.db.transaction(['houses'], 'readonly');
        const store = transaction.objectStore('houses');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get house by ID
    async getHouse(id) {
        const transaction = this.db.transaction(['houses'], 'readonly');
        const store = transaction.objectStore('houses');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Update house
    async updateHouse(id, houseData) {
        const transaction = this.db.transaction(['houses'], 'readwrite');
        const store = transaction.objectStore('houses');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const house = getRequest.result;
                house.headName = houseData.headName;
                house.headMobile = houseData.headMobile || '';
                house.casteCategory = houseData.casteCategory;
                house.houseType = houseData.houseType;
                house.toilet = houseData.toilet;
                house.drinkingWater = houseData.drinkingWater;
                house.electricity = houseData.electricity;
                house.notes = houseData.notes || '';
                house.updatedAt = new Date().toISOString();

                const updateRequest = store.put(house);
                updateRequest.onerror = () => reject(updateRequest.error);
                updateRequest.onsuccess = () => resolve(house);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // Delete house and associated members
    async deleteHouse(id) {
        const transaction = this.db.transaction(['houses', 'members', 'aadhaarImages'], 'readwrite');
        
        // Get house
        const house = await this.getHouse(id);
        if (!house) return false;

        // Delete members
        const members = await this.getMembersByHouse(id);
        for (const member of members) {
            await this.deleteAadhaarImage(member.id);
        }

        // Delete from members
        const membersStore = transaction.objectStore('members');
        for (const member of members) {
            await new Promise((resolve, reject) => {
                const request = membersStore.delete(member.id);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(true);
            });
        }

        // Delete house
        const houseStore = transaction.objectStore('houses');
        return new Promise((resolve, reject) => {
            const request = houseStore.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // Add member
    async addMember(memberData) {
        const transaction = this.db.transaction(['members'], 'readwrite');
        const store = transaction.objectStore('members');

        // Get house to get familyId
        const house = await this.getHouse(memberData.houseId);

        return new Promise((resolve, reject) => {
            const request = store.add({
                houseId: memberData.houseId,
                familyId: house.familyId,
                fullName: memberData.fullName,
                fatherName: memberData.fatherName,
                dob: memberData.dob,
                age: this.calculateAge(memberData.dob),
                gender: memberData.gender,
                maritalStatus: memberData.maritalStatus,
                education: memberData.education,
                occupation: memberData.occupation,
                mobile: memberData.mobile || '',
                disability: memberData.disability,
                caste: memberData.caste,
                voterId: memberData.voterId,
                aadhaarVerified: false,
                aadhaarLast4: '',
                notes: memberData.notes || '',
                createdAt: new Date().toISOString()
            });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get members by house
    async getMembersByHouse(houseId) {
        const transaction = this.db.transaction(['members'], 'readonly');
        const store = transaction.objectStore('members');
        const index = store.index('houseId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(houseId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get all members
    async getMembers() {
        const transaction = this.db.transaction(['members'], 'readonly');
        const store = transaction.objectStore('members');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get member by ID
    async getMember(id) {
        const transaction = this.db.transaction(['members'], 'readonly');
        const store = transaction.objectStore('members');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Update member
    async updateMember(id, memberData) {
        const transaction = this.db.transaction(['members'], 'readwrite');
        const store = transaction.objectStore('members');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const member = getRequest.result;
                member.fullName = memberData.fullName;
                member.fatherName = memberData.fatherName;
                member.dob = memberData.dob;
                member.age = this.calculateAge(memberData.dob);
                member.gender = memberData.gender;
                member.maritalStatus = memberData.maritalStatus;
                member.education = memberData.education;
                member.occupation = memberData.occupation;
                member.mobile = memberData.mobile || '';
                member.disability = memberData.disability;
                member.caste = memberData.caste;
                member.voterId = memberData.voterId;
                member.aadhaarVerified = memberData.aadhaarVerified || false;
                member.aadhaarLast4 = memberData.aadhaarLast4 || '';
                member.notes = memberData.notes || '';
                member.updatedAt = new Date().toISOString();

                const updateRequest = store.put(member);
                updateRequest.onerror = () => reject(updateRequest.error);
                updateRequest.onsuccess = () => resolve(member);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // Delete member
    async deleteMember(id) {
        const transaction = this.db.transaction(['members', 'aadhaarImages'], 'readwrite');
        
        // Delete aadhaar image if exists
        await this.deleteAadhaarImage(id);

        // Delete member
        const store = transaction.objectStore('members');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // Store Aadhaar image
    async storeAadhaarImage(memberId, imageData) {
        const transaction = this.db.transaction(['aadhaarImages'], 'readwrite');
        const store = transaction.objectStore('aadhaarImages');

        return new Promise((resolve, reject) => {
            const request = store.put({
                memberId: memberId,
                imageData: imageData,
                uploadedAt: new Date().toISOString()
            });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // Get Aadhaar image
    async getAadhaarImage(memberId) {
        const transaction = this.db.transaction(['aadhaarImages'], 'readonly');
        const store = transaction.objectStore('aadhaarImages');

        return new Promise((resolve, reject) => {
            const request = store.get(memberId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Delete Aadhaar image
    async deleteAadhaarImage(memberId) {
        const transaction = this.db.transaction(['aadhaarImages'], 'readwrite');
        const store = transaction.objectStore('aadhaarImages');

        return new Promise((resolve, reject) => {
            const request = store.delete(memberId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // Get settings
    async getSetting(key) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result?.value || null);
        });
    }

    // Set setting
    async setSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(value);
        });
    }

    // Export all data as JSON
    async exportData() {
        const villages = await this.getVillages();
        const houses = await this.getHouses();
        const members = await this.getMembers();

        return {
            villages,
            houses,
            members,
            exportedAt: new Date().toISOString(),
            version: this.version
        };
    }

    // Import data
    async importData(data) {
        try {
            // Clear existing data
            await this.deleteAllData();

            // Import villages
            for (const village of data.villages) {
                await this.addVillage(village);
            }

            // Import houses
            for (const house of data.houses) {
                await this.addHouse(house);
            }

            // Import members
            for (const member of data.members) {
                await this.addMember(member);
            }

            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Delete all data
    async deleteAllData() {
        const transaction = this.db.transaction(
            Object.keys(this.stores),
            'readwrite'
        );

        return new Promise((resolve, reject) => {
            for (const storeName of Object.keys(this.stores)) {
                const store = transaction.objectStore(storeName);
                store.clear();
            }

            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => resolve(true);
        });
    }

    // Helper functions
    generateFamilyId() {
        return 'FAM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    calculateAge(dob) {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return Math.max(0, age);
    }

    // Filter members based on criteria
    async filterMembers(criteria) {
        let members = await this.getMembers();

        if (criteria.ageMin !== undefined) {
            members = members.filter(m => m.age >= criteria.ageMin);
        }
        if (criteria.ageMax !== undefined) {
            members = members.filter(m => m.age <= criteria.ageMax);
        }
        if (criteria.gender) {
            members = members.filter(m => m.gender === criteria.gender);
        }
        if (criteria.caste) {
            members = members.filter(m => m.caste === criteria.caste);
        }
        if (criteria.education) {
            members = members.filter(m => m.education === criteria.education);
        }
        if (criteria.occupation) {
            members = members.filter(m => m.occupation === criteria.occupation);
        }
        if (criteria.disability !== undefined) {
            members = members.filter(m => m.disability === criteria.disability);
        }
        if (criteria.voterId !== undefined) {
            members = members.filter(m => m.voterId === criteria.voterId);
        }
        if (criteria.village) {
            const houses = await this.getHousesByVillage(criteria.village);
            const houseIds = houses.map(h => h.id);
            members = members.filter(m => houseIds.includes(m.houseId));
        }

        return members;
    }

    // Search members
    async searchMembers(query) {
        const members = await this.getMembers();
        const houses = await this.getHouses();
        const villages = await this.getVillages();

        const houseMap = Object.fromEntries(houses.map(h => [h.id, h]));
        const villageMap = Object.fromEntries(villages.map(v => [v.id, v]));

        const lowerQuery = query.toLowerCase();

        return members.filter(member => {
            const house = houseMap[member.houseId];
            if (!house) return false;

            return (
                member.fullName.toLowerCase().includes(lowerQuery) ||
                member.fatherName.toLowerCase().includes(lowerQuery) ||
                member.mobile.includes(query) ||
                member.caste.toLowerCase().includes(lowerQuery) ||
                member.familyId.toLowerCase().includes(lowerQuery) ||
                house.houseNumber.toString().includes(query)
            );
        });
    }
}

// Initialize database
const db = new Database();
db.init().catch(error => console.error('Database initialization error:', error));

// Global database instance
window.db = db;
