import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_URL = __DEV__
  ? 'https://devapi.qwell.app/api/'
  : 'https://api.qwell.app/api/';

interface AnalyticsData {
  'Date with Timestamp': string;
  'Binaural Duration'?: number;
  'Emotion'?: string;
}

// Emotion heights (matching Swift code)
const EMOTION_HEIGHTS: { [key: string]: number } = {
  sadness: 3,
  anger: 8,
  approval: 16,
  neutral: 23,
  optimism: 31,
  joy: 34,
};

const AnalyzeScreen = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const deviceId = await DeviceInfo.getUniqueId();

      const response = await fetch(`${BASE_URL}fetch-data/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          number_of_records: 5,
          device_id: deviceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Analytics data:', data);

      const analyticsArray = data.Analytics || [];
      setAnalytics(analyticsArray.reverse());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDay = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.getDate().toString();
  };

  const getMonth = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  };

  const renderYAxisLabels = () => {
    const chartHeight = SCREEN_HEIGHT * 0.5;
    const labels = [
      { title: 'JOY', heightRatio: 3 / 34 },
      { title: 'OPTIMISM', heightRatio: 8 / 34 },
      { title: 'NEUTRAL', heightRatio: 7 / 34 },
      { title: 'APPROVAL', heightRatio: 8 / 34 },
      { title: 'ANGER', heightRatio: 5 / 34 },
      { title: 'SAD', heightRatio: 3 / 34, hideRule: true },
    ];

    return (
      <View style={[styles.yAxisContainer, { height: chartHeight }]}>
        {labels.map((label, index) => {
          const sectionHeight = chartHeight * label.heightRatio;
          
          return (
            <View
              key={index}
              style={[styles.yAxisSection, { height: sectionHeight }]}
            >
              <View style={styles.yAxisLabelWrapper}>
                <Text style={styles.yAxisText}>{label.title}</Text>
              </View>
              {!label.hideRule && (
                <View style={styles.yAxisLineContainer}>
                  <View style={styles.yAxisLineDash} />
                  <View style={styles.yAxisLineFull} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderChart = () => {
    if (analytics.length === 0) return null;

    const chartHeight = SCREEN_HEIGHT * 0.5;
    const maxHeight = 34;
    const barWidth = analytics.length <= 2 ? 35 : 25;
    const barSpacing = 5;

    return (
      <View style={[styles.barsContainer, { height: chartHeight }]}>
        {analytics.map((data, index) => {
          const emotion = data.Emotion?.toLowerCase() || 'neutral';
          const emotionHeight = EMOTION_HEIGHTS[emotion] || 0;
          const barHeightPercent = (emotionHeight / maxHeight) * 100;

          return (
            <View
              key={index}
              style={[styles.barWrapper, { width: barWidth, marginRight: barSpacing }]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedBar(selectedBar === index ? null : index)}
                style={styles.barTouchable}
              >
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${barHeightPercent}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dateLabel}>
                  {getDay(data['Date with Timestamp'])}
                </Text>
              </TouchableOpacity>
              {selectedBar === index && (
                <View style={[styles.tooltip, { bottom: `${barHeightPercent}%` }]}>
                  <Text style={styles.tooltipText}>
                    {data.Emotion?.toUpperCase() || 'NEUTRAL'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analyze emotion</Text>
          <Text style={styles.subtitle}>in your voice</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  if (analytics.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analyze emotion</Text>
          <Text style={styles.subtitle}>in your voice</Text>
        </View>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>⚠️</Text>
          <Text style={styles.placeholderTitle}>Oops! No data available!</Text>
          <Text style={styles.placeholderSubtitle}>
            Start recording to see analytics...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analyze emotion</Text>
        <Text style={styles.subtitle}>in your voice</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.chartArea}>
          <Text style={styles.monthLabel}>
            {analytics[0] ? getMonth(analytics[0]['Date with Timestamp']) : ''}
          </Text>

          <View style={styles.chartRow}>
            {renderYAxisLabels()}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
            >
              {renderChart()}
            </ScrollView>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.legend}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>EMOTIONAL AFFECT</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B00F5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 25,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.2,
    marginTop: 5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartArea: {
    flex: 1,
  },
  monthLabel: {
    color: 'white',
    fontSize: 11.5,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 10,
  },
  chartRow: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxisContainer: {
    width: 70,
    justifyContent: 'space-between',
    paddingBottom: 35,
  },
  yAxisSection: {
    justifyContent: 'space-between',
  },
  yAxisLabelWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: -22,
  },
  yAxisText: {
    color: 'white',
    fontSize: 8.5,
    fontWeight: '500',
    letterSpacing: 0.5,
    transform: [{ rotate: '-90deg' }],
    width: 60,
    textAlign: 'center',
  },
  yAxisLineContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  yAxisLineDash: {
    height: 1,
    width: 16,
    backgroundColor: 'white',
  },
  yAxisLineFull: {
    height: 1,
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 35,
    paddingRight: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  barTouchable: {
    width: '100%',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#00FFF0',
    borderRadius: 2,
  },
  tooltip: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    
  },
  tooltipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateLabel: {
    color: 'white',
    fontSize: 11.5,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#00FFF0',
    marginRight: 10,
  },
  legendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
  },
});

export default AnalyzeScreen;