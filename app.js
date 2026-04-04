// Village Family Survey System - Main Application
class VillageApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.editingHouseId = null;
        this.editingMemberId = null;
        this.voterEligibilityAge = 18;
        this.selectedVillageFilter = null;
        this.selectedHouseFilter = null;
        this.darkMode = localStorage.getItem('vfs_darkMode') === 'true';
    }

    // Initialize the application
    async init() {
        // Wait for database initialization
        await new Promise(resolve => {
            const checkDB = () => {
                if (window.db && window.db.db) {
                    resolve();
                } else {
                    setTimeout(checkDB, 100);
                }
            };
            checkDB();
        });

        // Check authentication
        if (!authSystem.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Check session timeout
        if (!authSystem.isSessionValid()) {
            authSystem.logout();
            window.location.href = 'login.html';
            return;
        }

        // Load settings
        this.voterEligibilityAge = await db.getSetting('voterEligibilityAge') || 18;

        // Setup UI
        this.setupEventListeners();
        this.setupTheme();
        this.loadDashboard();

        // Set up session check
        setInterval(() => {
            if (!authSystem.isSessionValid()) {
                authSystem.logout();
                window.location.href = 'login.html';
            }
        }, 60000);
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.switchPage(page);
            });
        });

        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('show');
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    // Switch pages
    switchPage(page) {
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) {
            pageEl.classList.add('active');
        }

        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        this.currentPage = page;

        // Load page content
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'villages':
                this.loadVillages();
                break;
            case 'houses':
                this.loadHouses();
                break;
            case 'members':
                this.loadMembers();
                break;
            case 'search':
                this.loadSearch();
                break;
            case 'gender':
                this.loadGenderDashboard();
                break;
            case 'filter':
                this.loadFilter();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Dashboard
    async loadDashboard() {
        const villages = await db.getVillages();
        const houses = await db.getHouses();
        const members = await db.getMembers();

        // Calculate statistics
        const maleCount = members.filter(m => m.gender === 'Male').length;
        const femaleCount = members.filter(m => m.gender === 'Female').length;
        const otherCount = members.filter(m => m.gender === 'Other').length;

        const scCount = members.filter(m => m.caste === 'SC').length;
        const stCount = members.filter(m => m.caste === 'ST').length;
        const obcCount = members.filter(m => m.caste === 'OBC').length;
        const generalCount = members.filter(m => m.caste === 'General').length;
        const otherCasteCount = members.filter(m => m.caste === 'Other').length;

        // New voters required
        const newVotersRequired = members.filter(m => 
            m.age >= this.voterEligibilityAge && !m.voterId
        ).length;

        // Disability count
        const disabilityCount = members.filter(m => m.disability).length;

        // Update dashboard
        document.getElementById('statVillages').textContent = villages.length;
        document.getElementById('statHouses').textContent = houses.length;
        document.getElementById('statFamilies').textContent = houses.length;
        document.getElementById('statMembers').textContent = members.length;
        document.getElementById('statMales').textContent = maleCount;
        document.getElementById('statFemales').textContent = femaleCount;
        document.getElementById('statOthers').textContent = otherCount;
        document.getElementById('statSC').textContent = scCount;
        document.getElementById('statST').textContent = stCount;
        document.getElementById('statOBC').textContent = obcCount;
        document.getElementById('statGeneral').textContent = generalCount;
        document.getElementById('statEligible').textContent = newVotersRequired;
        document.getElementById('statDisability').textContent = disabilityCount;

        // Draw charts
        this.drawGenderChart(maleCount, femaleCount, otherCount);
        this.drawCasteChart(scCount, stCount, obcCount, generalCount, otherCasteCount);
    }

    // Draw gender chart
    drawGenderChart(male, female, other) {
        const canvas = document.getElementById('genderChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const total = male + female + other;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colors = ['#667eea', '#f093fb', '#764ba2'];
        const values = [male, female, other];
        const labels = [`Male: ${male}`, `Female: ${female}`, `Other: ${other}`];

        let currentAngle = 0;

        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;

            // Draw slice
            ctx.fillStyle = colors[index];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(value / total * 100)}%`, labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Draw legend
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        labels.forEach((label, index) => {
            ctx.fillStyle = colors[index];
            ctx.fillRect(220, 60 + index * 20, 10, 10);
            ctx.fillStyle = '#333';
            ctx.textAlign = 'left';
            ctx.fillText(label, 235, 68 + index * 20);
        });
    }

    // Draw caste chart
    drawCasteChart(sc, st, obc, general, other) {
        const canvas = document.getElementById('casteChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const values = [sc, st, obc, general, other];
        const labels = ['SC', 'ST', 'OBC', 'General', 'Other'];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

        const barWidth = 40;
        const barSpacing = 20;
        const chartHeight = 150;
        const maxValue = Math.max(...values, 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        values.forEach((value, index) => {
            const x = 20 + index * (barWidth + barSpacing);
            const height = (value / maxValue) * chartHeight;
            const y = canvas.height - 40 - height;

            // Draw bar
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, y, barWidth, height);

            // Draw value label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 5);

            // Draw caste label
            ctx.font = '11px Arial';
            ctx.fillText(labels[index], x + barWidth / 2, canvas.height - 15);
        });
    }

    // Villages Page
    async loadVillages() {
        const villages = await db.getVillages();
        const container = document.getElementById('villagesContainer');

        let html = `
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="app.showAddVillageModal()">
                    <span>➕</span> Add Village
                </button>
            </div>
        `;

        if (villages.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-icon">🏘️</div>
                    <div class="empty-title">No Villages Yet</div>
                    <p class="empty-text">Add your first village to get started</p>
                </div>
            `;
        } else {
            html += '<div class="list-container">';
            for (const village of villages) {
                const houses = await db.getHousesByVillage(village.id);
                const totalMembers = (await Promise.all(
                    houses.map(h => db.getMembersByHouse(h.id))
                )).flat().length;

                html += `
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">${village.name}</div>
                            <div class="list-item-subtitle">
                                ${houses.length} houses • ${totalMembers} members
                            </div>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn btn-small btn-secondary" 
                                onclick="app.showEditVillageModal(${village.id})">Edit</button>
                            <button class="btn btn-small btn-danger" 
                                onclick="app.deleteVillage(${village.id})">Delete</button>
                            <button class="btn btn-small btn-primary" 
                                onclick="app.loadVillageDetails(${village.id})">View</button>
                        </div>
                    </div>
                `;
            }
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // Show add village modal
    showAddVillageModal() {
        const modal = document.getElementById('villageModal');
        if (!modal) return;

        document.getElementById('villageModalTitle').textContent = 'Add Village';
        document.getElementById('villageForm').reset();
        document.getElementById('villageId').value = '';
        modal.classList.add('show');
    }

    // Show edit village modal
    async showEditVillageModal(villageId) {
        const village = await db.getVillage(villageId);
        const modal = document.getElementById('villageModal');
        if (!modal) return;

        document.getElementById('villageModalTitle').textContent = 'Edit Village';
        document.getElementById('villageName').value = village.name;
        document.getElementById('villageNotes').value = village.notes || '';
        document.getElementById('villageId').value = villageId;
        modal.classList.add('show');
    }

    // Save village
    async saveVillage(e) {
        e.preventDefault();
        const villageId = document.getElementById('villageId').value;
        const name = document.getElementById('villageName').value;
        const notes = document.getElementById('villageNotes').value;

        if (!name.trim()) {
            alert('Please enter village name');
            return;
        }

        try {
            if (villageId) {
                await db.updateVillage(parseInt(villageId), { name, notes });
            } else {
                await db.addVillage({ name, notes });
            }

            document.getElementById('villageModal').classList.remove('show');
            this.loadVillages();
            this.showNotification('Village saved successfully', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Delete village
    async deleteVillage(villageId) {
        if (!confirm('Are you sure you want to delete this village and all its data?')) {
            return;
        }

        try {
            await db.deleteVillage(villageId);
            this.loadVillages();
            this.showNotification('Village deleted successfully', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Load village details
    async loadVillageDetails(villageId) {
        const village = await db.getVillage(villageId);
        const houses = await db.getHousesByVillage(villageId);

        let html = `
            <button class="btn btn-secondary" onclick="app.loadVillages()" style="margin-bottom: 20px;">
                ← Back to Villages
            </button>

            <div class="form-container">
                <h2>${village.name}</h2>
                <p style="color: var(--gray); margin-bottom: 20px;">
                    Total Houses: ${houses.length}
                </p>

                <button class="btn btn-primary" onclick="app.showAddHouseModal(${villageId})">
                    ➕ Add House
                </button>
            </div>

            <div class="table-container" style="margin-top: 20px;">
                <h3 class="table-title">Houses</h3>
                <table>
                    <thead>
                        <tr>
                            <th>House #</th>
                            <th>Head Name</th>
                            <th>Caste</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const house of houses) {
            const members = await db.getMembersByHouse(house.id);
            html += `
                <tr>
                    <td>${house.houseNumber}</td>
                    <td>${house.headName}</td>
                    <td>${house.casteCategory}</td>
                    <td>${house.houseType}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" 
                            onclick="app.showEditHouseModal(${house.id})">Edit</button>
                        <button class="btn btn-small btn-primary" 
                            onclick="app.loadHouseDetails(${house.id})">View (${members.length})</button>
                        <button class="btn btn-small btn-danger" 
                            onclick="app.deleteHouse(${house.id})">Delete</button>
                    </td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('villagesContainer').innerHTML = html;
    }

    // Houses Page
    async loadHouses() {
        const villages = await db.getVillages();
        const houses = await db.getHouses();
        const container = document.getElementById('housesContainer');

        let html = `
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <select id="villageFilterSelect" class="search-input" style="flex: 0.3; margin: 0;">
                    <option value="">All Villages</option>
        `;

        for (const village of villages) {
            html += `<option value="${village.id}">${village.name}</option>`;
        }

        html += `
                </select>
                <button class="btn btn-primary" onclick="app.showAddHouseModal(null)">
                    ➕ Add House
                </button>
            </div>
        `;

        if (houses.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-icon">🏠</div>
                    <div class="empty-title">No Houses Yet</div>
                    <p class="empty-text">Add a village first, then add houses</p>
                </div>
            `;
        } else {
            html += '<div class="table-container"><table><thead><tr>';
            html += '<th>House #</th><th>Village</th><th>Head</th><th>Members</th><th>Caste</th><th>Actions</th>';
            html += '</tr></thead><tbody>';

            for (const house of houses) {
                const village = await db.getVillage(house.villageId);
                const members = await db.getMembersByHouse(house.id);

                html += `
                    <tr>
                        <td>${house.houseNumber}</td>
                        <td>${village.name}</td>
                        <td>${house.headName}</td>
                        <td>${members.length}</td>
                        <td>${house.casteCategory}</td>
                        <td>
                            <button class="btn btn-small btn-secondary" onclick="app.showEditHouseModal(${house.id})">Edit</button>
                            <button class="btn btn-small btn-primary" onclick="app.loadHouseDetails(${house.id})">Members</button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteHouse(${house.id})">Delete</button>
                        </td>
                    </tr>
                `;
            }

            html += '</tbody></table></div>';
        }

        container.innerHTML = html;

        // Add filter listener
        document.getElementById('villageFilterSelect').addEventListener('change', async (e) => {
            const villageId = e.target.value;
            if (villageId) {
                const filtered = houses.filter(h => h.villageId == villageId);
                this.selectedVillageFilter = villageId;
            } else {
                this.selectedVillageFilter = null;
            }
            this.loadHouses();
        });
    }

    // Show add/edit house modal
    async showAddHouseModal(villageId) {
        const villages = await db.getVillages();
        const modal = document.getElementById('houseModal');

        document.getElementById('houseModalTitle').textContent = 'Add House';
        document.getElementById('houseForm').reset();
        document.getElementById('houseId').value = '';

        // Populate village select
        let villageOptions = '<option value="">Select Village</option>';
        for (const village of villages) {
            const selected = villageId === village.id ? 'selected' : '';
            villageOptions += `<option value="${village.id}" ${selected}>${village.name}</option>`;
        }
        document.getElementById('houseVillage').innerHTML = villageOptions;

        modal.classList.add('show');
    }

    // Show edit house modal
    async showEditHouseModal(houseId) {
        const house = await db.getHouse(houseId);
        const villages = await db.getVillages();
        const modal = document.getElementById('houseModal');

        document.getElementById('houseModalTitle').textContent = 'Edit House';
        document.getElementById('houseNumber').value = house.houseNumber;
        document.getElementById('houseHeadName').value = house.headName;
        document.getElementById('houseHeadMobile').value = house.headMobile || '';
        document.getElementById('houseCaste').value = house.casteCategory;
        document.getElementById('houseType').value = house.houseType;
        document.getElementById('houseToilet').checked = house.toilet;
        document.getElementById('houseDrinkingWater').value = house.drinkingWater;
        document.getElementById('houseElectricity').checked = house.electricity;
        document.getElementById('houseNotes').value = house.notes || '';
        document.getElementById('houseId').value = houseId;

        // Populate village select
        let villageOptions = '<option value="">Select Village</option>';
        for (const village of villages) {
            const selected = house.villageId === village.id ? 'selected' : '';
            villageOptions += `<option value="${village.id}" ${selected}>${village.name}</option>`;
        }
        document.getElementById('houseVillage').innerHTML = villageOptions;

        modal.classList.add('show');
    }

    // Save house
    async saveHouse(e) {
        e.preventDefault();
        const houseId = document.getElementById('houseId').value;
        const villageId = document.getElementById('houseVillage').value;
        const houseNumber = document.getElementById('houseNumber').value;
        const headName = document.getElementById('houseHeadName').value;

        if (!villageId || !houseNumber || !headName) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const houseData = {
                villageId: parseInt(villageId),
                houseNumber: parseInt(houseNumber),
                headName,
                headMobile: document.getElementById('houseHeadMobile').value,
                casteCategory: document.getElementById('houseCaste').value,
                houseType: document.getElementById('houseType').value,
                toilet: document.getElementById('houseToilet').checked,
                drinkingWater: document.getElementById('houseDrinkingWater').value,
                electricity: document.getElementById('houseElectricity').checked,
                notes: document.getElementById('houseNotes').value
            };

            if (houseId) {
                await db.updateHouse(parseInt(houseId), houseData);
            } else {
                await db.addHouse(houseData);
            }

            document.getElementById('houseModal').classList.remove('show');
            this.loadHouses();
            this.showNotification('House saved successfully', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Delete house
    async deleteHouse(houseId) {
        if (!confirm('Are you sure you want to delete this house and all members?')) {
            return;
        }

        try {
            await db.deleteHouse(houseId);
            const currentContainer = document.getElementById('housesContainer');
            if (currentContainer && currentContainer.innerHTML.includes('House Details')) {
                await this.loadHouses();
            } else {
                await this.loadHouses();
            }
            this.showNotification('House deleted successfully', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Load house details with members
    async loadHouseDetails(houseId) {
        const house = await db.getHouse(houseId);
        const village = await db.getVillage(house.villageId);
        const members = await db.getMembersByHouse(houseId);

        let html = `
            <button class="btn btn-secondary" onclick="app.loadHouses()" style="margin-bottom: 20px;">
                ← Back to Houses
            </button>

            <div class="form-container">
                <h2>Family #${house.houseNumber} - ${village.name}</h2>
                <p style="color: var(--gray); margin-bottom: 15px;">Family ID: ${house.familyId}</p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div>
                        <strong>Head Name:</strong> ${house.headName}
                    </div>
                    <div>
                        <strong>Mobile:</strong> ${house.headMobile || 'N/A'}
                    </div>
                    <div>
                        <strong>Caste:</strong> ${house.casteCategory}
                    </div>
                    <div>
                        <strong>House Type:</strong> ${house.houseType}
                    </div>
                    <div>
                        <strong>Toilet:</strong> ${house.toilet ? 'Yes' : 'No'}
                    </div>
                    <div>
                        <strong>Electricity:</strong> ${house.electricity ? 'Yes' : 'No'}
                    </div>
                </div>

                <button class="btn btn-primary" onclick="app.showAddMemberModal(${houseId})">
                    ➕ Add Member
                </button>
            </div>

            <div class="table-container" style="margin-top: 20px;">
                <h3 class="table-title">Family Members (${members.length})</h3>
        `;

        if (members.length === 0) {
            html += `
                <div class="empty-state" style="padding: 30px;">
                    <p>No members added yet</p>
                </div>
            `;
        } else {
            html += `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Occupation</th>
                            <th>Voter ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            for (const member of members) {
                const aadhaarData = await db.getAadhaarImage(member.id);
                html += `
                    <tr>
                        <td>${member.fullName}</td>
                        <td>${member.age}</td>
                        <td>${member.gender}</td>
                        <td>${member.occupation || '-'}</td>
                        <td>${member.voterId ? '✓' : '-'}</td>
                        <td>
                            <button class="btn btn-small btn-secondary" onclick="app.showEditMemberModal(${member.id})">Edit</button>
                            <button class="btn btn-small btn-primary" onclick="app.showMemberDetails(${member.id})">View</button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteMember(${member.id})">Delete</button>
                        </td>
                    </tr>
                `;
            }

            html += `
                    </tbody>
                </table>
            `;
        }

        html += '</div>';

        document.getElementById('housesContainer').innerHTML = html;
    }

    // Members Page
    async loadMembers() {
        const members = await db.getMembers();
        const houses = await db.getHouses();
        const villages = await db.getVillages();
        const container = document.getElementById('membersContainer');

        let html = `<button class="btn btn-primary" onclick="app.loadHouses()" style="margin-bottom: 20px;">
            Manage Houses
        </button>`;

        if (members.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div class="empty-title">No Members Yet</div>
                    <p class="empty-text">Add members by opening a house and clicking "Add Member"</p>
                </div>
            `;
        } else {
            html += `<div class="table-container"><table><thead><tr>`;
            html += '<th>Name</th><th>Age</th><th>Gender</th><th>House</th><th>Village</th><th>Voter ID</th><th>Actions</th>';
            html += '</tr></thead><tbody>';

            for (const member of members) {
                const house = houses.find(h => h.id === member.houseId);
                const village = house ? villages.find(v => v.id === house.villageId) : null;

                html += `
                    <tr>
                        <td>${member.fullName}</td>
                        <td>${member.age}</td>
                        <td>${member.gender}</td>
                        <td>${house ? `#${house.houseNumber}` : 'N/A'}</td>
                        <td>${village ? village.name : 'N/A'}</td>
                        <td>${member.voterId ? '✓' : '✗'}</td>
                        <td>
                            <button class="btn btn-small btn-secondary" onclick="app.showEditMemberModal(${member.id})">Edit</button>
                            <button class="btn btn-small btn-primary" onclick="app.showMemberDetails(${member.id})">View</button>
                            <button class="btn btn-small btn-danger" onclick="app.deleteMember(${member.id})">Delete</button>
                        </td>
                    </tr>
                `;
            }

            html += '</tbody></table></div>';
        }

        container.innerHTML = html;
    }

    // Show member details modal
    async showMemberDetails(memberId) {
        const member = await db.getMember(memberId);
        const house = await db.getHouse(member.houseId);
        const village = await db.getVillage(house.villageId);
        const aadhaarData = await db.getAadhaarImage(memberId);

        const modal = document.getElementById('memberDetailsModal');
        if (!modal) return;

        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div><strong>Full Name:</strong><br>${member.fullName}</div>
                <div><strong>Father/Husband:</strong><br>${member.fatherName}</div>
                <div><strong>Date of Birth:</strong><br>${member.dob}</div>
                <div><strong>Age:</strong><br>${member.age} years</div>
                <div><strong>Gender:</strong><br>${member.gender}</div>
                <div><strong>Marital Status:</strong><br>${member.maritalStatus}</div>
                <div><strong>Education:</strong><br>${member.education}</div>
                <div><strong>Occupation:</strong><br>${member.occupation || 'N/A'}</div>
                <div><strong>Mobile:</strong><br>${member.mobile || 'N/A'}</div>
                <div><strong>Disability:</strong><br>${member.disability ? 'Yes' : 'No'}</div>
                <div><strong>Caste:</strong><br>${member.caste}</div>
                <div><strong>Voter ID:</strong><br>${member.voterId ? 'Yes' : 'No'}</div>
                <div><strong>Family:</strong><br>${house.houseNumber}, ${village.name}</div>
                <div><strong>Family ID:</strong><br>${member.familyId}</div>
            </div>
        `;

        if (aadhaarData) {
            html += `
                <div style="margin-top: 20px;">
                    <strong>Aadhaar:</strong><br>
                    Verified: Yes<br>
                    Last 4 Digits: ${member.aadhaarLast4}<br>
                    <img src="${aadhaarData.imageData}" style="max-width: 200px; margin-top: 10px; border-radius: 6px;">
                </div>
            `;
        }

        document.getElementById('memberDetailsContent').innerHTML = html;
        modal.classList.add('show');
    }

    // Show add member modal
    async showAddMemberModal(houseId) {
        const modal = document.getElementById('memberModal');
        if (!modal) return;

        document.getElementById('memberModalTitle').textContent = 'Add Member';
        document.getElementById('memberForm').reset();
        document.getElementById('memberId').value = '';
        document.getElementById('memberHouseId').value = houseId || '';
        document.getElementById('memberAadhaarVerified').checked = false;
        this.toggleAadhaarFields();

        modal.classList.add('show');
    }

    // Show edit member modal
    async showEditMemberModal(memberId) {
        const member = await db.getMember(memberId);
        const modal = document.getElementById('memberModal');
        if (!modal) return;

        document.getElementById('memberModalTitle').textContent = 'Edit Member';
        document.getElementById('memberFullName').value = member.fullName;
        document.getElementById('memberFatherName').value = member.fatherName;
        document.getElementById('memberDOB').value = member.dob;
        document.getElementById('memberGender').value = member.gender;
        document.getElementById('memberMaritalStatus').value = member.maritalStatus;
        document.getElementById('memberEducation').value = member.education;
        document.getElementById('memberOccupation').value = member.occupation || '';
        document.getElementById('memberMobile').value = member.mobile || '';
        document.getElementById('memberDisability').checked = member.disability;
        document.getElementById('memberCaste').value = member.caste;
        document.getElementById('memberVoterId').checked = member.voterId;
        document.getElementById('memberNotes').value = member.notes || '';
        document.getElementById('memberId').value = memberId;
        document.getElementById('memberHouseId').value = member.houseId;
        document.getElementById('memberAadhaarVerified').checked = member.aadhaarVerified;
        document.getElementById('memberAadhaarLast4').value = member.aadhaarLast4 || '';

        this.toggleAadhaarFields();

        modal.classList.add('show');
    }

    // Toggle Aadhaar fields based on verified checkbox
    toggleAadhaarFields() {
        const verified = document.getElementById('memberAadhaarVerified').checked;
        document.getElementById('memberAadhaarLast4').disabled = !verified;
        document.getElementById('memberAadhaarLast4').style.opacity = verified ? '1' : '0.5';
    }

    // Save member
    async saveMember(e) {
        e.preventDefault();
        const memberId = document.getElementById('memberId').value;
        const houseId = document.getElementById('memberHouseId').value;
        const fullName = document.getElementById('memberFullName').value;
        const fatherName = document.getElementById('memberFatherName').value;
        const dob = document.getElementById('memberDOB').value;

        if (!houseId || !fullName || !fatherName || !dob) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const memberData = {
                houseId: parseInt(houseId),
                fullName,
                fatherName,
                dob,
                gender: document.getElementById('memberGender').value,
                maritalStatus: document.getElementById('memberMaritalStatus').value,
                education: document.getElementById('memberEducation').value,
                occupation: document.getElementById('memberOccupation').value,
                mobile: document.getElementById('memberMobile').value,
                disability: document.getElementById('memberDisability').checked,
                caste: document.getElementById('memberCaste').value,
                voterId: document.getElementById('memberVoterId').checked,
                aadhaarVerified: document.getElementById('memberAadhaarVerified').checked,
                aadhaarLast4: document.getElementById('memberAadhaarLast4').value,
                notes: document.getElementById('memberNotes').value
            };

            if (memberId) {
                await db.updateMember(parseInt(memberId), memberData);
            } else {
                await db.addMember(memberData);
            }

            document.getElementById('memberModal').classList.remove('show');
            this.loadMembers();
            this.showNotification('Member saved successfully', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Delete member
    async deleteMember(memberId) {
        if (!confirm('Are you sure you want to delete this member?')) {
            return;
        }

        try {
            await db.deleteMember(memberId);
            this.loadMembers();
            this.showNotification('Member deleted successfully', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Search Page
    async loadSearch() {
        const container = document.getElementById('searchContainer');
        container.innerHTML = `
            <div class="search-container">
                <input 
                    type="text" 
                    class="search-input" 
                    id="searchInput"
                    placeholder="Search by name, mobile, house number, caste, or family ID..."
                >
                <button class="btn btn-primary" onclick="app.performSearch()">Search</button>
                <button class="btn btn-secondary" onclick="app.clearSearch()">Clear</button>
            </div>

            <div id="searchResults"></div>
        `;
    }

    // Perform search
    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            alert('Please enter a search term');
            return;
        }

        const results = await db.searchMembers(query);
        const houses = await db.getHouses();
        const villages = await db.getVillages();
        const resultsDiv = document.getElementById('searchResults');

        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No Results Found</div>
                </div>
            `;
            return;
        }

        let html = `
            <div style="margin: 20px 0; color: var(--gray);">
                Found ${results.length} result(s)
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>House</th>
                            <th>Village</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const member of results) {
            const house = houses.find(h => h.id === member.houseId);
            const village = house ? villages.find(v => v.id === house.villageId) : null;

            html += `
                <tr>
                    <td>${member.fullName}</td>
                    <td>${member.age}</td>
                    <td>${member.gender}</td>
                    <td>${house ? `#${house.houseNumber}` : 'N/A'}</td>
                    <td>${village ? village.name : 'N/A'}</td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="app.showMemberDetails(${member.id})">View</button>
                        <button class="btn btn-small btn-secondary" onclick="pdfGenerator.generateMemberPDF(${member.id})">PDF</button>
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;
    }

    // Clear search
    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    // Gender Dashboard
    async loadGenderDashboard() {
        const members = await db.getMembers();
        const houses = await db.getHouses();
        const villages = await db.getVillages();

        const maleMembers = members.filter(m => m.gender === 'Male');
        const femaleMembers = members.filter(m => m.gender === 'Female');
        const otherMembers = members.filter(m => m.gender === 'Other');

        const container = document.getElementById('genderContainer');

        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-icon">👨</div>
                    <div class="stat-label">Males</div>
                    <div class="stat-value">${maleMembers.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👩</div>
                    <div class="stat-label">Females</div>
                    <div class="stat-value">${femaleMembers.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👤</div>
                    <div class="stat-label">Others</div>
                    <div class="stat-value">${otherMembers.length}</div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="app.showGenderList('Male')">View Males</button>
                <button class="btn btn-primary" onclick="app.showGenderList('Female')">View Females</button>
                <button class="btn btn-primary" onclick="app.showGenderList('Other')">View Others</button>
                <button class="btn btn-secondary" onclick="app.exportGenderData()">Export All</button>
            </div>

            <div id="genderListContainer"></div>
        `;

        container.innerHTML = html;
    }

    // Show gender-specific list
    async showGenderList(gender) {
        const members = await db.getMembers().then(all => 
            all.filter(m => m.gender === gender)
        );
        const houses = await db.getHouses();
        const villages = await db.getVillages();

        let html = `
            <div class="table-container">
                <h3 class="table-title">${gender} Members (${members.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>House</th>
                            <th>Village</th>
                            <th>Caste</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const member of members) {
            const house = houses.find(h => h.id === member.houseId);
            const village = house ? villages.find(v => v.id === house.villageId) : null;

            html += `
                <tr>
                    <td>${member.fullName}</td>
                    <td>${member.age}</td>
                    <td>${house ? `#${house.houseNumber}` : 'N/A'}</td>
                    <td>${village ? village.name : 'N/A'}</td>
                    <td>${member.caste}</td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="app.showMemberDetails(${member.id})">View</button>
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';

        document.getElementById('genderListContainer').innerHTML = html;
    }

    // Export gender data
    async exportGenderData() {
        const members = await db.getMembers();
        const data = {
            males: members.filter(m => m.gender === 'Male').length,
            females: members.filter(m => m.gender === 'Female').length,
            others: members.filter(m => m.gender === 'Other').length,
            total: members.length
        };

        const csv = `Gender,Count\nMale,${data.males}\nFemale,${data.females}\nOther,${data.others}\nTotal,${data.total}`;
        this.downloadCSV(csv, 'gender_report.csv');
    }

    // Filter Page
    async loadFilter() {
        const container = document.getElementById('filterContainer');
        const villages = await db.getVillages();

        let html = `
            <div class="form-container">
                <h2>Advanced Filter</h2>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Age Range (Min)</label>
                        <input type="number" id="filterAgeMin" min="1" max="100" value="1">
                    </div>
                    <div class="form-group">
                        <label>Age Range (Max)</label>
                        <input type="number" id="filterAgeMax" min="1" max="100" value="100">
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select id="filterGender">
                            <option value="">All</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Caste</label>
                        <select id="filterCaste">
                            <option value="">All</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="OBC">OBC</option>
                            <option value="General">General</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Education</label>
                        <select id="filterEducation">
                            <option value="">All</option>
                            <option value="Illiterate">Illiterate</option>
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                            <option value="Higher Secondary">Higher Secondary</option>
                            <option value="Graduate">Graduate</option>
                            <option value="Postgraduate">Postgraduate</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Occupation</label>
                        <input type="text" id="filterOccupation" placeholder="Search occupation...">
                    </div>
                    <div class="form-group">
                        <label>Disability</label>
                        <select id="filterDisability">
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Voter Status</label>
                        <select id="filterVoterId">
                            <option value="">All</option>
                            <option value="true">Has Voter ID</option>
                            <option value="false">No Voter ID</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Village</label>
                        <select id="filterVillage">
                            <option value="">All</option>
        `;

        for (const village of villages) {
            html += `<option value="${village.id}">${village.name}</option>`;
        }

        html += `
                        </select>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="app.applyFilter()">Apply Filter</button>
                    <button class="btn btn-secondary" onclick="app.resetFilter()">Reset</button>
                </div>
            </div>

            <div id="filterResults"></div>
        `;

        container.innerHTML = html;
    }

    // Apply filter
    async applyFilter() {
        const criteria = {
            ageMin: parseInt(document.getElementById('filterAgeMin').value),
            ageMax: parseInt(document.getElementById('filterAgeMax').value),
            gender: document.getElementById('filterGender').value || undefined,
            caste: document.getElementById('filterCaste').value || undefined,
            education: document.getElementById('filterEducation').value || undefined,
            occupation: document.getElementById('filterOccupation').value || undefined,
            disability: document.getElementById('filterDisability').value ? document.getElementById('filterDisability').value === 'true' : undefined,
            voterId: document.getElementById('filterVoterId').value ? document.getElementById('filterVoterId').value === 'true' : undefined,
            village: document.getElementById('filterVillage').value || undefined
        };

        const filtered = await db.filterMembers(criteria);
        const houses = await db.getHouses();
        const villages = await db.getVillages();

        const resultsDiv = document.getElementById('filterResults');

        if (filtered.length === 0) {
            resultsDiv.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-title">No Results</div>
                    <p class="empty-text">Try adjusting your filter criteria</p>
                </div>
            `;
            return;
        }

        let html = `
            <div style="display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap;">
                <div style="color: var(--gray); padding: 10px;">
                    Found ${filtered.length} result(s)
                </div>
                <button class="btn btn-secondary" onclick="pdfGenerator.generateFilteredPDF(${JSON.stringify(filtered).replace(/"/g, '&quot;')}, 'Filtered Results')">
                    📄 Export PDF
                </button>
                <button class="btn btn-secondary" onclick="app.exportFilteredCSV(${JSON.stringify(filtered).replace(/"/g, '&quot;')})">
                    📋 Export CSV
                </button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Caste</th>
                            <th>Education</th>
                            <th>House</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const member of filtered) {
            const house = houses.find(h => h.id === member.houseId);
            const village = house ? villages.find(v => v.id === house.villageId) : null;

            html += `
                <tr>
                    <td>${member.fullName}</td>
                    <td>${member.age}</td>
                    <td>${member.gender}</td>
                    <td>${member.caste}</td>
                    <td>${member.education}</td>
                    <td>${house ? `${village.name} #${house.houseNumber}` : 'N/A'}</td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="app.showMemberDetails(${member.id})">View</button>
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
        resultsDiv.innerHTML = html;
    }

    // Reset filter
    resetFilter() {
        document.getElementById('filterAgeMin').value = '1';
        document.getElementById('filterAgeMax').value = '100';
        document.getElementById('filterGender').value = '';
        document.getElementById('filterCaste').value = '';
        document.getElementById('filterEducation').value = '';
        document.getElementById('filterOccupation').value = '';
        document.getElementById('filterDisability').value = '';
        document.getElementById('filterVoterId').value = '';
        document.getElementById('filterVillage').value = '';
        document.getElementById('filterResults').innerHTML = '';
    }

    // Export filtered CSV
    exportFilteredCSV(members) {
        let csv = 'Name,Age,Gender,Caste,Education,Occupation,Mobile,Voter ID,Disability\n';
        
        members.forEach(member => {
            csv += `"${member.fullName}",${member.age},${member.gender},${member.caste},${member.education},${member.occupation || ''},${member.mobile || ''},${member.voterId ? 'Yes' : 'No'},${member.disability ? 'Yes' : 'No'}\n`;
        });

        this.downloadCSV(csv, 'filtered_results.csv');
    }

    // Settings Page
    async loadSettings() {
        const container = document.getElementById('settingsContainer');

        const currentAge = await db.getSetting('voterEligibilityAge') || 18;

        let html = `
            <div class="form-container">
                <h2>Settings</h2>

                <div style="margin-bottom: 30px;">
                    <h3>Voter Eligibility Age</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Members at or above this age without a Voter ID will be marked as "New Voter Required"
                    </p>
                    <div class="form-group" style="max-width: 200px;">
                        <label>Age (1-100)</label>
                        <input type="number" id="voterAge" min="1" max="100" value="${currentAge}">
                    </div>
                    <button class="btn btn-primary" onclick="app.saveVoterAge()">Save Setting</button>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid var(--border-light-mode);">

                <div style="margin-bottom: 30px;">
                    <h3>Data Management</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Backup and restore your survey data
                    </p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="app.exportBackup()">
                            📥 Export Backup
                        </button>
                        <button class="btn btn-secondary" onclick="document.getElementById('importInput').click()">
                            📤 Import Backup
                        </button>
                        <input type="file" id="importInput" style="display: none;" accept=".json" onchange="app.importBackup(event)">
                    </div>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid var(--border-light-mode);">

                <div style="margin-bottom: 30px;">
                    <h3>Change Password</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Update your login password
                    </p>
                    <div class="form-grid">
                        <div class="form-group" style="max-width: 300px;">
                            <label>Current Password</label>
                            <input type="password" id="currentPassword" placeholder="Enter current password">
                        </div>
                        <div class="form-group" style="max-width: 300px;">
                            <label>New Password</label>
                            <input type="password" id="newPassword" placeholder="Enter new password">
                        </div>
                        <div class="form-group" style="max-width: 300px;">
                            <label>Confirm New Password</label>
                            <input type="password" id="confirmPassword" placeholder="Confirm new password">
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="app.changePassword()">Update Password</button>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid var(--border-light-mode);">

                <div style="margin-bottom: 30px;">
                    <h3 style="color: var(--danger);">Danger Zone</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Permanently delete all data. This action cannot be undone.
                    </p>
                    <button class="btn btn-danger" onclick="app.showDeleteAllModal()">
                        🗑️ Delete All Data
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Save voter age
    async saveVoterAge() {
        const age = parseInt(document.getElementById('voterAge').value);
        if (age < 1 || age > 100) {
            alert('Please enter a valid age (1-100)');
            return;
        }

        await db.setSetting('voterEligibilityAge', age);
        this.voterEligibilityAge = age;
        this.showNotification('Setting saved successfully', 'success');
    }

    // Export backup
    async exportBackup() {
        const data = await db.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Backup exported successfully', 'success');
    }

    // Import backup
    async importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!confirm('This will replace all existing data. Continue?')) {
                    return;
                }

                const result = await db.importData(data);
                if (result.success) {
                    this.showNotification('Data imported successfully', 'success');
                    this.loadDashboard();
                } else {
                    this.showNotification(result.message, 'error');
                }
            } catch (error) {
                this.showNotification('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Change password
    async changePassword() {
        const currentPwd = document.getElementById('currentPassword').value;
        const newPwd = document.getElementById('newPassword').value;
        const confirmPwd = document.getElementById('confirmPassword').value;

        if (!currentPwd || !newPwd || !confirmPwd) {
            this.showNotification('Please fill in all password fields', 'error');
            return;
        }

        if (newPwd !== confirmPwd) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        const result = await authSystem.changePassword(currentPwd, newPwd);
        if (result.success) {
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            this.showNotification('Password changed successfully', 'success');
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Show delete all data modal
    showDeleteAllModal() {
        const modal = document.getElementById('deleteAllModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Theme toggle
    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('vfs_darkMode', this.darkMode.toString());
        this.setupTheme();
    }

    // Setup theme
    setupTheme() {
        if (this.darkMode) {
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.body.classList.remove('dark-mode');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} show`;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '3000';
        notification.style.maxWidth = '400px';
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // Download CSV
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            authSystem.logout();
            window.location.href = 'login.html';
        }
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new VillageApp();
    await app.init();
});
