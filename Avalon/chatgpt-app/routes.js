const express = require("express");
const { listProviders, buildIngestionPlan } = require("../sources");

const router = express.Router();

router.get("/providers", (req, res) => {
  const { region, strategy } = req.query;
  const items = listProviders({ region, fetchStrategy: strategy });
  res.json({
    summary: `Found ${items.length} provider(s) for Austrian coverage${region ? ` in ${region}` : ""}.`,
    items,
    meta: { region: region || "AT", strategy: strategy || "any" },
  });
});

router.post("/search", (req, res) => {
  const { location = "Austria", listingTypes = ["buy", "rent"], maxPrice, propertyType, limit = 5 } = req.body || {};
  const plan = buildIngestionPlan({ region: "AT", preferApiFirst: true }).slice(0, limit);

  const items = plan.map((provider, index) => ({
    id: `${provider.providerId}-${index + 1}`,
    title: `${provider.providerId} exemplar near ${location}`,
    price: maxPrice ? Math.min(maxPrice, 350000 + index * 25000) : 350000 + index * 25000,
    currency: "EUR",
    location,
    propertyType: propertyType || (listingTypes.includes("rent") ? "apartment" : "house"),
    listingTypes: provider.listingTypes,
    source: provider.providerId,
    sourceUrl: provider.baseUrl,
    highlights: [
      "Stub listing for ChatGPT action development",
      `Supports listing types: ${provider.listingTypes.join(", ")}`,
    ],
  }));

  res.json({
    summary: `Generated ${items.length} sample listing(s) near ${location} for prototype wiring. Replace with live search data when ingestion is connected.`,
    items,
    meta: {
      providersSearched: plan.map((p) => p.providerId),
      filters: { listingTypes, maxPrice, propertyType },
    },
  });
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "avalon-chat-actions", timestamp: new Date().toISOString() });
});

module.exports = router;
