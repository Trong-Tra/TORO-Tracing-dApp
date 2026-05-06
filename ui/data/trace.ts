export const BATCH_ID = "MOTN3042";
export const POLICY_ID = "def68337867cb4f1f95b6b811fedbfcdd7780d10a95cc072077088ea";
export const SCRIPT_ADDR = "addr_test1wpunlryvl7aqsxe22erzlsseej87v5kk5vutvtrmzdy8dect48z0w";

export type TraceStage = {
  stage: string;
  tx: string;
  details: Record<string, string | number>;
  icon: string;
};

export type TraceChain = {
  label: string;
  subtitle: string;
  color: string;
  stages: TraceStage[];
};

export const TRACE_DATA: { farm: TraceChain; catch: TraceChain; final: TraceStage } = {
  farm: {
    label: "Farm Source",
    subtitle: "Station A — Aquaculture",
    color: "#3e96cc",
    stages: [
      {
        stage: "Hatchery",
        tx: "b5aa6201abac8f47bac4fd0f9c8d22638afe6592b13808aff209162e722176ce",
        details: {
          "Batch ID": "TORO-FARM-001",
          "Egg Weight": "500 kg",
          "Location": "Thailand Hatchery 01",
          "Spawn Date": "2026-05-01",
          "Supplier": "QmSupplierProfile123",
        },
        icon: "egg",
      },
      {
        stage: "Nursery",
        tx: "c73d5cad4aa80474d268a382f49a903e17078065d7c1ee5d821852cb41d85aaa",
        details: {
          "Fry Weight": "450 kg",
          "Survival Rate": "90%",
          "Pond ID": "Pond-A-07",
          "Feed Type": "QmFeedType456",
        },
        icon: "droplets",
      },
      {
        stage: "Growout",
        tx: "da848c537b45a9dbecea6af9e0f6274f12dcaded2270372f574e127fa043be57",
        details: {
          "Fish Weight": "2,000 kg",
          "Density": "25 fish/m³",
          "Harvest Date": "2026-08-15",
          "Antibiotic Free": "QmAntibioticFreeCert",
        },
        icon: "fish",
      },
      {
        stage: "Harvest & Transport",
        tx: "6c8f02c9665a72f9be1ac3029e2db2de111cda1af3c9961d8986ed32f59f1c86",
        details: {
          "Shipped Weight": "1,950 kg",
          "Ice Temp": "0°C",
          "Truck ID": "TRUCK-A-42",
          "Arrival": "2026-08-16T06:00:00Z",
        },
        icon: "truck",
      },
      {
        stage: "Farm Processing",
        tx: "96d4aebc8cfa993291f6d394f03a36f86d7f8b45c7f13f2dfa2a60ee26b661c2",
        details: {
          "Input Weight": "1,950 kg",
          "Output": "3,900 cans",
          "Wastage": "50 kg",
          "Supervisor": "SUPER-A-01",
        },
        icon: "factory",
      },
    ],
  },
  catch: {
    label: "Catch Source",
    subtitle: "Station B — Wild Catch",
    color: "#ff914d",
    stages: [
      {
        stage: "Catch & Ice",
        tx: "b5aa6201abac8f47bac4fd0f9c8d22638afe6592b13808aff209162e722176ce",
        details: {
          "Batch ID": "TORO-CATCH-001",
          "Catch Weight": "800 kg",
          "Method": "Long-line",
          "Vessel": "FV-Pacific-07",
          "Catch Date": "2026-05-02",
        },
        icon: "anchor",
      },
      {
        stage: "Port Landing",
        tx: "98edace66dac8742da5cc8ae0a868aa218d023c526c118941fdf4a4be472529e",
        details: {
          "Landed Weight": "780 kg",
          "Port": "Songkhla Port",
          "Storage Temp": "2°C",
          "Quality Cert": "QmQualityCertABC",
        },
        icon: "ship",
      },
      {
        stage: "Transport to Plant",
        tx: "1d77d2cfa5eb1bd6d74d7c59838112d4494cb65f9b06d9d80dd419d631bbca76",
        details: {
          "Shipped Weight": "770 kg",
          "Container": "CONT-B-99",
          "Transit Time": "12 hours",
          "Condition": "QmStorageCondXYZ",
        },
        icon: "container",
      },
      {
        stage: "Catch Processing",
        tx: "3dbc9f59dbeff29c37e49b47f88e395dbf9d1cd1984751dbcd3c74d48f6fa7d0",
        details: {
          "Input Weight": "770 kg",
          "Output": "1,540 cans",
          "Wastage": "30 kg",
          "Supervisor": "SUPER-B-02",
        },
        icon: "factory",
      },
    ],
  },
  final: {
    stage: "Final Product",
    tx: "eca789f0602d513ca78c1154d406ac96404d4e224d084e778a80fa2769d0065b",
    details: {
      "Total Cans": "5,440",
      "Farm Cans": "3,900",
      "Catch Cans": "1,540",
      "Label": "TORO-PREMIUM-TUNA-001",
      "Packaging Date": "2026-08-17",
      "Distribution": "Bangkok Distribution Center",
    },
    icon: "package",
  },
};

export function cardanoscanUrl(txHash: string): string {
  return `https://preview.cardanoscan.io/transaction/${txHash}`;
}
