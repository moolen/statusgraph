import { Rect, Poly, Diamond, Service, Cluster, Edge } from './internal';
import { Actor } from './nodes/actor';

// node types
export const NODE_TYPE_RECT = 'rect';
export const NODE_TYPE_POLY = 'poly';
export const NODE_TYPE_DIAMOND = 'diamond';
export const NODE_TYPE_SERVICE = 'service';
export const NODE_TYPE_CLUSTER = 'cluster';
export const NODE_TYPE_ACTOR = 'actor';

export const nodeTypes = [
  NODE_TYPE_RECT,
  NODE_TYPE_SERVICE,
  NODE_TYPE_POLY,
  NODE_TYPE_DIAMOND,
  NODE_TYPE_CLUSTER,
  NODE_TYPE_ACTOR,
];

// render layers
export const LAYER_BACKGROUND = 'background';
export const LAYER_EDGE = 'edge';
export const LAYER_NODE = 'node';

export const RenderLayers = [LAYER_BACKGROUND, LAYER_EDGE, LAYER_NODE];
export const RenderLayerMap = RenderLayers.reduce((o, v) => {
  o[v] = {};

  return o;
}, {});

export const NodeTypeMap = {
  [NODE_TYPE_RECT]: {
    class: Rect,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_POLY]: {
    class: Poly,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_DIAMOND]: {
    class: Diamond,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_SERVICE]: {
    class: Service,
    layer: LAYER_NODE,
  },
  [NODE_TYPE_CLUSTER]: {
    class: Cluster,
    layer: LAYER_BACKGROUND,
  },
  [NODE_TYPE_ACTOR]: {
    class: Actor,
    layer: LAYER_NODE,
  },
};

export const EDGE_TYPE_DEFAULT = 'edge';
export const EdgeTypes = [EDGE_TYPE_DEFAULT];

export const EdgeTypeMap = {
  [EDGE_TYPE_DEFAULT]: {
    class: Edge,
  },
};

// example graph
export const ExampleGraph = JSON.parse(`
{
  "id": "750b1c70-5b25-431e-ba60-73db9663dda7",
  "name": "Hipster Shop",
  "edges": [
      {
          "id": "95d05e1c-b57c-4aba-bd4e-27db69dc63ba",
          "source": {
              "id": "496470fa-0009-4f96-bda7-c258ce53c30e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "fff64c8a-d949-42a9-9c8a-ee8f1a3f6d9a",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "f8dbb12b-e055-4af8-bf9a-8592a242497d",
          "source": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "fff64c8a-d949-42a9-9c8a-ee8f1a3f6d9a",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "736e2a42-3706-43ad-960e-bc15d9096dd6",
          "source": {
              "id": "2b8a710a-ab61-4be9-8e0c-b0fee879635c",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "fff64c8a-d949-42a9-9c8a-ee8f1a3f6d9a",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "1bca1541-be53-4ff3-8b8d-72141f524ffe",
          "source": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "target": {
              "id": "fff64c8a-d949-42a9-9c8a-ee8f1a3f6d9a",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "4e73e9d0-b4e0-48e2-abfe-b61ec47990c2",
          "source": {
              "id": "aa9dcc62-1f79-4413-8c1b-739c06e9ebaf",
              "type": "poly",
              "connector": ""
          },
          "target": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "b78b2add-b36d-4f5a-b475-a64430aa46b2",
          "source": {
              "id": "b70fa3a6-515c-4623-8d6d-285c1f73737b",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "41558407-e423-46db-8e3f-58122cf5a6b6",
          "source": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "target": {
              "id": "13e673ac-5245-43ca-aafc-2f27eb8f81b7",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "b6fdee6b-6fed-4b48-9757-48be56669f71",
          "source": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "a3f47357-a638-4ce1-963e-f0acd86bcaca",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "bbfd68a0-fb7d-4505-83ae-f4c283cca0eb",
          "source": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "d93e1b8d-7e05-4883-82dd-b07b1235b8f6",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "7c5365e2-62e5-4c40-9b88-4aefdc979cd4",
          "source": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "02cb39b2-ff5e-4dde-8f54-a9b818efa1f2",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "7fe213a8-d705-4a35-896b-0dd773644696",
          "source": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "target": {
              "id": "496470fa-0009-4f96-bda7-c258ce53c30e",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "030efc5c-cfd5-4f06-a7f8-c72682090a72",
          "source": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "496470fa-0009-4f96-bda7-c258ce53c30e",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "597ce77c-5bf2-43a4-abec-fe3689e76f41",
          "source": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "2b8a710a-ab61-4be9-8e0c-b0fee879635c",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "263707db-ccc1-4727-840f-927218e4de36",
          "source": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "target": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "faf55f4a-d89e-4bf9-9578-f16a1d74b4d5",
          "source": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "8f85cea4-46ee-4a9a-a78d-32e7afb9de5a",
          "source": {
              "id": "b76d2b4e-0ed2-4730-b0f8-9568e7e8a81a",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "2b8a710a-ab61-4be9-8e0c-b0fee879635c",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "1f1e2c9e-0226-46ce-8707-5a134497653d",
          "source": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "target": {
              "id": "b76d2b4e-0ed2-4730-b0f8-9568e7e8a81a",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "9cf1e13c-39db-49c4-99e2-3094df6cac24",
          "source": {
              "id": "4bb38392-8449-41b7-9cca-2ecba2692d84",
              "type": "rect",
              "connector": ""
          },
          "target": {
              "id": "c5ef41e3-5735-4913-8898-50e753baa045",
              "type": "poly",
              "connector": ""
          },
          "type": "edge"
      },
      {
          "id": "d03a5058-6351-464d-b450-5f650cc8b58a",
          "source": {
              "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
              "type": "diamond",
              "connector": ""
          },
          "target": {
              "id": "4bb38392-8449-41b7-9cca-2ecba2692d84",
              "type": "rect",
              "connector": ""
          },
          "type": "edge"
      }
  ],
  "nodes": [
      {
          "id": "fff64c8a-d949-42a9-9c8a-ee8f1a3f6d9a",
          "name": "customer.svc",
          "type": "poly",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -78.60058212280273,
              "y": 280.77549743652344
          }
      },
      {
          "id": "aa9dcc62-1f79-4413-8c1b-739c06e9ebaf",
          "name": "internet",
          "type": "poly",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -225.85000610351562,
              "y": -145.97918319702148
          }
      },
      {
          "id": "02cb39b2-ff5e-4dde-8f54-a9b818efa1f2",
          "name": "shipping.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -613.2842712402344,
              "y": 339.6826629638672
          }
      },
      {
          "id": "496470fa-0009-4f96-bda7-c258ce53c30e",
          "name": "currency.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -470.4971008300781,
              "y": 210.6466827392578
          }
      },
      {
          "id": "b76d2b4e-0ed2-4730-b0f8-9568e7e8a81a",
          "name": "recommend.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -61.846261739730835,
              "y": 204.4327850341797
          }
      },
      {
          "id": "f4d60860-27ab-4aee-baad-0dc3d4695862",
          "name": "frontend",
          "type": "diamond",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -230.70550537109375,
              "y": 49.37151336669922
          }
      },
      {
          "id": "4bb38392-8449-41b7-9cca-2ecba2692d84",
          "name": "cart.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": null,
          "bounds": {
              "x": 209.05447053909302,
              "y": 246.3731945157051
          }
      },
      {
          "id": "c5ef41e3-5735-4913-8898-50e753baa045",
          "name": "cart-cache.svc",
          "type": "poly",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": 214.68018341064453,
              "y": 316.734247982502
          }
      },
      {
          "id": "2b8a710a-ab61-4be9-8e0c-b0fee879635c",
          "name": "catalog.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": 51.49360275268555,
              "y": 395.4171905517578
          }
      },
      {
          "id": "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
          "name": "checkout.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -472.1509704589844,
              "y": 299.7002258300781
          }
      },
      {
          "id": "d93e1b8d-7e05-4883-82dd-b07b1235b8f6",
          "name": "payment.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -474.0828857421875,
              "y": 383.3362274169922
          }
      },
      {
          "id": "a3f47357-a638-4ce1-963e-f0acd86bcaca",
          "name": "email.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -613.1866149902344,
              "y": 247.14050436019897
          }
      },
      {
          "id": "13e673ac-5245-43ca-aafc-2f27eb8f81b7",
          "name": "ad.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -484.90753173828125,
              "y": 87.16839981079102
          }
      },
      {
          "id": "b70fa3a6-515c-4623-8d6d-285c1f73737b",
          "name": "load-gen.svc",
          "type": "rect",
          "labels": null,
          "connector": [],
          "children": [],
          "bounds": {
              "x": -73.40775454044342,
              "y": -10.56764268875122
          }
      },
      {
          "id": "f7030691-77f6-4e3b-b49c-4bdd30862f2f",
          "name": "orders.svc",
          "type": "cluster",
          "labels": null,
          "connector": [],
          "children": [
              "4bb38392-8449-41b7-9cca-2ecba2692d84",
              "c5ef41e3-5735-4913-8898-50e753baa045"
          ],
          "bounds": {
              "x": 209.05447387695312,
              "y": 246.37319260835648
          }
      },
      {
          "id": "4b448713-bde0-4334-ad69-76c26cefa572",
          "name": "Team Customer",
          "type": "cluster",
          "labels": null,
          "connector": [],
          "children": [
              "fff64c8a-d949-42a9-9c8a-ee8f1a3f6d9a",
              "b76d2b4e-0ed2-4730-b0f8-9568e7e8a81a",
              "2b8a710a-ab61-4be9-8e0c-b0fee879635c",
              "f7030691-77f6-4e3b-b49c-4bdd30862f2f"
          ],
          "bounds": {
              "x": -78.6005859375,
              "y": 204.4327850341797
          }
      },
      {
          "id": "a41581dd-7340-4d81-abb8-05c219639ed8",
          "name": "Team Checkout",
          "type": "cluster",
          "labels": null,
          "connector": [],
          "children": [
              "02cb39b2-ff5e-4dde-8f54-a9b818efa1f2",
              "496470fa-0009-4f96-bda7-c258ce53c30e",
              "11e9795f-3a12-40bd-9291-4d1cd1dbc00e",
              "d93e1b8d-7e05-4883-82dd-b07b1235b8f6",
              "a3f47357-a638-4ce1-963e-f0acd86bcaca"
          ],
          "bounds": {
              "x": -671.5396728515625,
              "y": 206.01548767089844
          }
      }
  ]
}
`);
