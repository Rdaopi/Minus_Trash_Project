import Bin from '../models/Bin.js';

class BinService {
    async createBin(binData) {
        const bin = new Bin(binData);
        return await bin.save();
    }

    async getBins(filters = {}) {
        return await Bin.find(filters).sort({ createdAt: -1 });
    }

    async getBinById(id) {
        return await Bin.findById(id);
    }

    async updateBin(id, updateData) {
        return await Bin.findByIdAndUpdate(id, updateData, { 
            new: true, 
            runValidators: true 
        });
    }

    async deleteBin(id) {
        return await Bin.findByIdAndDelete(id);
    }

    async getNearbyBins(coordinates, maxDistance = 1000) {
        return await Bin.find({
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

    async updateBinStatus(id, status) {
        return await Bin.findByIdAndUpdate(
            id,
            { 
                status,
                updatedAt: new Date()
            },
            { new: true }
        );
    }

    async getBinsByType(type) {
        return await Bin.find({ type });
    }

    async getFullBins() {
        return await Bin.find({ 
            currentFillLevel: { $gte: 80 } 
        });
    }

    async getBinsNeedingMaintenance() {
        const now = new Date();
        return await Bin.find({
            $or: [
                { status: 'manutenzione' },
                { 'maintenanceSchedule.nextMaintenance': { $lte: now } }
            ]
        });
    }
}

export default new BinService();
