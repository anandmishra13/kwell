import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
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

const EMOTION_HEIGHTS: { [key: string]: number } = {
  joy: 34,
  optimism: 31,
  neutral: 23,
  approval: 16,
  anger: 8,
  sadness: 3,
};

const Y_AXIS_SECTIONS = [
  { title: 'JOY', heightRatio: 3 / 34 },
  { title: 'OPTIMISM', heightRatio: 8 / 34 },
  { title: 'NEUTRAL', heightRatio: 7 / 34 },
  { title: 'APPROVAL', heightRatio: 8 / 34 },
  { title: 'ANGER', heightRatio: 5 / 34 },
  { title: 'SAD', heightRatio: 3 / 34, hideRule: true },
];


const AnalyzeScreen = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, visible: false, emotion: '' });

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

  const handleBarPress = (index: number, emotion: string, layout: any) => {
    console.log(`🎯 Bar ${index} pressed - ${emotion}`);
    console.log('Layout:', layout);
    
    if (selectedIndex === index) {
      // Toggle off
      setSelectedIndex(null);
      setTooltipPosition({ x: 0, y: 0, visible: false, emotion: '' });
    } else {
      // Show tooltip
      setSelectedIndex(index);
      setTooltipPosition({
        x: layout.x + layout.width / 2,
        y: layout.y + 100,
        visible: true,
        emotion: emotion,
      });
    }
  };

  const renderYAxisLabels = () => {
    const chartHeight = SCREEN_HEIGHT * 0.5;

    return (
      <View style={[styles.yAxisContainer, { height: chartHeight }]}>
        {Y_AXIS_SECTIONS.map((section, index) => {
          const sectionHeight = chartHeight * section.heightRatio;

          return (
            <View key={index} style={[styles.yAxisSection, { height: sectionHeight }]}>
              <View style={styles.yAxisLabelWrapper}>
                <Text style={styles.yAxisText}>{section.title}</Text>
              </View>
              {!section.hideRule && (
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
          const barHeightPixels = (chartHeight * barHeightPercent) / 100;
          const isSelected = selectedIndex === index;

          return (
            <View
              key={index}
              style={[styles.barWrapper, { width: barWidth, marginRight: barSpacing }]}
              onLayout={(event) => {
                const layout = event.nativeEvent.layout;
                (data as any).layout = layout;
              }}
            >
              <TouchableWithoutFeedback
                onPress={() => {
                  const layout = (data as any).layout;
                  if (layout) {
                    handleBarPress(index, data.Emotion || 'NEUTRAL', {
                      ...layout,
                      y: chartHeight - barHeightPixels,
                    });
                  }
                }}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeightPixels,
                    },
                  ]}
                />
              </TouchableWithoutFeedback>

              <Text style={styles.dateLabel}>{getDay(data['Date with Timestamp'])}</Text>
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
          <Text style={styles.placeholderSubtitle}>Start recording to see analytics...</Text>
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
          <View style={styles.monthLabelContainer}>
            <Text style={styles.monthLabel}>
              {analytics[0] ? getMonth(analytics[0]['Date with Timestamp']) : ''}
            </Text>
          </View>

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

          {tooltipPosition.visible && (
            <View
              style={[
                styles.tooltipOverlay,
                {
                  left: tooltipPosition.x + 70,
                  bottom: SCREEN_HEIGHT * 0.5 - tooltipPosition.y + 60,
                },
              ]}
            >
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>{tooltipPosition.emotion.toUpperCase()}</Text>
              </View>
            </View>
          )}
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
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    height: SCREEN_HEIGHT * 0.2,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 25,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  mainContent: {
    flex: 1,
  },
  chartArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monthLabelContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 70,
  },
  monthLabel: {
    color: 'white',
    fontSize: 11.5,
    fontWeight: '400',
  },
  chartRow: {
    flexDirection: 'row',
    height: SCREEN_HEIGHT * 0.5,
  },
  yAxisContainer: {
    marginTop: -20,
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
    fontSize: 8.75,
    fontWeight: '500',
    transform: [{ rotate: '-90deg' }],
    width: 60,
    textAlign: 'center',
  },
  yAxisLineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: -1000,
    flexDirection: 'row',
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
    paddingHorizontal: 5,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: '#00FFF0',
    borderRadius: 2,
  },
  dateLabel: {
    color: 'white',
    fontSize: 11.5,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
  },
  tooltipOverlay: {
    position: 'absolute',
    zIndex: 9999,
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderStyle: 'solid',
    borderColor: 'white',
    borderWidth: 1
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  footer: {
    paddingVertical: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -50
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
    textTransform: 'uppercase',
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