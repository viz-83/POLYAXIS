const PackagingEngine = require('./PackagingEngine');
const RecommendationEngine = require('./RecommendationEngine');
const { readCollection } = require('../utils/dataStore');
const { STAGES } = PackagingEngine;

/** DashboardModule — aggregates project state for the Project Dashboard screen (Module 11). */
class DashboardModule {
  build(projectId, user) {
    const project = PackagingEngine.getProject(projectId, user);
    const specification = PackagingEngine.getSpecification(projectId);
    const requirements = PackagingEngine.getRequirements(projectId);
    const manufacturing = PackagingEngine.getManufacturing(projectId);
    const regulatory = PackagingEngine.getRegulatory(projectId);
    const latest = RecommendationEngine.getLatestRecommendation(projectId);
    const results = RecommendationEngine.getResults(projectId);
    const materials = readCollection('materials');

    // DASH-05: counts are per MATERIAL (a material has several trials), plus a status line for each candidate.
    let candidatesOverview = { totalEvaluated: 0, compatibleCount: 0, excludedCount: 0, statuses: [] };
    if (latest) {
      const seen = new Set();
      const statuses = [];
      for (const t of latest.ranked) {
        if (seen.has(t.materialId)) continue;
        seen.add(t.materialId);
        statuses.push({ materialId: t.materialId, name: t.materialName, status: 'ranked', bestScore: t.compositeScore });
      }
      for (const e of latest.excluded) {
        if (seen.has(e.materialId)) continue;
        seen.add(e.materialId);
        statuses.push({ materialId: e.materialId, name: e.materialName, status: 'excluded', reasonType: e.reasonType, reason: e.reason });
      }
      candidatesOverview = {
        totalEvaluated: statuses.length,
        compatibleCount: statuses.filter((s) => s.status === 'ranked').length,
        excludedCount: statuses.filter((s) => s.status === 'excluded').length,
        statuses,
      };
    }

    const primaryTrial = latest ? latest.ranked.find((t) => t.id === latest.primaryRecommendationId) : null;

    return {
      project: {
        id: project.id,
        name: project.name,
        productType: project.productType,
        transitionObjective: project.transitionObjective,
        stage: project.stage,
        stagesCompleted: project.stagesCompleted,
        allStages: STAGES,
      },
      packagingSummary: {
        existing: specification
          ? {
              material: specification.existingMaterial,
              layerStructure: specification.layerStructure,
              otr: specification.currentOtr,
              wvtr: specification.currentWvtr,
              shelfLifeMonths: specification.currentShelfLifeMonths,
            }
          : null,
        target: specification
          ? {
              materialType: specification.targetMaterialType,
              recyclabilityPercent: specification.targetRecyclabilityPercent,
              recyclingStream: specification.targetRecyclingStream,
              priority: specification.transitionPriority,
            }
          : null,
      },
      candidatesOverview,
      currentRecommendation: primaryTrial
        ? {
            trialName: primaryTrial.trialName,
            compositeScore: primaryTrial.compositeScore,
            estimatedCostGbp: primaryTrial.estimatedCostGbp,
            confidence: latest.confidence,
            rationaleExcerpt: latest.rationale.slice(0, 220) + (latest.rationale.length > 220 ? '…' : ''),
          }
        : null,
      keyConstraints: {
        manufacturing: manufacturing
          ? {
              equipmentTypes: manufacturing.equipmentTypes,
              temperatureRange: [manufacturing.temperatureMinC, manufacturing.temperatureMaxC],
              lineSpeedRange: [manufacturing.lineSpeedMinMpm, manufacturing.lineSpeedMaxMpm],
              flexibility: manufacturing.constraintFlexibility,
            }
          : null,
        regulatory: regulatory
          ? {
              ukEpr: regulatory.ukEprEnabled,
              euPpwr: regulatory.euPpwrEnabled,
              classificationPriority: regulatory.classificationPriority,
            }
          : null,
      },
      trialHistory: results.map((r) => ({
        id: r.id,
        trialName: r.trialName,
        date: r.trialDate,
        performanceResult: r.performanceResult,
        manufacturingResult: r.manufacturingResult,
        regulatoryResult: r.regulatoryResult,
        overallResult: r.overallResult,
      })),
      materialsCount: materials.length,
      requirementsComplete: Boolean(requirements && manufacturing && regulatory),
    };
  }
}

module.exports = new DashboardModule();
