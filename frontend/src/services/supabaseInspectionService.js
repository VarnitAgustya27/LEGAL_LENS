import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Maps the directScan API result + currentUser into the Supabase inspections row shape.
 */
function mapResultToRow(result, currentUser) {
  const declarations = Array.isArray(result.declarations) ? result.declarations : [];
  const mfrDecl = declarations.find((d) => d.field === 'manufacturer');
  const manufacturer = mfrDecl?.value || result.manufacturer || null;

  const rawStatus = (result.status || 'REVIEW').toUpperCase();
  const status = ['COMPLIANT', 'NON_COMPLIANT', 'REVIEW'].includes(rawStatus)
    ? rawStatus
    : 'REVIEW';

  return {
    case_number: result.case_number || result.id || result.inspection_no,
    product_name: result.product || result.product_name || 'Packaged Commodity',
    category: result.category || 'Packaged Food',
    manufacturer,
    location: result.location || null,
    status,
    score: typeof result.score === 'number' ? result.score : 0,
    inspector_name: currentUser?.name || currentUser?.full_name || 'Authorized Officer',
    inspector_badge: currentUser?.badge || currentUser?.badge_number || null,
    inspector_email: currentUser?.email || null,
    declarations: declarations,
    violations: Array.isArray(result.violations) ? result.violations : [],
    images: Array.isArray(result.images) ? result.images : [],
    ocr_detections: Array.isArray(result.ocr_detections) ? result.ocr_detections : [],
    notes: result.notes || null,
    is_demo: false,
  };
}

/**
 * Save (upsert) a completed inspection result to Supabase.
 * Returns { data, error }.
 */
export async function saveInspection(result, currentUser) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[SupabaseInspectionService] Supabase not configured — inspection not saved.');
    return { data: null, error: new Error('Supabase not configured') };
  }

  const row = mapResultToRow(result, currentUser);

  if (!row.case_number) {
    console.warn('[SupabaseInspectionService] No case_number — skipping save.');
    return { data: null, error: new Error('Missing case_number') };
  }

  const { data, error } = await supabase
    .from('inspections')
    .upsert(row, { onConflict: 'case_number' })
    .select()
    .single();

  if (error) {
    console.error('[SupabaseInspectionService] Save failed:', error.message);
  } else {
    console.log('[SupabaseInspectionService] Saved inspection:', row.case_number);
  }

  return { data, error };
}

/**
 * Fetch inspections from Supabase with optional filters.
 * @param {{ status, category, search, limit }} params
 * Returns { data: Row[], error }
 */
export async function fetchInspections({ status = 'ALL', category = '', search = '', limit = 100 } = {}) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  let query = supabase
    .from('inspections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.or(
      `case_number.ilike.%${search}%,product_name.ilike.%${search}%,manufacturer.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('[SupabaseInspectionService] Fetch failed:', error.message);
  }
  return { data, error };
}

/**
 * Fetch a single inspection's full data (all columns including JSONB) by case_number.
 * Returns { data: FullRow, error }
 */
export async function fetchInspectionByCase(caseNumber) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('case_number', caseNumber)
    .single();

  if (error) {
    console.error('[SupabaseInspectionService] Full fetch failed:', error.message);
  }
  return { data, error };
}

/**
 * Normalise a full Supabase inspections row into the shape InspectionDetail expects.
 * (Supabase uses snake_case; InspectionDetail reads camelCase/mixed fields from directScan)
 */
const MISSING_IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='100%' height='100%' fill='%230f172a'/><g transform='translate(250, 140)' stroke='%23475569' stroke-width='2' fill='none'><rect x='0' y='0' width='100' height='80' rx='8'/><circle cx='35' cy='30' r='12'/><path d='M10,70 L40,40 L65,65 L80,50 L90,70'/></g><text x='300' y='250' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14' font-weight='600'>Image File Not Found on Server</text><text x='300' y='275' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='12'>Uploaded file path is not present on disk</text></svg>";

function cleanImageUrl(img) {
  if (!img) return MISSING_IMAGE_PLACEHOLDER;
  if (typeof img === 'object' && img.supabase_url && String(img.supabase_url).startsWith('http')) {
    return img.supabase_url;
  }
  let url = typeof img === 'string' ? img : (img.supabase_url || img.url || img.image_url);
  if (url && String(url).startsWith('http')) return url;

  const orig = typeof img === 'object' ? img.original_path : null;

  if ((!url || url.includes(":\\")) && orig) {
    const rel = orig.replace(/\\/g, "/").split("/uploads/")[1];
    url = rel ? `/uploads/${rel}` : orig;
  }
  if (url && url.includes(":\\")) {
    const rel = url.replace(/\\/g, "/").split("/uploads/")[1];
    if (rel) url = `/uploads/${rel}`;
  }
  if (url && typeof url === 'string' && url.startsWith('/uploads/')) {
    const rawApi = import.meta.env.VITE_API_BASE_URL;
    if (rawApi && rawApi.startsWith('http')) {
      const backendRoot = rawApi.replace(/\/api\/?$/, '');
      url = `${backendRoot}${url}`;
    }
  }
  return url || MISSING_IMAGE_PLACEHOLDER;
}

/**
 * Normalise a full Supabase inspections row into the shape InspectionDetail expects.
 * (Supabase uses snake_case; InspectionDetail reads camelCase/mixed fields from directScan)
 */
export function mapSupabaseRowToInspection(row) {
  if (!row) return null;
  const rawImages = Array.isArray(row.images) ? row.images : [];
  const images = rawImages.map((img) => ({
    id: img.id || `img_${Math.random()}`,
    angle: img.image_type || img.angle || "FRONT",
    image_type: img.image_type || img.angle || "FRONT",
    url: cleanImageUrl(img),
    original_path: img.original_path,
    quality_status: img.quality_status || "GOOD"
  }));

  return {
    // Identity
    case_number: row.case_number,
    id: row.case_number,
    // Product
    product: row.product_name,
    product_name: row.product_name,
    category: row.category,
    manufacturer: row.manufacturer,
    location: row.location,
    // Status / Score
    status: row.status,
    score: row.score,
    // Inspector
    inspector_name: row.inspector_name,
    inspector: row.inspector_name,
    inspector_badge: row.inspector_badge,
    // Dates
    date: row.created_at ? String(row.created_at).slice(0, 10) : null,
    created_at: row.created_at,
    // Full JSONB payloads — these are what InspectionDetail renders
    declarations: Array.isArray(row.declarations) ? row.declarations : [],
    violations: Array.isArray(row.violations) ? row.violations : [],
    images: images,
    ocr_detections: Array.isArray(row.ocr_detections) ? row.ocr_detections : [],
    // Extras
    notes: row.notes,
    is_demo: row.is_demo,
  };
}

export function mapBackendInspectionToFrontend(data) {
  if (!data) return null;
  const declarations = (data.declarations || []).map((d) => ({
    field: d.field,
    label: d.label || d.field,
    value: d.value,
    raw_text: d.raw_text || d.value,
    confidence: d.confidence || 0.95,
    status: d.status || "PASS",
    is_present: Boolean(d.value),
    bbox: d.bbox,
    image_id: d.image_id
  }));

  const violations = (data.violations || []).map((v) => ({
    rule_code: v.rule_code || "PCR-MRP-001",
    field: v.field || "mrp",
    status: v.status || "FAIL",
    severity: v.severity || "HIGH",
    message: v.message || "",
    expected: v.expected,
    detected: v.detected,
    statutory_reference: v.statutory_reference
  }));

  const images = (data.images || []).map((img) => ({
    id: img.id,
    angle: img.image_type || "FRONT",
    image_type: img.image_type || "FRONT",
    url: cleanImageUrl(img),
    original_path: img.original_path,
    quality_status: img.quality_status || "GOOD"
  }));

  return {
    id: data.case_number || data.id,
    case_number: data.case_number,
    product: data.product?.name || data.product_name || "Packaged Commodity",
    product_name: data.product?.name || data.product_name || "Packaged Commodity",
    category: data.product?.category || data.category || "Packaged Food",
    status: data.status || "REVIEW",
    score: data.score || 0.0,
    readability_score: data.readability_score || 95.0,
    inspector_name: data.inspector_name || data.inspector?.full_name || "Enforcement Officer",
    inspector: data.inspector_name || data.inspector?.full_name || "Enforcement Officer",
    location: data.location || "New Delhi, Delhi",
    date: data.created_at ? String(data.created_at).slice(0, 10) : "2026-08-31",
    created_at: data.created_at,
    declarations,
    violations,
    images
  };
}

/**
 * Fetch aggregated metrics and recent inspections for the Enforcement Dashboard.
 */
export async function fetchDashboardStats() {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[SupabaseInspectionService] fetchDashboardStats failed:', error?.message);
    return { data: null, error };
  }

  const total = data.length;
  const compliant = data.filter((i) => i.status === 'COMPLIANT').length;
  const nonCompliant = data.filter((i) => i.status === 'NON_COMPLIANT').length;
  const review = data.filter((i) => i.status === 'REVIEW').length;

  // Violations by Category
  const catMap = {};
  data.forEach((i) => {
    const cat = i.category || 'Packaged Food';
    if (!catMap[cat]) catMap[cat] = 0;
    if (i.status === 'NON_COMPLIANT' || i.status === 'REVIEW') {
      const vCount = Array.isArray(i.violations) && i.violations.length > 0 ? i.violations.length : 1;
      catMap[cat] += vCount;
    }
  });

  const violationsByCategory = Object.entries(catMap).map(([category, violations]) => ({
    category,
    violations,
  }));

  // Daily Inspection Trend (last 7 days)
  const last7Days = [];
  const dayCounts = {};
  const today = new Date();

  for (let d = 6; d >= 0; d--) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    const key = dt.toISOString().slice(0, 10);
    const label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    last7Days.push({ key, label });
    dayCounts[key] = 0;
  }

  data.forEach((i) => {
    if (!i.created_at) return;
    const key = String(i.created_at).slice(0, 10);
    if (dayCounts[key] !== undefined) {
      dayCounts[key] += 1;
    }
  });

  const trend = last7Days.map(({ key, label }) => ({
    day: label,
    inspections: dayCounts[key] || 0,
  }));

  // Common Violations
  const ruleCounts = {};
  data.forEach((i) => {
    if (Array.isArray(i.violations)) {
      i.violations.forEach((v) => {
        const code = v.rule_code || v.rule || v.key || 'PCR-MRP-001';
        const desc = v.reason || v.description || v.label || 'Mandatory declaration missing';
        if (!ruleCounts[code]) ruleCounts[code] = { rule: code, desc, count: 0 };
        ruleCounts[code].count += 1;
      });
    }
  });

  const commonViolations = Object.values(ruleCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  const recentInspections = data.slice(0, 5).map(mapSupabaseRowToInspection);

  return {
    data: {
      stats: { total, compliant, nonCompliant, review },
      violationsByCategory,
      trend,
      commonViolations,
      recentInspections,
    },
    error: null,
  };
}

/**
 * Fetch reports directly from Supabase PostgreSQL public.reports table.
 */
export async function fetchReportsFromSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[SupabaseInspectionService] fetchReportsFromSupabase failed:', error.message);
  }
  return { data, error };
}

