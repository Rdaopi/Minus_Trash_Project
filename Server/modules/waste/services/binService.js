import Bin from '../models/Bin.js';

class BinService {
    constructor(binModel = null) {
        // Allow model injection for testing
        this.Bin = binModel || Bin;
    }

    async createBin(binData) {
        const bin = new this.Bin(binData);
        return await bin.save();
    }

    async getBins(filters = {}) {
        return await this.Bin.find(filters).sort({ createdAt: -1 });
    }

    async getBinById(id) {
        return await this.Bin.findById(id);
    }

    async updateBin(id, updateData) {
        return await this.Bin.findByIdAndUpdate(id, updateData, { 
            new: true, 
            runValidators: true 
        });
    }

    async deleteBin(id) {
        return await this.Bin.findByIdAndDelete(id);
    }

    async getNearbyBins(coordinates, maxDistance = 1000) {
        return await this.Bin.find({
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
        return await this.Bin.findByIdAndUpdate(
            id,
            { 
                status,
                updatedAt: new Date()
            },
            { new: true }
        );
    }

    async getBinsByType(type) {
        return await this.Bin.find({ type });
    }

    async getFullBins() {
        return await this.Bin.find({ 
            currentFillLevel: { $gte: 80 } 
        });
    }

    async getBinsNeedingMaintenance() {
        const now = new Date();
        return await this.Bin.find({
            $or: [
                { status: 'manutenzione' },
                { 'maintenanceSchedule.nextMaintenance': { $lte: now } }
            ]
        });
    }
}

// Export both the class and a default instance
export { BinService };
export default new BinService();
