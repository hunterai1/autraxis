export const projectWalkthroughs = {
  "sap-boomi-order-sync": {
    slug: "sap-boomi-order-sync",
    nodes: [
      { id: "storefront", label: "Storefront API", sub: "REST · OAuth 2.0", x: 110, y: 90, color: "#38BDF8" },
      { id: "boomi", label: "Dell Boomi Process", sub: "Map · Route · Retry", x: 320, y: 90, color: "#06B6D4" },
      { id: "sap", label: "SAP S/4HANA", sub: "OData · SalesOrder", x: 560, y: 90, color: "#2563EB" },
      { id: "queue", label: "Error & Replay Queue", sub: "Operator review", x: 320, y: 205, color: "#F59E0B" },
    ],
    edges: [
      { from: "storefront", to: "boomi", label: "order.created" },
      { from: "boomi", to: "sap", label: "POST OData" },
      { from: "boomi", to: "queue", label: "on failure" },
    ],
    payloads: [
      {
        title: "Canonical order (internal model)",
        code: '{\n  "correlation_id": "ax-9f21c4",\n  "order_ref": "SO-10294",\n  "customer": { "id": "C-4021", "po": "PO-8841" },\n  "lines": [\n    { "sku": "AX-2210", "qty": 400, "uom": "EA" }\n  ],\n  "idempotency_key": "storefront:ord_77341"\n}',
      },
      {
        title: "Replay record (on failure)",
        code: '{\n  "correlation_id": "ax-9f21c4",\n  "failed_step": "sap.create_order",\n  "reason": "material_not_found: AX-2210",\n  "attempts": 3,\n  "action": "fix_master_data → replay"\n}',
      },
    ],
    walkthrough: [
      {
        heading: "A canonical model keeps both sides honest",
        text: "The storefront's payload and SAP's OData contract never touch each other directly. Everything passes through a canonical order model owned by the integration layer — so when either side changes, exactly one mapping changes. This is the single highest-leverage decision in the design.",
      },
      {
        heading: "Idempotency means retries are boring",
        text: "Every order carries an idempotency key derived from the source system's own identifier. Boomi checks the key before creating anything in SAP, which makes automatic retry safe — a timed-out call is retried without risking a duplicate sales order.",
      },
      {
        heading: "Failures park where humans can reach them",
        text: "When a document fails after retries, it lands in a review queue with the reason in plain language and a replay button. Operations fixes the root cause — usually master data — and replays. No engineer required, no lost orders.",
      },
    ],
  },
  "edi-flow-sandbox": {
    slug: "edi-flow-sandbox",
    nodes: [
      { id: "retailer", label: "Retail Partner", sub: "AS2 · X12", x: 110, y: 90, color: "#38BDF8" },
      { id: "gateway", label: "EDI Gateway", sub: "Translate · Validate", x: 320, y: 90, color: "#06B6D4" },
      { id: "erp", label: "ERP", sub: "Sales order create", x: 560, y: 90, color: "#2563EB" },
      { id: "tracker", label: "Document Tracker", sub: "State machine", x: 320, y: 205, color: "#10B981" },
    ],
    edges: [
      { from: "retailer", to: "gateway", label: "850 purchase order" },
      { from: "gateway", to: "erp", label: "validated order" },
      { from: "gateway", to: "retailer", label: "855 / 856 return" },
      { from: "gateway", to: "tracker", label: "state events" },
    ],
    payloads: [
      {
        title: "X12 850 purchase order (excerpt)",
        code: 'ISA*00*          *00*          *ZZ*RETAILER\nGS*PO*RETAILER*AUTRAXIS*20261014*0930\nST*850*0001\nBEG*00*NE*PO-8841**20261014\nPO1*1*400*EA*19.95**BP*AX-2210\nSE*5*0001',
      },
      {
        title: "Document tracker state",
        code: '{\n  "document": "PO-8841",\n  "partner": "retailer-01",\n  "state": "acknowledged",\n  "history": [\n    "received → translated → validated",\n    "855 sent at +38s"\n  ],\n  "sla": "within_tolerance"\n}',
      },
    ],
    walkthrough: [
      {
        heading: "A state machine, not a black box",
        text: "Every EDI document moves through explicit states — received, translated, validated, acknowledged, fulfilled. Because transitions are events, the tracker can answer 'where is this order?' for any partner at any moment without touching a log file.",
      },
      {
        heading: "Partner rules live in configuration",
        text: "Acknowledgement timing, validation strictness and routing differ per trading partner — and all of it is configuration owned by operations, not code owned by developers. Onboarding partner twenty is an afternoon of config, not a sprint of development.",
      },
      {
        heading: "The audit trail rebuilds itself",
        text: "Because every state change is an immutable event, the complete conversation for any document — the 850 in, the 855 out, timing at each hop — can be reconstructed for an audit or a dispute in seconds.",
      },
    ],
  },
  "event-driven-inventory": {
    slug: "event-driven-inventory",
    nodes: [
      { id: "wms", label: "WMS / ERP", sub: "Stock movements", x: 90, y: 90, color: "#38BDF8" },
      { id: "stream", label: "Event Stream", sub: "Pub / sub", x: 270, y: 90, color: "#06B6D4" },
      { id: "engine", label: "Threshold Engine", sub: "Rules as config", x: 450, y: 90, color: "#2563EB" },
      { id: "agent", label: "AI Summariser", sub: "Anomaly briefs", x: 650, y: 90, color: "#06B6D4" },
      { id: "inbox", label: "Ops Inbox", sub: "Human review", x: 450, y: 205, color: "#10B981" },
    ],
    edges: [
      { from: "wms", to: "stream", label: "inventory.moved" },
      { from: "stream", to: "engine", label: "evaluate" },
      { from: "engine", to: "agent", label: "threshold breach" },
      { from: "agent", to: "inbox", label: "plain-language brief" },
    ],
    payloads: [
      {
        title: "Inventory event",
        code: '{\n  "event": "inventory.moved",\n  "sku": "AX-2210",\n  "location": "DC-EAST-04",\n  "delta": -400,\n  "on_hand": 62,\n  "ts": "2026-10-14T09:31:07Z"\n}',
      },
      {
        title: "Anomaly brief (AI-generated)",
        code: '{\n  "summary": "AX-2210 at DC-EAST-04 fell below safety stock (62 < 100) after a 400-unit order. No replenishment is scheduled before Thursday.",\n  "severity": "medium",\n  "source_events": ["evt_8812", "evt_8813"],\n  "suggested_action": "expedite PO-8847"\n}',
      },
    ],
    walkthrough: [
      {
        heading: "Events decouple everything",
        text: "The warehouse system publishes movements and forgets them. Dashboards, threshold rules and future consumers all subscribe independently — adding a new consumer never means touching the source system.",
      },
      {
        heading: "Summaries beat raw alerts",
        text: "Instead of paging an operator with 'THRESHOLD_BREACH sku=AX-2210', the automation layer drafts a two-sentence brief with context and a suggested action, with links to the source events. The human decides; the machine does the reading.",
      },
      {
        heading: "Thresholds are configuration, not code",
        text: "Safety-stock levels, severities and routing live in a configuration store the operations team edits directly. Changing a rule never requires a deployment — and every change is itself an auditable event.",
      },
    ],
  },
};
