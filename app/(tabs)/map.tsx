import { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import * as Location from 'expo-location';
import A11yScreen from '@/components/a11y/A11yScreen';
import A11yText from '@/components/a11y/A11yText';
import A11yButton from '@/components/a11y/A11yButton';
import { fetchTactilePaving, TactilePavingNode } from '@/lib/map/osmTactilePaving';
import { speak } from '@/lib/speech/tts';
import Colors from '@/constants/Colors';
import A11Y from '@/constants/accessibility';

// Default to Tokyo Station
const DEFAULT_LAT = 35.6812;
const DEFAULT_LON = 139.7671;
const SEARCH_RADIUS = 0.005; // ~500m

export default function MapTab() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [pavingData, setPavingData] = useState<TactilePavingNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Use default location (Tokyo Station)
        setLocation({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    } catch {
      setLocation({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
    }
  };

  const searchNearby = async () => {
    if (!location) return;
    setIsLoading(true);
    setError(null);
    speak('近くの点字ブロックを検索中です。');

    try {
      const data = await fetchTactilePaving(
        location.lat - SEARCH_RADIUS,
        location.lon - SEARCH_RADIUS,
        location.lat + SEARCH_RADIUS,
        location.lon + SEARCH_RADIUS,
      );
      setPavingData(data);

      if (data.length === 0) {
        const msg = 'この付近に登録された点字ブロックは見つかりませんでした。あなたが最初の報告者になれます。';
        setError(msg);
        speak(msg);
      } else {
        speak(`${data.length}件の点字ブロックが見つかりました。`);
      }
    } catch {
      const msg = 'データの取得に失敗しました。インターネット接続を確認してください。';
      setError(msg);
      speak(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = () => {
    if (!location) return;
    // In a real app this would save to Supabase
    speak(`現在地の点字ブロック情報を記録しました。緯度${location.lat.toFixed(4)}、経度${location.lon.toFixed(4)}。ありがとうございます。`);
  };

  return (
    <A11yScreen
      title="盲道マップ"
      announceOnMount="盲道マップ画面です。点字ブロックの検索と報告ができます。"
    >
      <View style={styles.content}>
        {/* Status Info */}
        <View style={styles.statusCard}>
          <A11yText variant="caption">
            {location
              ? `現在地: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
              : '位置情報を取得中...'}
          </A11yText>
          {pavingData.length > 0 && (
            <A11yText variant="body" style={styles.countText}>
              {pavingData.length}件の点字ブロック
            </A11yText>
          )}
        </View>

        {/* Map placeholder for web / actual MapView for native */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.mapPlaceholder}>
              <A11yText variant="title" style={styles.mapIcon}>
                🗺
              </A11yText>
              <A11yText variant="body" style={styles.mapText}>
                地図はiOSアプリでご利用いただけます
              </A11yText>
              {pavingData.length > 0 && (
                <A11yText variant="caption" style={styles.dataInfo}>
                  {pavingData.length}件のデータを取得済み
                </A11yText>
              )}
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <A11yText variant="title" style={styles.mapIcon}>
                🗺
              </A11yText>
              <A11yText variant="body" style={styles.mapText}>
                地図を読み込み中...
              </A11yText>
            </View>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorCard}>
            <A11yText variant="body" style={styles.errorText}>
              {error}
            </A11yText>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <A11yButton
            label={isLoading ? '検索中...' : '近くの盲道を検索'}
            hint="現在地周辺500メートル以内の点字ブロックを検索します"
            size="big"
            onPress={searchNearby}
          />

          <A11yButton
            label="ここに盲道を報告"
            hint="現在地に点字ブロックがあることを報告します"
            variant="secondary"
            onPress={handleReport}
          />
        </View>

        {/* Data Stats */}
        <View style={styles.statsCard}>
          <A11yText variant="caption" style={styles.statsTitle}>
            盲道データについて
          </A11yText>
          <A11yText variant="caption">
            日本全国で約45,000件の点字ブロックがOpenStreetMapに登録されていますが、実際の設置数と比べてまだまだ不足しています。あなたの報告が、視覚障害者の安全な歩行に貢献します。
          </A11yText>
        </View>
      </View>
    </A11yScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: A11Y.SPACING.md,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.sm,
    padding: A11Y.SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  countText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  mapContainer: {
    height: 200,
    borderRadius: A11Y.RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: A11Y.SPACING.sm,
  },
  mapIcon: {
    fontSize: 48,
  },
  mapText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  dataInfo: {
    color: Colors.primary,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: A11Y.RADIUS.sm,
    padding: A11Y.SPACING.md,
  },
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: A11Y.SPACING.sm,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: A11Y.RADIUS.md,
    padding: A11Y.SPACING.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: A11Y.SPACING.xs,
  },
  statsTitle: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
