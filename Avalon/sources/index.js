const providers = require("./providers");

function listProviders({ region, fetchStrategy } = {}) {
  return providers.filter((provider) => {
    const matchesRegion = !region || provider.regions.includes(region) || provider.regions.some((r) => r.startsWith(`${region}-`));
    const matchesStrategy = !fetchStrategy || provider.fetchStrategy === fetchStrategy;
    return matchesRegion && matchesStrategy;
  });
}

function buildIngestionPlan({ region, preferApiFirst = true } = {}) {
  const prioritized = [...providers].sort((a, b) => a.priority - b.priority);
  return prioritized
    .filter((provider) => !region || provider.regions.includes(region) || provider.regions.some((r) => r.startsWith(`${region}-`)))
    .map((provider) => ({
      providerId: provider.id,
      baseUrl: provider.baseUrl,
      mode: preferApiFirst && provider.fetchStrategy === "api" ? "api" : provider.fetchStrategy,
      notes: provider.notes,
      listingTypes: provider.listingTypes,
    }));
}

function describeProvider(id) {
  return providers.find((provider) => provider.id === id);
}

module.exports = {
  providers,
  listProviders,
  buildIngestionPlan,
  describeProvider,
};
