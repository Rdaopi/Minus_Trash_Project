import Report from '../models/Report.js';

class ReportService {
    constructor(reportModel = null) {
        // Allow model injection for testing
        this.Report = reportModel || Report;
    }

    async createReport(reportData) {
        const report = new this.Report(reportData);
        return await report.save();
    }

    async getReports(filters = {}) {
        return await this.Report.find(filters)
            .populate('reportedBy', 'name email')
            .populate('relatedBin')
            .sort({ createdAt: -1 });
    }

    async getReportById(id) {
        return await this.Report.findById(id)
            .populate('reportedBy', 'name email')
            .populate('relatedBin');
    }

    async updateReport(id, updateData) {
        return await this.Report.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    async deleteReport(id) {
        return await this.Report.findByIdAndDelete(id);
    }

    async getNearbyReports(coordinates, maxDistance = 1000) {
        return await this.Report.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    $maxDistance: maxDistance
                }
            }
        });
    }

    async getReportsByType(reportType) {
        return await this.Report.find({ reportType })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });
    }

    async getReportsByStatus(status) {
        return await this.Report.find({ status })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });
    }

    async getUrgentReports() {
        return await this.Report.find({ severity: 'URGENTE' })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });
    }

    async verifyReport(id, verifierUserId, notes, estimatedResolutionTime) {
        const report = await this.Report.findById(id);
        if (!report) throw new Error('Report non trovato');
        
        report.verify(verifierUserId, notes, estimatedResolutionTime);
        return await report.save();
    }

    async resolveReport(id, resolverUserId, actionTaken, followUpRequired = false, followUpNotes = '') {
        const report = await this.Report.findById(id);
        if (!report) throw new Error('Report non trovato');
        
        report.resolve(resolverUserId, actionTaken, followUpRequired, followUpNotes);
        return await report.save();
    }

    async updateReportStatus(id, status, userId) {
        const report = await this.Report.findById(id);
        if (!report) throw new Error('Report non trovato');
        
        // Update the status
        report.status = status;
        
        // Add a status change entry to the history if it exists
        if (report.statusHistory) {
            report.statusHistory.push({
                status: status,
                changedBy: userId,
                changedAt: new Date(),
                notes: `Stato cambiato a ${status}`
            });
        }
        
        // If status is "RISOLTO", also call resolveReport for additional resolution logic
        if (status === 'RISOLTO') {
            console.log('Status is RISOLTO, calling resolveReport...');
            return await this.resolveReport(
                id, 
                userId, 
                'Segnalazione risolta tramite cambio stato', 
                false, 
                'Risoluzione automatica tramite aggiornamento stato'
            );
        }
        
        return await report.save();
    }

    async getReportStats() {
        const total = await this.Report.countDocuments();
        
        const byType = await this.Report.aggregate([
            { $group: { _id: '$reportType', count: { $sum: 1 } } }
        ]);
        
        const byStatus = await this.Report.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const bySeverity = await this.Report.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);
        
        return {
            total,
            byType: Object.fromEntries(byType.map(item => [item._id, item.count])),
            byStatus: Object.fromEntries(byStatus.map(item => [item._id, item.count])),
            bySeverity: Object.fromEntries(bySeverity.map(item => [item._id, item.count]))
        };
    }
}

// Export both the class and a default instance
export { ReportService };
export default new ReportService();
