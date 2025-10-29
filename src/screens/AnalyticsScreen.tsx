import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Fonts } from '../theme/fonts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_URL = __DEV__
  ? 'https://devapi.qwell.app/api/'
  : 'https://api.qwell.app/api/';

interface AnalyticsData {
  'Date with Timestamp': string;
  'Binaural Duration'?: number;
  'Emotion'?: string;
}

// Emotion heights (matching Swift code exactly)
const EMOTION_HEIGHTS: { [key: string]: number } = {
  joy: 34,
  optimism: 31,
  neutral: 23,
  approval: 16,
  anger: 8,
  sadness: 3,
};

// Y-axis section heights (matching Swift proportions exactly)
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
  
  const chartRef = useRef<View>(null);
  const [chartLayout, setChartLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

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
      console.log('Analytics ', data);

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

  // Pan responder for touch interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.locationX);  // Touch starts
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);  // Dragging
      },
      onPanResponderRelease: () => {
        // Tooltip stays visible (matching Swift behavior)
      },
    })
  ).current;

  const handleTouch = (touchX: number) => {
      const barWidth = chartLayout.width / analytics.length;
      const index = Math.floor(touchX / barWidth);  // Get bar index
      
      if (index >= 0 && index < analytics.length) {
        setSelectedIndex(index);  // Show tooltip for this bar
      }
  };

  const renderYAxisLabels = () => {
    const chartHeight = SCREEN_HEIGHT * 0.5;

    return (
      <View style={[styles.yAxisContainer, { height: chartHeight }]}>
        {Y_AXIS_SECTIONS.map((section, index) => {
          const sectionHeight = chartHeight * section.heightRatio;

          return (
            <View
              key={index}
              style={[styles.yAxisSection, { height: sectionHeight }]}
            >
              <View style={styles.yAxisLabelWrapper}>
                <Text style={[styles.yAxisText, Fonts.GothamMedium]}>{section.title}</Text>
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
          const isSelected = selectedIndex === index;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              onPress={() => {
                setSelectedIndex(isSelected ? null : index);
              }}
              style={[
                styles.barWrapper,
                { width: barWidth, marginRight: barSpacing },
              ]}
            >
              {/* Tooltip - positioned absolutely above bar */}
              {isSelected && (
                <View
                  style={[
                    styles.tooltip,
                    {
                      bottom: barHeightPercent + '%',
                      marginBottom: 10,
                    },
                  ]}
                >
                  <View style={styles.tooltipArrow} />
                  <Text style={styles.tooltipText}>
                    {data.Emotion?.toUpperCase() || 'NEUTRAL'}
                  </Text>
                </View>
              )}

              {/* Bar */}
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

              {/* Date label */}
              <Text style={styles.dateLabel}>
                {getDay(data['Date with Timestamp'])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, Fonts.GothamBold]}>Analyze emotion</Text>
          <Text style={[styles.subtitle, Fonts.GothamMedium]}>in your voice</Text>
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
          <Text style={[styles.title, Fonts.GothamBold]}>Analyze emotion</Text>
          <Text style={[styles.subtitle, Fonts.GothamMedium]}>in your voice</Text>
        </View>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>⚠️</Text>
          <Text style={[styles.placeholderTitle, Fonts.GothamLight]}>Oops! No data available!</Text>
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
          {/* Month label - positioned at bottom of Y-axis */}
          <View style={styles.monthLabelContainer}>
            <Text style={styles.monthLabel}>
              {analytics[0] ? getMonth(analytics[0]['Date with Timestamp']) : ''}
            </Text>
          </View>

          {/* Chart area with Y-axis and bars */}
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

        {/* Footer with legend */}
        <View style={styles.footer}>
          <View style={styles.legend}>
            <View style={styles.legendDot} />
            <Text style={[styles.legendText, Fonts.GothamMedium]}>EMOTIONAL AFFECT</Text>
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
    // paddingHorizontal: 20,
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
    letterSpacing: 0.3,
  },
  chartRow: {
    flexDirection: 'row',
    height: SCREEN_HEIGHT * 0.5,
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
    fontSize: 8.75,
    fontWeight: '500',
    letterSpacing: 0.5,
    transform: [{ rotate: '-90deg' }],
    width: 60,
    textAlign: 'center',
  },
  yAxisLineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: Dimensions.get('window').width - 40,
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
  tooltipArrow: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.85)',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 5,
    position: 'absolute'
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    backgroundColor: '#00FFF0',
    borderRadius: 2,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10000,
    minWidth: 60,
    alignSelf: 'center',
  },
  tooltipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  dateLabel: {
    color: 'white',
    fontSize: 11.5,
    fontWeight: '400',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    paddingBottom: 40,
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
