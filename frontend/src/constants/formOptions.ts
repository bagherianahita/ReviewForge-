/** Preset options for all form fields — selectable defaults */

export const DESIGN_TEMPLATES = [
  {
    name: 'Engine Mount Bracket',
    description: 'Structural bracket with weld access and thin-wall zones for SAGD module',
  },
  {
    name: 'Radiator Housing Assembly',
    description: 'Thermal housing with FEA-critical wall thickness and cooling fins',
  },
  {
    name: 'Hydraulic Pipe Manifold',
    description: 'High-pressure routing manifold with port clearance constraints',
  },
  {
    name: 'Pump Impeller Casting',
    description: 'Centrifugal impeller with blade root fillet and draft angle checks',
  },
  {
    name: 'Custom Assembly',
    description: 'User-defined mechanical component for virtual design review',
  },
] as const;

export const MESH_FILE_TYPES = [
  { value: 'stl', label: 'STL — Stereolithography (recommended)' },
  { value: 'obj', label: 'OBJ — Wavefront mesh' },
  { value: 'ply', label: 'PLY — Polygon file' },
  { value: 'glb', label: 'GLB — Binary glTF' },
] as const;

export const REVIEWER_ROLES = [
  { value: 'SME — Welding', label: 'SME — Welding & Fabrication' },
  { value: 'SME — Structural', label: 'SME — Structural Analysis' },
  { value: 'SME — Hydraulics', label: 'SME — Hydraulics & Piping' },
  { value: 'Design Engineer', label: 'Design Engineer' },
  { value: 'Quality Inspector', label: 'Quality Inspector' },
  { value: 'You', label: 'You (Demo User)' },
] as const;

export const COMMENT_TEMPLATES = [
  { value: '', label: '— Select comment template —' },
  {
    value: 'Weld access is restricted at the inner fillet — recommend slot opening.',
    label: 'Weld access concern',
  },
  {
    value: 'Wall thickness below 3mm at highlighted zone — verify with FEA.',
    label: 'Thin wall — FEA required',
  },
  {
    value: 'Port spacing meets hydraulic routing standard — approved for next gate.',
    label: 'Hydraulic routing approved',
  },
  {
    value: 'Non-watertight mesh detected — repair before mass properties run.',
    label: 'Mesh integrity issue',
  },
  {
    value: 'Consider adding draft angle on vertical faces for casting release.',
    label: 'Manufacturing draft angle',
  },
] as const;

export const ANNOTATION_SEVERITY = [
  { value: 'info', label: 'Info — observation' },
  { value: 'warning', label: 'Warning — needs review' },
  { value: 'critical', label: 'Critical — release blocker' },
] as const;

export const LESSON_SEARCH_PRESETS = [
  { value: 'welding bracket clearance', label: 'Welding bracket clearance' },
  { value: 'thin wall FEA housing', label: 'Thin wall / FEA housing' },
  { value: 'hydraulic pipe routing', label: 'Hydraulic pipe routing' },
  { value: 'weld access fillet', label: 'Weld access & fillet' },
  { value: 'casting draft angle', label: 'Casting draft angle' },
  { value: 'non-watertight mesh repair', label: 'Mesh watertightness' },
] as const;

export const AUTOREVIEW_OPTIONS = [
  { value: 'full', label: 'Full AutoReview — geometry + optional LLM' },
  { value: 'geometry', label: 'Geometry rules only (GEO-*)' },
  { value: 'quick', label: 'Quick scan — watertight + bounds' },
] as const;

export const DESIGN_CATEGORIES = [
  'Structural',
  'Thermal',
  'Hydraulics',
  'Casting',
  'Assembly',
] as const;
