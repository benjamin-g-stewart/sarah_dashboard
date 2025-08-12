// Dashboard Data Management
class HomelessServicesDashboard {
    constructor() {
        this.data = [];
        this.currentSite = 'all';
        this.charts = {};
        this.organizationAverages = {};
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.calculateOrganizationAverages();
        this.setupEventListeners();
        this.populateSiteSelector();
        this.updateDashboard();
    }

    async loadData() {
        try {
            const response = await fetch('homeless_program_data_new.csv');
            const csvText = await response.text();
            this.data = this.parseCSV(csvText);
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to embedded data if CSV fails
            this.data = this.getFallbackData();
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        
        // Use a regex-based approach for better CSV parsing
        const parseCSVRow = (row) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                const nextChar = row[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Handle escaped quotes
                        current += '"';
                        i++; // Skip next quote
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current);
            return result;
        };
        
        const headers = parseCSVRow(lines[0]);
        console.log('CSV Headers:', headers);
        console.log('Number of headers:', headers.length);
        
        return lines.slice(1).map(line => {
            const values = parseCSVRow(line);
            const row = {};
            
            headers.forEach((header, index) => {
                const value = values[index] || '';
                // Convert numeric fields
                if (['site_id', 'total_clients', 'avg_length_of_stay_days', 'permanent_housing_exits',
                     'temporary_housing_exits', 'unknown_exits', 'avg_days_in_shelter',
                     'clients_without_case_plans', 'total_bed_capacity', 'occupancy_rate',
                     'new_admissions_month', 'successful_exits_month'].includes(header)) {
                    row[header] = parseFloat(value);
                } else if (header === 'case_managers_without_plans') {
                    console.log('Found case_managers_without_plans column, value:', value);
                    // Parse case manager data
                    row[header] = this.parseCaseManagerData(value);
                } else {
                    row[header] = value;
                }
            });
            
            return row;
        });
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                // Remove quotes from the field value
                let field = current.trim();
                if (field.startsWith('"') && field.endsWith('"')) {
                    field = field.slice(1, -1);
                }
                result.push(field);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Handle the last field
        let field = current.trim();
        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.slice(1, -1);
        }
        result.push(field);
        return result;
    }

    parseCaseManagerData(dataString) {
        console.log('Raw case manager data:', dataString);
        if (!dataString || dataString === '') {
            console.log('No case manager data found');
            return [];
        }
        
        // Remove quotes if present
        const cleanString = dataString.replace(/^"(.*)"$/, '$1');
        console.log('Clean case manager data:', cleanString);
        
        const result = cleanString.split('|').map(item => {
            const [name, count] = item.split(' - ');
            return {
                name: name.trim(),
                count: parseInt(count)
            };
        });
        
        console.log('Parsed case manager data:', result);
        return result;
    }

    getFallbackData() {
        // Fallback data in case CSV loading fails
        return [
            {site_id: 1, site_name: "Downtown Emergency Shelter", region: "San Francisco", total_clients: 145, avg_length_of_stay_days: 89, permanent_housing_exits: 12, temporary_housing_exits: 8, unknown_exits: 5, avg_days_in_shelter: 67, clients_without_case_plans: 23, total_bed_capacity: 150, occupancy_rate: 0.97, new_admissions_month: 18, successful_exits_month: 12},
            {site_id: 2, site_name: "Mission District Housing First", region: "San Francisco", total_clients: 78, avg_length_of_stay_days: 156, permanent_housing_exits: 15, temporary_housing_exits: 3, unknown_exits: 2, avg_days_in_shelter: 134, clients_without_case_plans: 8, total_bed_capacity: 80, occupancy_rate: 0.98, new_admissions_month: 9, successful_exits_month: 15}
        ];
    }

    calculateOrganizationAverages() {
        const totals = this.data.reduce((acc, site) => {
            acc.totalClients += site.total_clients;
            acc.totalLengthOfStay += site.avg_length_of_stay_days * site.total_clients;
            acc.totalPermanentExits += site.permanent_housing_exits;
            acc.totalExits += site.permanent_housing_exits + site.temporary_housing_exits + site.unknown_exits;
            acc.totalDaysInShelter += site.avg_days_in_shelter * site.total_clients;
            acc.totalWithoutCasePlans += site.clients_without_case_plans;
            acc.totalBedCapacity += site.total_bed_capacity;
            acc.totalOccupiedBeds += site.total_bed_capacity * site.occupancy_rate;
            acc.totalAdmissions += site.new_admissions_month;
            acc.totalSuccessfulExits += site.successful_exits_month;
            return acc;
        }, {
            totalClients: 0,
            totalLengthOfStay: 0,
            totalPermanentExits: 0,
            totalExits: 0,
            totalDaysInShelter: 0,
            totalWithoutCasePlans: 0,
            totalBedCapacity: 0,
            totalOccupiedBeds: 0,
            totalAdmissions: 0,
            totalSuccessfulExits: 0
        });

        this.organizationAverages = {
            avgLengthOfStay: Math.round(totals.totalLengthOfStay / totals.totalClients),
            permanentHousingRate: Math.round((totals.totalPermanentExits / totals.totalExits) * 100),
            avgDaysInShelter: Math.round(totals.totalDaysInShelter / totals.totalClients),
            withoutCasePlansRate: Math.round((totals.totalWithoutCasePlans / totals.totalClients) * 100),
            occupancyRate: Math.round((totals.totalOccupiedBeds / totals.totalBedCapacity) * 100),
            totalAdmissions: totals.totalAdmissions,
            totalSuccessfulExits: totals.totalSuccessfulExits
        };
    }

    setupEventListeners() {
        const siteSelect = document.getElementById('siteSelect');
        siteSelect.addEventListener('change', (e) => {
            this.currentSite = e.target.value;
            this.updateDashboard();
        });
    }

    populateSiteSelector() {
        const siteSelect = document.getElementById('siteSelect');
        
        // Clear existing options except "All Sites"
        siteSelect.innerHTML = '<option value="all">All Sites Overview</option>';
        
        // Add site options
        this.data.forEach(site => {
            const option = document.createElement('option');
            option.value = site.site_id;
            option.textContent = site.site_name;
            siteSelect.appendChild(option);
        });
    }

    getCurrentSiteData() {
        if (this.currentSite === 'all') {
            return null;
        }
        return this.data.find(site => site.site_id == this.currentSite);
    }

    updateDashboard() {
        const siteData = this.getCurrentSiteData();
        
        if (siteData) {
            this.updateSiteMetrics(siteData);
            this.updateCharts(siteData);
        } else {
            this.updateOrganizationView();
            this.updateChartsForOrganization();
        }
        
        this.updatePerformanceTable();
    }

    updateSiteMetrics(siteData) {
        // Calculate site-specific metrics
        const totalExits = siteData.permanent_housing_exits + siteData.temporary_housing_exits + siteData.unknown_exits;
        const permanentHousingRate = totalExits > 0 ? Math.round((siteData.permanent_housing_exits / totalExits) * 100) : 0;
        const withoutCasePlansRate = Math.round((siteData.clients_without_case_plans / siteData.total_clients) * 100);
        const occupancyRate = Math.round(siteData.occupancy_rate * 100);

        // Update metric displays
        document.getElementById('avgLengthSite').textContent = siteData.avg_length_of_stay_days;
        document.getElementById('avgLengthOrg').textContent = this.organizationAverages.avgLengthOfStay;
        
        document.getElementById('permanentHousingSite').textContent = permanentHousingRate + '%';
        document.getElementById('permanentHousingOrg').textContent = this.organizationAverages.permanentHousingRate + '%';
        
        document.getElementById('occupancySite').textContent = occupancyRate + '%';
        document.getElementById('occupancyOrg').textContent = this.organizationAverages.occupancyRate + '%';
        
        document.getElementById('daysShelterSite').textContent = siteData.avg_days_in_shelter;
        document.getElementById('daysShelterOrg').textContent = this.organizationAverages.avgDaysInShelter;
        
        document.getElementById('noCasePlanSite').textContent = withoutCasePlansRate + '%';
        document.getElementById('noCasePlanOrg').textContent = this.organizationAverages.withoutCasePlansRate + '%';
    }

    updateOrganizationView() {
        // Show organization averages when "All Sites" is selected
        document.getElementById('avgLengthSite').textContent = this.organizationAverages.avgLengthOfStay;
        document.getElementById('avgLengthOrg').textContent = '--';
        
        document.getElementById('permanentHousingSite').textContent = this.organizationAverages.permanentHousingRate + '%';
        document.getElementById('permanentHousingOrg').textContent = '--';
        
        document.getElementById('occupancySite').textContent = this.organizationAverages.occupancyRate + '%';
        document.getElementById('occupancyOrg').textContent = '--';
        
        document.getElementById('daysShelterSite').textContent = this.organizationAverages.avgDaysInShelter;
        document.getElementById('daysShelterOrg').textContent = '--';
        
        document.getElementById('noCasePlanSite').textContent = this.organizationAverages.withoutCasePlansRate + '%';
        document.getElementById('noCasePlanOrg').textContent = '--';
    }

    updateCharts(siteData) {
        this.createExitDestinationsChart(siteData);
        this.createOccupancyChart(siteData);
        this.createCasePlanChart(siteData);
        this.createMonthlyPerformanceChart(siteData);
    }

    updateChartsForOrganization() {
        this.createOrganizationExitChart();
        this.createOrganizationOccupancyChart();
        this.createOrganizationCasePlanChart();
        this.createOrganizationMonthlyChart();
    }

    createExitDestinationsChart(siteData) {
        const ctx = document.getElementById('exitDestinationsChart').getContext('2d');
        
        if (this.charts.exitDestinations) {
            this.charts.exitDestinations.destroy();
        }

        this.charts.exitDestinations = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Permanent Housing', 'Temporary Housing', 'Unknown/Other'],
                datasets: [{
                    data: [
                        siteData.permanent_housing_exits,
                        siteData.temporary_housing_exits,
                        siteData.unknown_exits
                    ],
                    backgroundColor: ['#34a853', '#fbbc04', '#ea4335'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createOccupancyChart(siteData) {
        const ctx = document.getElementById('occupancyChart').getContext('2d');
        
        if (this.charts.occupancy) {
            this.charts.occupancy.destroy();
        }

        const occupiedBeds = Math.round(siteData.total_bed_capacity * siteData.occupancy_rate);
        const availableBeds = siteData.total_bed_capacity - occupiedBeds;

        this.charts.occupancy = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Occupied', 'Available'],
                datasets: [{
                    data: [occupiedBeds, availableBeds],
                    backgroundColor: ['#4285f4', '#e8eaed'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createCasePlanChart(siteData) {
        const ctx = document.getElementById('casePlanChart').getContext('2d');
        
        if (this.charts.casePlan) {
            this.charts.casePlan.destroy();
        }

        const withCasePlans = siteData.total_clients - siteData.clients_without_case_plans;

        this.charts.casePlan = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['With Case Plans', 'Without Case Plans'],
                datasets: [{
                    data: [withCasePlans, siteData.clients_without_case_plans],
                    backgroundColor: ['#34a853', '#ea4335'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createMonthlyPerformanceChart(siteData) {
        const ctx = document.getElementById('monthlyPerformanceChart').getContext('2d');
        
        if (this.charts.monthlyPerformance) {
            this.charts.monthlyPerformance.destroy();
        }

        this.charts.monthlyPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['New Admissions', 'Successful Exits'],
                datasets: [{
                    label: 'Current Site',
                    data: [siteData.new_admissions_month, siteData.successful_exits_month],
                    backgroundColor: '#4285f4',
                    borderWidth: 0
                }, {
                    label: 'Organization Total',
                    data: [this.organizationAverages.totalAdmissions, this.organizationAverages.totalSuccessfulExits],
                    backgroundColor: '#9aa0a6',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Organization-level charts (when "All Sites" is selected)
    createOrganizationExitChart() {
        const ctx = document.getElementById('exitDestinationsChart').getContext('2d');
        
        if (this.charts.exitDestinations) {
            this.charts.exitDestinations.destroy();
        }

        const totals = this.data.reduce((acc, site) => {
            acc.permanent += site.permanent_housing_exits;
            acc.temporary += site.temporary_housing_exits;
            acc.unknown += site.unknown_exits;
            return acc;
        }, { permanent: 0, temporary: 0, unknown: 0 });

        this.charts.exitDestinations = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Permanent Housing', 'Temporary Housing', 'Unknown/Other'],
                datasets: [{
                    data: [totals.permanent, totals.temporary, totals.unknown],
                    backgroundColor: ['#34a853', '#fbbc04', '#ea4335'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createOrganizationOccupancyChart() {
        const ctx = document.getElementById('occupancyChart').getContext('2d');
        
        if (this.charts.occupancy) {
            this.charts.occupancy.destroy();
        }

        const totals = this.data.reduce((acc, site) => {
            acc.capacity += site.total_bed_capacity;
            acc.occupied += Math.round(site.total_bed_capacity * site.occupancy_rate);
            return acc;
        }, { capacity: 0, occupied: 0 });

        this.charts.occupancy = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Occupied', 'Available'],
                datasets: [{
                    data: [totals.occupied, totals.capacity - totals.occupied],
                    backgroundColor: ['#4285f4', '#e8eaed'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createOrganizationCasePlanChart() {
        const ctx = document.getElementById('casePlanChart').getContext('2d');
        
        if (this.charts.casePlan) {
            this.charts.casePlan.destroy();
        }

        const totals = this.data.reduce((acc, site) => {
            acc.total += site.total_clients;
            acc.without += site.clients_without_case_plans;
            return acc;
        }, { total: 0, without: 0 });

        this.charts.casePlan = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['With Case Plans', 'Without Case Plans'],
                datasets: [{
                    data: [totals.total - totals.without, totals.without],
                    backgroundColor: ['#34a853', '#ea4335'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    createOrganizationMonthlyChart() {
        const ctx = document.getElementById('monthlyPerformanceChart').getContext('2d');
        
        if (this.charts.monthlyPerformance) {
            this.charts.monthlyPerformance.destroy();
        }

        this.charts.monthlyPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['New Admissions', 'Successful Exits'],
                datasets: [{
                    label: 'Organization Total',
                    data: [this.organizationAverages.totalAdmissions, this.organizationAverages.totalSuccessfulExits],
                    backgroundColor: '#4285f4',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updatePerformanceTable() {
        const tbody = document.querySelector('#performanceTable tbody');
        tbody.innerHTML = '';

        this.data.forEach(site => {
            const row = document.createElement('tr');
            
            // Calculate metrics
            const totalExits = site.permanent_housing_exits + site.temporary_housing_exits + site.unknown_exits;
            const permanentHousingRate = totalExits > 0 ? Math.round((site.permanent_housing_exits / totalExits) * 100) : 0;
            const withoutCasePlansRate = Math.round((site.clients_without_case_plans / site.total_clients) * 100);
            const occupancyRate = Math.round(site.occupancy_rate * 100);
            
            // Calculate performance score
            const performanceScore = this.calculatePerformanceScore(site);
            
            row.innerHTML = `
                <td><strong>${site.site_name}</strong></td>
                <td>${site.region}</td>
                <td>${site.total_clients}</td>
                <td class="${this.getPerformanceClass('lengthOfStay', site.avg_length_of_stay_days)}">${site.avg_length_of_stay_days} days</td>
                <td class="${this.getPerformanceClass('permanentHousing', permanentHousingRate)}">${permanentHousingRate}%</td>
                <td class="${this.getPerformanceClass('occupancy', occupancyRate)}">${occupancyRate}%</td>
                <td class="${this.getPerformanceClass('casePlans', site.clients_without_case_plans)}">
                    <span class="tooltip">
                        ${site.clients_without_case_plans}
                        <div class="tooltip-content">${this.createCaseManagerTooltip(site.case_managers_without_plans)}</div>
                    </span>
                </td>
                <td><span class="performance-score ${performanceScore.class}">${performanceScore.label}</span></td>
            `;
            
            tbody.appendChild(row);
        });
    }

    createCaseManagerTooltip(caseManagerData) {
        if (!caseManagerData || caseManagerData.length === 0) {
            return 'No case manager data available';
        }
        
        return caseManagerData.map(manager =>
            `<span class="case-manager-item">${manager.name} - ${manager.count}</span>`
        ).join('');
    }

    calculatePerformanceScore(site) {
        let score = 0;
        
        // Length of stay (lower is better)
        if (site.avg_length_of_stay_days <= this.organizationAverages.avgLengthOfStay) score += 1;
        
        // Permanent housing rate (higher is better)
        const totalExits = site.permanent_housing_exits + site.temporary_housing_exits + site.unknown_exits;
        const permanentRate = totalExits > 0 ? (site.permanent_housing_exits / totalExits) * 100 : 0;
        if (permanentRate >= this.organizationAverages.permanentHousingRate) score += 1;
        
        // Occupancy rate (higher is better, but not over 100%)
        const occupancyRate = site.occupancy_rate * 100;
        if (occupancyRate >= 90 && occupancyRate <= 100) score += 1;
        
        // Case plans (lower total number without plans is better, relative to site size)
        const withoutCasePlansRate = (site.clients_without_case_plans / site.total_clients) * 100;
        if (withoutCasePlansRate <= this.organizationAverages.withoutCasePlansRate) score += 1;
        
        if (score >= 3) return { label: 'Excellent', class: 'score-excellent' };
        if (score >= 2) return { label: 'Good', class: 'score-good' };
        return { label: 'Needs Improvement', class: 'score-needs-improvement' };
    }

    getPerformanceClass(metric, value) {
        switch (metric) {
            case 'lengthOfStay':
                if (value <= this.organizationAverages.avgLengthOfStay * 0.8) return 'performance-good';
                if (value <= this.organizationAverages.avgLengthOfStay * 1.2) return 'performance-warning';
                return 'performance-poor';
            
            case 'casePlans':
                // For case plans, we're now using total numbers, so calculate the average total
                const avgWithoutCasePlans = Math.round(this.organizationAverages.withoutCasePlansRate * this.data.reduce((sum, site) => sum + site.total_clients, 0) / (this.data.length * 100));
                if (value <= avgWithoutCasePlans * 0.8) return 'performance-good';
                if (value <= avgWithoutCasePlans * 1.2) return 'performance-warning';
                return 'performance-poor';
            
            case 'occupancy':
                if (value >= 90 && value <= 100) return 'performance-good';
                if (value >= 80) return 'performance-warning';
                return 'performance-poor';
            
            case 'casePlans':
                if (value <= this.organizationAverages.withoutCasePlansRate * 0.8) return 'performance-good';
                if (value <= this.organizationAverages.withoutCasePlansRate * 1.2) return 'performance-warning';
                return 'performance-poor';
            
            default:
                return '';
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HomelessServicesDashboard();
});