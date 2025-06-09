import mongoose from 'mongoose';
import Report from '../../waste/models/Report.js';

describe('Report Model', () => {
  it('should require required fields', async () => {
    const report = new Report({});
    let err;
    try {
      await report.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.reportType).toBeDefined();
    expect(err.errors.severity).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.location).toBeDefined();
    expect(err.errors.reportedBy).toBeDefined();
  });

  it('should create a valid report', async () => {
    const report = new Report({
      reportType: 'RIFIUTI_ABBANDONATI',
      reportSubtype: 'PLASTICA',
      severity: 'MEDIA',
      location: { type: 'Point', coordinates: [12.5, 41.9], address: { city: 'Roma' } },
      description: 'Rifiuti abbandonati vicino al parco.',
      reportedBy: new mongoose.Types.ObjectId()
    });
    await expect(report.validate()).resolves.toBeUndefined();
  });
}); 