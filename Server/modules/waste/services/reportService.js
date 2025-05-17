import Report from '../models/Report.js';

class ReportService {
    async createReport(reportData) {
        const report = new Report(reportData);
        return await report.save();
    }

    async getReports(filters = {}) {
        return await Report.find(filters)
            .populate('reportedBy', 'name email')
            .populate('relatedBin')
            .sort({ createdAt: -1 });
    }

    async getReportById(id) {
        return await Report.findById(id)
            .populate('reportedBy', 'name email')
            .populate('relatedBin');
    }

    async updateReport(id, updateData) {
        return await Report.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    async deleteReport(id) {
        return await Report.findByIdAndDelete(id);
    }

    async getNearbyReports(coordinates, maxDistance = 1000) {
        return await Report.find({
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
        return await Report.find({ reportType })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });
    }

    async getReportsByStatus(status) {
        return await Report.find({ status })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });
    }

    async getUrgentReports() {
        return await Report.find({ severity: 'URGENTE' })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });
    }

    async verifyReport(id, verifierUserId, notes, estimatedResolutionTime) {
        const report = await Report.findById(id);
        if (!report) throw new Error('Report non trovato');
        
        report.verify(verifierUserId, notes, estimatedResolutionTime);
        return await report.save();
    }

    async resolveReport(id, resolverUserId, actionTaken, followUpRequired = false, followUpNotes = '') {
        const report = await Report.findById(id);
        if (!report) throw new Error('Report non trovato');
        
        report.resolve(resolverUserId, actionTaken, followUpRequired, followUpNotes);
        return await report.save();
    }
}

export default new ReportService();
