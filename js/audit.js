// ============================================================
// My Hub Cares - Audit Trail System
// ============================================================

const AuditTrail = {
    // Load audit trail page
    loadAuditPage(container) {
        const currentUser = Auth.getCurrentUser();
        const isAdmin = currentUser.role === 'admin';
        const pageTitle = isAdmin ? '📋 Audit Trail (All Users)' : '📋 My Activity Log';
        
        const html = `
            <div class="page-header">
                <h2>${pageTitle}</h2>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-outline" onclick="AuditTrail.exportAuditLog()">
                        📥 Export Log
                    </button>
                    ${isAdmin ? `
                        <button class="btn btn-outline" onclick="AuditTrail.clearOldLogs()">
                            🗑️ Clear Old Logs
                        </button>
                    ` : ''}
                </div>
            </div>

            ${!isAdmin ? `
                <div class="alert alert-info">
                    <strong>ℹ️ Your Activity Log</strong><br>
                    This shows your personal activity history for transparency and self-monitoring.
                </div>
            ` : ''}

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${isAdmin ? 'System Activity Log' : 'My Activity History'}</h3>
                    <div style="display: flex; gap: 12px;">
                        <select id="auditActionFilter" class="form-control" style="width: 180px;" onchange="AuditTrail.filterAudits()">
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="view">View</option>
                            <option value="export">Export</option>
                        </select>
                        <select id="auditModuleFilter" class="form-control" style="width: 180px;" onchange="AuditTrail.filterAudits()">
                            <option value="">All Modules</option>
                            <option value="patients">Patients</option>
                            <option value="appointments">Appointments</option>
                            <option value="prescriptions">Prescriptions</option>
                            <option value="inventory">Inventory</option>
                            <option value="vaccinations">Vaccinations</option>
                            <option value="reminders">Reminders</option>
                            <option value="surveys">Surveys</option>
                            <option value="forum">Forum</option>
                            ${isAdmin ? `
                                <option value="users">Users</option>
                                <option value="facilities">Facilities</option>
                            ` : ''}
                            <option value="system">System</option>
                            <option value="mobile-app">Mobile App</option>
                        </select>
                        <input type="date" id="auditDateFilter" class="form-control" style="width: 160px;" onchange="AuditTrail.filterAudits()">
                    </div>
                </div>
                <div class="card-body">
                    <div id="auditLogList">
                        ${this.renderAuditLogs(isAdmin)}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    renderAuditLogs(showAll = false) {
        const auditLogs = JSON.parse(localStorage.getItem('auditLogs')) || [];
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const currentUser = Auth.getCurrentUser();

        // Filter logs based on role
        let filteredLogs = auditLogs;
        if (!showAll) {
            // Non-admin users see only their own activities
            filteredLogs = auditLogs.filter(log => log.userId === currentUser.id);
        }

        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (filteredLogs.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>No audit logs found</p>
                    <small class="text-muted">${showAll ? 'System activities will be logged here' : 'Your activities will be logged here'}</small>
                </div>
            `;
        }

        return `
            <div class="audit-log-container" style="background: white; border-radius: 8px; padding: 20px;">
                ${filteredLogs.map(log => {
                    const user = users.find(u => u.id === log.userId);
                    const timestamp = new Date(log.timestamp);
                    const formattedLog = this.formatAuditLog(log, user);
                    
                    return `
                        <div class="audit-entry audit-row" 
                             data-action="${log.action}" 
                             data-module="${log.module}" 
                             data-date="${timestamp.toISOString().split('T')[0]}"
                             style="padding: 16px; margin-bottom: 12px; background: #f9fafb; border-left: 4px solid ${this.getActionColor(log.action)}; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.8;">
                            <div style="color: #1f2937;">
                                ${formattedLog}
                            </div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                <span class="badge badge-${this.getActionBadge(log.action)}" style="font-size: 10px; padding: 3px 8px;">
                                    ${this.getActionIcon(log.action)} ${log.action.toUpperCase()}
                                </span>
                                <span style="margin-left: 12px;">Status: ${log.status === 'success' ? '✓ Success' : '✗ Failed'}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Total Logs:</strong> ${filteredLogs.length} 
                        <span class="text-muted" id="filterStatus">| Showing all entries</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline" onclick="AuditTrail.refreshLogs()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    formatAuditLog(log, user) {
        const timestamp = new Date(log.timestamp);
        const formattedTime = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;
        const userName = user ? user.fullName : 'Unknown User';
        const userRole = user ? user.role.toUpperCase() : 'UNKNOWN';
        const action = log.action.toUpperCase();
        const module = log.module.toUpperCase();
        const recordId = log.recordId ? ` #${log.recordId}` : '';
        
        // Build the formatted log string
        let logString = `[${formattedTime}] - <strong>${userName}</strong> (<span style="color: #2563eb;">${userRole}</span>) performed <strong>${action}</strong> on <strong>${module}${recordId}</strong>.`;
        
        // Add old value → new value if applicable
        if (log.oldValue && log.newValue) {
            logString += ` <span style="color: #dc2626;">${log.oldValue}</span> → <span style="color: #10b981;">${log.newValue}</span>.`;
        } else if (log.details) {
            logString += ` ${log.details}.`;
        }
        
        // Add IP Address/Device
        if (log.ipAddress) {
            logString += ` <span style="color: #6b7280;">[IP: ${log.ipAddress}]</span>`;
        }
        
        if (log.device) {
            logString += ` <span style="color: #6b7280;">[Device: ${log.device}]</span>`;
        }
        
        // Add remarks/notes if applicable
        if (log.remarks) {
            logString += ` <em style="color: #f59e0b;">[${log.remarks}]</em>`;
        }
        
        return logString;
    },

    getActionColor(action) {
        const colors = {
            create: '#10b981',
            update: '#3b82f6',
            delete: '#ef4444',
            login: '#8b5cf6',
            logout: '#6b7280',
            view: '#06b6d4',
            export: '#f59e0b'
        };
        return colors[action] || '#6b7280';
    },

    getActionBadge(action) {
        const badges = {
            create: 'success',
            update: 'info',
            delete: 'danger',
            login: 'primary',
            logout: 'secondary',
            view: 'light',
            export: 'warning'
        };
        return badges[action] || 'secondary';
    },

    getActionIcon(action) {
        const icons = {
            create: '➕',
            update: '✏️',
            delete: '🗑️',
            login: '🔓',
            logout: '🔒',
            view: '👁️',
            export: '📥'
        };
        return icons[action] || '📝';
    },

    filterAudits() {
        const actionFilter = document.getElementById('auditActionFilter').value.toLowerCase();
        const moduleFilter = document.getElementById('auditModuleFilter').value.toLowerCase();
        const dateFilter = document.getElementById('auditDateFilter').value;

        const rows = document.querySelectorAll('.audit-row');

        rows.forEach(row => {
            const action = row.dataset.action;
            const module = row.dataset.module;
            const date = row.dataset.date;

            let show = true;

            if (actionFilter && action !== actionFilter) show = false;
            if (moduleFilter && module.toLowerCase() !== moduleFilter) show = false;
            if (dateFilter && date !== dateFilter) show = false;

            row.style.display = show ? '' : 'none';
        });

        // Update count
        const visibleRows = Array.from(rows).filter(r => r.style.display !== 'none').length;
        const totalRows = rows.length;
        
        const countText = visibleRows === totalRows ? 
            `Showing all ${totalRows} entries` : 
            `Showing ${visibleRows} of ${totalRows} entries`;
        
        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
            filterStatus.textContent = `| ${countText}`;
        }
    },

    refreshLogs() {
        App.loadPage('audit');
    },

    exportAuditLog() {
        const auditLogs = JSON.parse(localStorage.getItem('auditLogs')) || [];
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Create CSV content
        let csv = 'Timestamp,User,Role,Action,Module,Details,IP Address,Status\n';
        
        auditLogs.forEach(log => {
            const user = users.find(u => u.id === log.userId);
            const timestamp = new Date(log.timestamp).toLocaleString();
            
            csv += `"${timestamp}","${user ? user.fullName : 'Unknown'}","${user ? user.role : 'N/A'}","${log.action}","${log.module}","${log.details}","${log.ipAddress || 'N/A'}","${log.status}"\n`;
        });

        // Create download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        // Log the export
        this.logActivity('export', 'audit', 'Exported audit trail to CSV');

        App.showSuccess('Audit trail exported successfully!');
    },

    clearOldLogs() {
        const confirmDelete = confirm('Are you sure you want to clear logs older than 90 days?\n\nThis action cannot be undone.');
        
        if (!confirmDelete) return;

        const auditLogs = JSON.parse(localStorage.getItem('auditLogs')) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        const filtered = auditLogs.filter(log => new Date(log.timestamp) > cutoffDate);
        const removed = auditLogs.length - filtered.length;

        localStorage.setItem('auditLogs', JSON.stringify(filtered));

        // Log the cleanup
        this.logActivity('delete', 'audit', `Cleared ${removed} old audit logs`);

        App.showSuccess(`${removed} old log entries cleared successfully!`);
        this.refreshLogs();
    },

    // Core audit logging function
    logActivity(action, module, details, recordId = null, status = 'success', oldValue = null, newValue = null, remarks = null) {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        const auditLogs = JSON.parse(localStorage.getItem('auditLogs')) || [];

        // Detect device type
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const device = isMobile ? 'Mobile' : 'Desktop';

        const newLog = {
            id: Date.now(),
            userId: currentUser.id,
            action: action, // create, update, delete, login, logout, view, export
            module: module, // patients, appointments, prescriptions, etc.
            details: details,
            recordId: recordId,
            oldValue: oldValue, // For updates: previous value
            newValue: newValue, // For updates: new value
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1', // Simulated - would be real IP in production
            device: device,
            userAgent: navigator.userAgent,
            remarks: remarks,
            status: status // success, failed
        };

        auditLogs.push(newLog);
        
        // Keep only last 1000 logs
        if (auditLogs.length > 1000) {
            auditLogs.shift();
        }

        localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
    }
};

// Global audit logging helper
window.logAudit = function(action, module, details, recordId = null, status = 'success', oldValue = null, newValue = null, remarks = null) {
    if (typeof AuditTrail !== 'undefined' && AuditTrail.logActivity) {
        AuditTrail.logActivity(action, module, details, recordId, status, oldValue, newValue, remarks);
    }
};

