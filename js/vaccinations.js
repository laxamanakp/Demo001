// ============================================================
// My Hub Cares - Vaccination Program Management
// ============================================================

const Vaccinations = {
    // Load vaccinations page
    loadVaccinationsPage(container) {
        const currentUser = Auth.getCurrentUser();
        const isPatient = currentUser.role === 'patient';
        
        let html = `
            <div class="page-header">
                <h2>💉 Vaccination Program</h2>
                ${!isPatient ? '<button class="btn btn-primary" onclick="Vaccinations.showAddVaccinationModal()">Record Vaccination</button>' : ''}
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${isPatient ? 'My Vaccination History' : 'Patient Vaccinations'}</h3>
                    <div class="search-container">
                        <input type="text" id="vaccinationSearch" placeholder="Search patients or vaccines..." class="search-input" onkeyup="Vaccinations.filterVaccinations()">
                    </div>
                </div>
                <div class="card-body">
                    <div id="vaccinationsList">
                        ${this.renderVaccinationsList(isPatient)}
                    </div>
                </div>
            </div>

            ${isPatient ? this.renderUpcomingVaccinations() : ''}
        `;

        container.innerHTML = html;
    },

    renderVaccinationsList(isPatient = false) {
        const vaccinations = JSON.parse(localStorage.getItem('vaccinations')) || [];
        const patients = JSON.parse(localStorage.getItem('patients')) || [];
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const currentUser = Auth.getCurrentUser();

        let filteredVaccinations = vaccinations;
        if (isPatient) {
            filteredVaccinations = vaccinations.filter(v => v.patientId === currentUser.patientId);
        }

        // Sort by date (newest first)
        filteredVaccinations.sort((a, b) => new Date(b.dateGiven) - new Date(a.dateGiven));

        if (filteredVaccinations.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">💉</div>
                    <p>No vaccination records found</p>
                    ${!isPatient ? '<button class="btn btn-primary" onclick="Vaccinations.showAddVaccinationModal()">Record First Vaccination</button>' : ''}
                </div>
            `;
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        ${!isPatient ? '<th>Patient</th>' : ''}
                        <th>Vaccine</th>
                        <th>Dose</th>
                        <th>Date Given</th>
                        <th>Next Dose Due</th>
                        <th>Administered By</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredVaccinations.map(vacc => {
                        const patient = patients.find(p => p.id === vacc.patientId);
                        const provider = users.find(u => u.id === vacc.providerId);
                        const status = this.getVaccinationStatus(vacc);
                        
                        return `
                            <tr>
                                ${!isPatient ? `<td>${patient ? patient.firstName + ' ' + patient.lastName : 'Unknown'}</td>` : ''}
                                <td>
                                    <strong>${vacc.vaccineName}</strong><br>
                                    <small class="text-muted">${vacc.manufacturer || 'N/A'}</small>
                                </td>
                                <td>
                                    <span class="badge badge-info">Dose ${vacc.doseNumber}/${vacc.totalDoses}</span>
                                </td>
                                <td>${new Date(vacc.dateGiven).toLocaleDateString()}</td>
                                <td>
                                    ${vacc.nextDoseDate ? 
                                        `<span class="${this.isDueOrOverdue(vacc.nextDoseDate) ? 'text-danger' : 'text-muted'}">
                                            ${new Date(vacc.nextDoseDate).toLocaleDateString()}
                                        </span>` : 
                                        '<span class="text-muted">N/A</span>'}
                                </td>
                                <td>${provider ? provider.fullName : 'Unknown'}</td>
                                <td>
                                    <span class="badge badge-${status.class}">${status.label}</span>
                                </td>
                                <td class="action-buttons">
                                    <button class="btn-icon" onclick="Vaccinations.viewVaccinationDetails(${vacc.id})" title="View Details">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                    ${!isPatient ? `
                                        <button class="btn-icon" onclick="Vaccinations.showEditVaccinationModal(${vacc.id})" title="Edit">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="btn-icon btn-danger" onclick="Vaccinations.deleteVaccination(${vacc.id})" title="Delete">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    renderUpcomingVaccinations() {
        const vaccinations = JSON.parse(localStorage.getItem('vaccinations')) || [];
        const currentUser = Auth.getCurrentUser();
        
        const upcoming = vaccinations.filter(v => 
            v.patientId === currentUser.patientId && 
            v.nextDoseDate && 
            new Date(v.nextDoseDate) > new Date()
        ).sort((a, b) => new Date(a.nextDoseDate) - new Date(b.nextDoseDate));

        if (upcoming.length === 0) return '';

        return `
            <div class="card" style="margin-top: 20px;">
                <div class="card-header">
                    <h3 class="card-title">📅 Upcoming Vaccinations</h3>
                </div>
                <div class="card-body">
                    ${upcoming.map(vacc => `
                        <div class="alert alert-info">
                            <strong>${vacc.vaccineName}</strong> - Dose ${vacc.doseNumber + 1}/${vacc.totalDoses}<br>
                            <small>Due: ${new Date(vacc.nextDoseDate).toLocaleDateString()}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    getVaccinationStatus(vaccination) {
        if (vaccination.doseNumber >= vaccination.totalDoses) {
            return { label: 'Complete', class: 'success' };
        }
        
        if (vaccination.nextDoseDate) {
            const daysUntil = Math.ceil((new Date(vaccination.nextDoseDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntil < 0) return { label: 'Overdue', class: 'danger' };
            if (daysUntil <= 7) return { label: 'Due Soon', class: 'warning' };
        }
        
        return { label: 'In Progress', class: 'primary' };
    },

    isDueOrOverdue(nextDoseDate) {
        const daysUntil = Math.ceil((new Date(nextDoseDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 7;
    },

    showAddVaccinationModal() {
        const patients = JSON.parse(localStorage.getItem('patients')) || [];
        const currentUser = Auth.getCurrentUser();

        const content = `
            <form id="vaccinationForm" onsubmit="Vaccinations.saveVaccination(event)">
                <div class="form-group">
                    <label>Patient <span class="required">*</span></label>
                    <select id="vaccinationPatient" required class="form-control">
                        <option value="">Select patient</option>
                        ${patients.map(p => `
                            <option value="${p.id}">${p.firstName} ${p.lastName} (${p.uic})</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Vaccine Type <span class="required">*</span></label>
                    <select id="vaccineName" required class="form-control" onchange="Vaccinations.updateVaccineInfo()">
                        <option value="">Select vaccine</option>
                        <option value="Hepatitis B">Hepatitis B</option>
                        <option value="Hepatitis A">Hepatitis A</option>
                        <option value="HPV (Human Papillomavirus)">HPV (Human Papillomavirus)</option>
                        <option value="Influenza">Influenza</option>
                        <option value="Pneumococcal">Pneumococcal</option>
                        <option value="Meningococcal">Meningococcal</option>
                        <option value="MMR (Measles, Mumps, Rubella)">MMR</option>
                        <option value="Tetanus/Diphtheria">Tetanus/Diphtheria</option>
                        <option value="COVID-19">COVID-19</option>
                        <option value="Other">Other (specify below)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Manufacturer</label>
                    <input type="text" id="manufacturer" class="form-control" placeholder="e.g., Pfizer, Moderna">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Dose Number <span class="required">*</span></label>
                        <input type="number" id="doseNumber" required class="form-control" min="1" value="1">
                    </div>
                    <div class="form-group">
                        <label>Total Doses <span class="required">*</span></label>
                        <input type="number" id="totalDoses" required class="form-control" min="1" value="1">
                    </div>
                </div>

                <div class="form-group">
                    <label>Date Given <span class="required">*</span></label>
                    <input type="date" id="dateGiven" required class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label>Next Dose Due Date</label>
                    <input type="date" id="nextDoseDate" class="form-control">
                    <small class="text-muted">Leave blank if this is the final dose</small>
                </div>

                <div class="form-group">
                    <label>Lot Number</label>
                    <input type="text" id="lotNumber" class="form-control" placeholder="Vaccine lot/batch number">
                </div>

                <div class="form-group">
                    <label>Administration Site</label>
                    <select id="administrationSite" class="form-control">
                        <option value="">Select site</option>
                        <option value="Left arm">Left arm (deltoid)</option>
                        <option value="Right arm">Right arm (deltoid)</option>
                        <option value="Left thigh">Left thigh</option>
                        <option value="Right thigh">Right thigh</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="vaccinationNotes" class="form-control" rows="3" placeholder="Any side effects, reactions, or special notes..."></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-block">💉 Record Vaccination</button>
            </form>
        `;

        const footer = `
            <button onclick="App.closeModal()" class="btn btn-secondary">Cancel</button>
        `;

        App.showModal('Record Vaccination', content, footer);
    },

    updateVaccineInfo() {
        const vaccineName = document.getElementById('vaccineName').value;
        const totalDosesInput = document.getElementById('totalDoses');
        
        // Set default doses based on vaccine type
        const vaccineDefaults = {
            'Hepatitis B': 3,
            'Hepatitis A': 2,
            'HPV (Human Papillomavirus)': 3,
            'Influenza': 1,
            'Pneumococcal': 1,
            'COVID-19': 2,
            'MMR (Measles, Mumps, Rubella)': 2,
            'Tetanus/Diphtheria': 1
        };

        if (vaccineDefaults[vaccineName]) {
            totalDosesInput.value = vaccineDefaults[vaccineName];
        }
    },

    saveVaccination(event) {
        event.preventDefault();

        const currentUser = Auth.getCurrentUser();
        const vaccinations = JSON.parse(localStorage.getItem('vaccinations')) || [];

        const newVaccination = {
            id: Date.now(),
            patientId: parseInt(document.getElementById('vaccinationPatient').value),
            vaccineName: document.getElementById('vaccineName').value,
            manufacturer: document.getElementById('manufacturer').value,
            doseNumber: parseInt(document.getElementById('doseNumber').value),
            totalDoses: parseInt(document.getElementById('totalDoses').value),
            dateGiven: document.getElementById('dateGiven').value,
            nextDoseDate: document.getElementById('nextDoseDate').value || null,
            lotNumber: document.getElementById('lotNumber').value,
            administrationSite: document.getElementById('administrationSite').value,
            notes: document.getElementById('vaccinationNotes').value,
            providerId: currentUser.id,
            recordedDate: new Date().toISOString()
        };

        vaccinations.push(newVaccination);
        localStorage.setItem('vaccinations', JSON.stringify(vaccinations));

        App.showSuccess('Vaccination record added successfully!');
        App.closeModal();
        App.loadPage('vaccinations');
    },

    viewVaccinationDetails(vaccinationId) {
        const vaccinations = JSON.parse(localStorage.getItem('vaccinations')) || [];
        const patients = JSON.parse(localStorage.getItem('patients')) || [];
        const users = JSON.parse(localStorage.getItem('users')) || [];

        const vaccination = vaccinations.find(v => v.id === vaccinationId);
        if (!vaccination) {
            App.showError('Vaccination record not found');
            return;
        }

        const patient = patients.find(p => p.id === vaccination.patientId);
        const provider = users.find(u => u.id === vaccination.providerId);
        const status = this.getVaccinationStatus(vaccination);

        const content = `
            <div class="detail-view">
                <div class="detail-section">
                    <h4>Patient Information</h4>
                    <p><strong>Name:</strong> ${patient ? patient.firstName + ' ' + patient.lastName : 'Unknown'}</p>
                    <p><strong>UIC:</strong> ${patient ? patient.uic : 'N/A'}</p>
                </div>

                <div class="detail-section">
                    <h4>Vaccine Details</h4>
                    <p><strong>Vaccine:</strong> ${vaccination.vaccineName}</p>
                    <p><strong>Manufacturer:</strong> ${vaccination.manufacturer || 'N/A'}</p>
                    <p><strong>Dose:</strong> ${vaccination.doseNumber} of ${vaccination.totalDoses}</p>
                    <p><strong>Lot Number:</strong> ${vaccination.lotNumber || 'N/A'}</p>
                    <p><strong>Administration Site:</strong> ${vaccination.administrationSite || 'N/A'}</p>
                </div>

                <div class="detail-section">
                    <h4>Dates</h4>
                    <p><strong>Date Given:</strong> ${new Date(vaccination.dateGiven).toLocaleDateString()}</p>
                    <p><strong>Next Dose Due:</strong> ${vaccination.nextDoseDate ? new Date(vaccination.nextDoseDate).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div class="detail-section">
                    <h4>Provider Information</h4>
                    <p><strong>Administered By:</strong> ${provider ? provider.fullName : 'Unknown'}</p>
                    <p><strong>Recorded Date:</strong> ${new Date(vaccination.recordedDate).toLocaleDateString()}</p>
                </div>

                <div class="detail-section">
                    <h4>Status</h4>
                    <p><span class="badge badge-${status.class}">${status.label}</span></p>
                </div>

                ${vaccination.notes ? `
                    <div class="detail-section">
                        <h4>Notes</h4>
                        <p>${vaccination.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        App.showModal('Vaccination Details', content, '');
    },

    showEditVaccinationModal(vaccinationId) {
        const vaccinations = JSON.parse(localStorage.getItem('vaccinations')) || [];
        const vaccination = vaccinations.find(v => v.id === vaccinationId);
        
        if (!vaccination) {
            App.showError('Vaccination record not found');
            return;
        }

        const patients = JSON.parse(localStorage.getItem('patients')) || [];
        const patient = patients.find(p => p.id === vaccination.patientId);

        const content = `
            <form id="editVaccinationForm" onsubmit="Vaccinations.updateVaccination(event, ${vaccinationId})">
                <div class="form-group">
                    <label>Patient</label>
                    <input type="text" class="form-control" value="${patient ? patient.firstName + ' ' + patient.lastName : 'Unknown'}" disabled>
                </div>

                <div class="form-group">
                    <label>Next Dose Due Date</label>
                    <input type="date" id="editNextDoseDate" class="form-control" value="${vaccination.nextDoseDate || ''}">
                </div>

                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="editNotes" class="form-control" rows="3">${vaccination.notes || ''}</textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Update Vaccination</button>
            </form>
        `;

        App.showModal('Edit Vaccination Record', content, '');
    },

    updateVaccination(event, vaccinationId) {
        event.preventDefault();

        const vaccinations = JSON.parse(localStorage.getItem('vaccinations')) || [];
        const index = vaccinations.findIndex(v => v.id === vaccinationId);

        if (index !== -1) {
            vaccinations[index].nextDoseDate = document.getElementById('editNextDoseDate').value || null;
            vaccinations[index].notes = document.getElementById('editNotes').value;

            localStorage.setItem('vaccinations', JSON.stringify(vaccinations));

            App.showSuccess('Vaccination record updated successfully!');
            App.closeModal();
            App.loadPage('vaccinations');
        }
    },

    deleteVaccination(vaccinationId) {
        if (!confirm('Are you sure you want to delete this vaccination record?')) return;

        const vaccinations = JSON.parse(localStorage.getItem('vaccinations')) || [];
        const filtered = vaccinations.filter(v => v.id !== vaccinationId);

        localStorage.setItem('vaccinations', JSON.stringify(filtered));

        App.showSuccess('Vaccination record deleted successfully!');
        App.loadPage('vaccinations');
    },

    filterVaccinations() {
        const searchTerm = document.getElementById('vaccinationSearch').value.toLowerCase();
        const rows = document.querySelectorAll('#vaccinationsList tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
};

