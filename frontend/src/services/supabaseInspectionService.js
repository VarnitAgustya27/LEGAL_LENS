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
    case_number:     result.case_number || result.id || result.inspection_no,
    product_name:    result.product || result.product_name || 'Packaged Commodity',
    category:        result.category || 'Packaged Food',
    manufacturer,
    location:        result.location || null,
    status,
    score:           typeof result.score === 'number' ? result.score : 0,
    inspector_name:  currentUser?.name || currentUser?.full_name || 'Authorized Officer',
    inspector_badge: currentUser?.badge || currentUser?.badge_number || null,
    inspector_email: currentUser?.email || null,
    declarations:    declarations,
    violations:      Array.isArray(result.violations)      ? result.violations      : [],
    images:          Array.isArray(result.images)          ? result.images          : [],
    ocr_detections:  Array.isArray(result.ocr_detections)  ? result.ocr_detections  : [],
    notes:           result.notes || null,
    is_demo:         false,
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
    .select('id, case_number, product_name, category, manufacturer, location, status, score, inspector_name, inspector_badge, is_demo, created_at')
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
export function mapSupabaseRowToInspection(row) {
  if (!row) return null;
  return {
    // Identity
    case_number:    row.case_number,
    id:             row.case_number,
    // Product
    product:        row.product_name,
    product_name:   row.product_name,
    category:       row.category,
    manufacturer:   row.manufacturer,
    location:       row.location,
    // Status / Score
    status:         row.status,
    score:          row.score,
    // Inspector
    inspector_name: row.inspector_name,
    inspector:      row.inspector_name,
    inspector_badge: row.inspector_badge,
    // Dates
    date:           row.created_at ? String(row.created_at).slice(0, 10) : null,
    created_at:     row.created_at,
    // Full JSONB payloads — these are what InspectionDetail renders
    declarations:   Array.isArray(row.declarations)   ? row.declarations   : [],
    violations:     Array.isArray(row.violations)     ? row.violations     : [],
    images:         Array.isArray(row.images)         ? row.images         : [],
    ocr_detections: Array.isArray(row.ocr_detections) ? row.ocr_detections : [],
    // Extras
    notes:          row.notes,
    is_demo:        row.is_demo,
  };
}
