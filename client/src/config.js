import { Rect, Poly, Diamond, Service, Cluster, Edge } from './internal';
import { Actor } from './nodes/actor';
import { Database } from './nodes/database';

// node types
export const NODE_TYPE_RECT = 'rect';
export const NODE_TYPE_POLY = 'poly';
export const NODE_TYPE_DIAMOND = 'diamond';
export const NODE_TYPE_SERVICE = 'service';
export const NODE_TYPE_CLUSTER = 'cluster';
export const NODE_TYPE_ACTOR = 'actor';
export const NODE_TYPE_DATABASE = 'database';

export const nodeTypes = [
  NODE_TYPE_RECT,
  NODE_TYPE_SERVICE,
  NODE_TYPE_POLY,
  NODE_TYPE_DIAMOND,
  NODE_TYPE_CLUSTER,
  NODE_TYPE_ACTOR,
  NODE_TYPE_DATABASE,
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
  [NODE_TYPE_DATABASE]: {
    class: Database,
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
export const ExampleGraph = JSON.parse(
  `{"id":"1029ade5-2373-4766-b51e-b905dfe300a9","name":"Checkout Funnel","edges":[{"id":"67b029f6-7855-4686-b789-8d4a349a4ffe","source":{"id":"2608513a-ee58-4ed9-bf59-872568a8074b","type":"diamond","connector":""},"target":{"id":"7df649d7-5c26-4417-973a-dea439b81594","type":"rect","connector":""},"type":"edge"},{"id":"a5b68924-0cd9-42b4-9f17-d7e65a0f0014","source":{"id":"80902f3e-d676-4aa0-95c6-11c931a156f5","type":"rect","connector":""},"target":{"id":"7df649d7-5c26-4417-973a-dea439b81594","type":"rect","connector":""},"type":"edge"},{"id":"4c287429-c99a-40cc-8194-fded30dfc54f","source":{"id":"7df649d7-5c26-4417-973a-dea439b81594","type":"rect","connector":""},"target":{"id":"3de8e11f-93ad-44da-b3ce-18e6d46e0943","type":"poly","connector":""},"type":"edge"},{"id":"339c3dc1-bff5-4986-822c-91a1582e12e2","source":{"id":"7f6fa89c-fd7a-42a6-bb25-f1e208282981","type":"database","connector":""},"target":{"id":"7df649d7-5c26-4417-973a-dea439b81594","type":"rect","connector":""},"type":"edge"},{"id":"fa1fe3a9-cb57-430f-9e96-c35c33887241","source":{"id":"ea11ddc8-a93c-48d9-a5d5-235be450f726","type":"rect","connector":""},"target":{"id":"b33b99cf-cb3f-42ad-91c7-d32bce218bbc","type":"poly","connector":""},"type":"edge"},{"id":"1987ef58-f7b6-44dc-bb91-96ae7057e068","source":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":""},"target":{"id":"a523ddc9-239f-40a4-9b9d-2318aa01604d","type":"service","connector":"f5f4d7f9-e965-40d8-b563-8f7ea0d1a806"},"type":"edge"},{"id":"2567ac51-1a8e-4470-8df6-9a8748e34060","source":{"id":"ea11ddc8-a93c-48d9-a5d5-235be450f726","type":"rect","connector":""},"target":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":"3519c1ee-ac10-49e6-a8bb-ecba16598edc"},"type":"edge"},{"id":"af769217-5071-4908-97ca-80eb308d2fdf","source":{"id":"7423b25b-3150-4d17-b60c-6c84df01847b","type":"poly","connector":""},"target":{"id":"ea11ddc8-a93c-48d9-a5d5-235be450f726","type":"rect","connector":""},"type":"edge"},{"id":"25b0f981-cd39-49d9-aeb8-d94c6dcc17f2","source":{"id":"a523ddc9-239f-40a4-9b9d-2318aa01604d","type":"service","connector":""},"target":{"id":"7423b25b-3150-4d17-b60c-6c84df01847b","type":"poly","connector":""},"type":"edge"},{"id":"c8eb0200-0619-4105-88d4-37b7a8d5daa2","source":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":""},"target":{"id":"a523ddc9-239f-40a4-9b9d-2318aa01604d","type":"service","connector":"4b7b36eb-1306-4927-825a-b6dc453daf3e"},"type":"edge"},{"id":"72599af5-5806-417e-82d3-3b7ca343d705","source":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":""},"target":{"id":"a523ddc9-239f-40a4-9b9d-2318aa01604d","type":"service","connector":"1b3bcff3-b0de-407a-9f0f-0118d7efdf74"},"type":"edge"},{"id":"57ab6df8-bc96-47e5-a474-4c3704eb3397","source":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":""},"target":{"id":"af8a002a-8a3b-4881-a3c4-8dc3a30a99f4","type":"service","connector":"dc8e6fe8-82d5-48b9-b797-73e1a401559e"},"type":"edge"},{"id":"0e53fe98-ed4c-4bf1-92ea-10f032b66722","source":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":""},"target":{"id":"af8a002a-8a3b-4881-a3c4-8dc3a30a99f4","type":"service","connector":"9d4ab3d8-fbfc-4272-9d94-382f683dda24"},"type":"edge"},{"id":"e295df2f-208c-4161-abed-d4f4493a27b8","source":{"id":"80902f3e-d676-4aa0-95c6-11c931a156f5","type":"rect","connector":""},"target":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":"8ab439e7-dd9f-48a2-9bb8-aecf491a8f5b"},"type":"edge"},{"id":"20bbe0ff-9b25-448f-8aa9-b63cee7a5ce2","source":{"id":"b90a2d7e-45f5-4d05-9ca7-2cfe6e249fc9","type":"service","connector":""},"target":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":"55727d29-70cb-4406-a41f-c409673b5580"},"type":"edge"},{"id":"f969b823-5a93-4447-b0c6-7500aaf2a5ad","source":{"id":"80902f3e-d676-4aa0-95c6-11c931a156f5","type":"rect","connector":""},"target":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":"169ac287-afcb-4fa2-baff-a7b3dc87c69e"},"type":"edge"},{"id":"7dd8234a-f9a2-4600-a449-a5c53bb92c96","source":{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","type":"service","connector":""},"target":{"id":"4b427594-93d6-45ae-a31e-8138470b3d91","type":"rect","connector":""},"type":"edge"}],"nodes":[{"id":"3de8e11f-93ad-44da-b3ce-18e6d46e0943","name":"My Instance","namespace":"","type":"poly","labels":[],"connector":[],"children":[],"bounds":{"x":816,"y":80}},{"id":"ea11ddc8-a93c-48d9-a5d5-235be450f726","name":"security.stuff","namespace":"","type":"rect","labels":null,"connector":[],"children":[],"bounds":{"x":912,"y":576}},{"id":"7423b25b-3150-4d17-b60c-6c84df01847b","name":"RabbitMQ","namespace":"","type":"poly","labels":null,"connector":[],"children":[],"bounds":{"x":1808,"y":544}},{"id":"a523ddc9-239f-40a4-9b9d-2318aa01604d","name":"payment.svc","namespace":"","type":"service","labels":null,"connector":[{"id":"1b3bcff3-b0de-407a-9f0f-0118d7efdf74","name":"","label":"/create"},{"id":"4b7b36eb-1306-4927-825a-b6dc453daf3e","name":"","label":"/execute"},{"id":"f5f4d7f9-e965-40d8-b563-8f7ea0d1a806","name":"","label":"/status"}],"children":[],"bounds":{"x":1462.1580810546875,"y":653.776123046875}},{"id":"af8a002a-8a3b-4881-a3c4-8dc3a30a99f4","name":"orders.svc","namespace":"","type":"service","labels":["k8s.io/app=orders","k8s.io/instance=canary"],"connector":[{"id":"9d4ab3d8-fbfc-4272-9d94-382f683dda24","name":"GRPC","label":"/create"},{"id":"dc8e6fe8-82d5-48b9-b797-73e1a401559e","name":"GRPC","label":"/status"}],"children":[],"bounds":{"x":1445.852783203125,"y":331.2359924316406}},{"id":"4b427594-93d6-45ae-a31e-8138470b3d91","name":"email.service","namespace":"","type":"rect","labels":null,"connector":[],"children":[],"bounds":{"x":1329.6192626953125,"y":181.9325408935547}},{"id":"b90a2d7e-45f5-4d05-9ca7-2cfe6e249fc9","name":"customer.svc","namespace":"","type":"service","labels":["k8s.io/app=customer","k8s.io/instance=default"],"connector":[{"id":"63ff3edd-eade-4952-a91d-104504731d91","name":"","label":"request-checkout"}],"children":[],"bounds":{"x":544.6876220703125,"y":500.30908203125}},{"id":"90e9ceef-1fe5-45fa-aab1-e29532fe352d","name":"checkout.svc","namespace":"","type":"service","labels":["k8s.io/app=checkout","k8s.io/instance=default"],"connector":[{"id":"169ac287-afcb-4fa2-baff-a7b3dc87c69e","name":"GRPC","label":"/create"},{"id":"8ab439e7-dd9f-48a2-9bb8-aecf491a8f5b","name":"GRPC","label":"/execute"},{"id":"55727d29-70cb-4406-a41f-c409673b5580","name":"HTTP · Deprecated","label":"/list"},{"id":"3519c1ee-ac10-49e6-a8bb-ecba16598edc","name":"PubSub","label":"/payment-update"}],"children":[],"bounds":{"x":982.6666259765625,"y":325.66668701171875}},{"id":"80902f3e-d676-4aa0-95c6-11c931a156f5","name":"frontend.svc","namespace":"","type":"rect","labels":null,"connector":[],"children":[],"bounds":{"x":800,"y":384}},{"id":"b33b99cf-cb3f-42ad-91c7-d32bce218bbc","name":"hooman","namespace":"","type":"poly","labels":[],"connector":[],"children":[],"bounds":{"x":928,"y":704}},{"id":"7f6fa89c-fd7a-42a6-bb25-f1e208282981","name":"foo-db","namespace":"","type":"database","labels":[],"connector":[],"children":[],"bounds":{"x":688,"y":272}},{"id":"7df649d7-5c26-4417-973a-dea439b81594","name":"node","namespace":"","type":"rect","labels":null,"connector":[],"children":null,"bounds":{"x":800,"y":288}},{"id":"2608513a-ee58-4ed9-bf59-872568a8074b","name":"The Big one with a lot of text","namespace":"","type":"diamond","labels":[],"connector":[],"children":[],"bounds":{"x":688,"y":128}},{"id":"3856334f-7aa1-42ba-a0d2-f0f37d7c7f41","name":"External","namespace":"","type":"cluster","labels":[],"connector":[],"children":["4b427594-93d6-45ae-a31e-8138470b3d91"],"bounds":{"x":1328,"y":112}}]}`
);
