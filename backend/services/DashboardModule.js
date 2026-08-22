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

    const candidatesOverview = latest
      ? {
          totalEvaluated: latest.ranked.length + latest.excluded.length,
          compatibleCount: latest.ranked.length,
          excludedCount: latest.excluded.length,
        }
      : { totalEvaluated: 0, compatibleCount: 0, excludedCount: 0 };

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
