import { supabase, isSupabaseConfigured } from '@/lib/storage/supabase';

export interface PavingReport {
  id: string;
  latitude: number;
  longitude: number;
  paving_type: 'warning' | 'guide' | 'unknown';
  condition: 'good' | 'damaged' | 'blocked' | 'unknown';
  note: string | null;
  verified: boolean;
  verified_count: number;
  created_at: string;
}

/**
 * Submit a tactile paving report to Supabase
 */
export async function submitPavingReport(
  latitude: number,
  longitude: number,
  pavingType: 'warning' | 'guide' | 'unknown' = 'unknown',
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    // Demo mode — simulate success
    return { success: true };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'ログインが必要です' };
  }

  const { error } = await supabase
    .from('tactile_paving_reports')
    .insert({
      user_id: user.id,
      latitude,
      longitude,
      paving_type: pavingType,
      note: note || null,
    });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Fetch crowdsourced paving reports near a location
 */
export async function fetchCrowdsourcedReports(
  lat: number,
  lon: number,
  radiusDeg: number = 0.005,
): Promise<PavingReport[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('tactile_paving_reports')
    .select('*')
    .gte('latitude', lat - radiusDeg)
    .lte('latitude', lat + radiusDeg)
    .gte('longitude', lon - radiusDeg)
    .lte('longitude', lon + radiusDeg)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return data as PavingReport[];
}
