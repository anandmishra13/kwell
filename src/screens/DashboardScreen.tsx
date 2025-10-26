import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fetchDashboardData } from '../services/dashboardService';
import Header from '../components/Header';
import { fonts } from '../theme/fonts';
import { colors } from '../theme/colors';
import { ProgressChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

export default function DashboardScreen() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const screenWidth = Dimensions.get('window').width;


  const loadDashboard = async () => {
    try {
      const data = await fetchDashboardData('user123'); // replace with dynamic user ID
      setDashboard(data);
    } catch (error) {
      console.log('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <Header />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading your insights...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Header onInfoPress={() => console.log('Info Pressed')} />

        <View style={styles.content}>
          <Text style={styles.title}>Your Emotional Wellness</Text>
          <ProgressChart
            data={{
              labels: ["Mood"], // optional labels
              data: [dashboard?.moodScore / 100],
            }}
            width={screenWidth - 40}
            height={220}
            strokeWidth={12}
            radius={90}
            chartConfig={{
              backgroundColor: '#7C3AED',
              backgroundGradientFrom: '#7C3AED',
              backgroundGradientTo: '#6D28D9',
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              strokeWidth: 2,
            }}
            hideLegend={true}
          />
          <Text style={styles.scoreText}>{dashboard?.moodScore ?? 0}%</Text>

          <View style={styles.cardsContainer}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Focus</Text>
              <Text style={styles.cardValue}>{dashboard?.avgFocus ?? 0}%</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Sleep</Text>
              <Text style={styles.cardValue}>{dashboard?.avgSleep ?? 0}h</Text>
            </View>
          </View>

          <View style={styles.insightContainer}>
            <Text style={styles.insightText}>{dashboard?.suggestion}</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontFamily: fonts.medium,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  scoreText: {
    position: 'absolute',
    top: 260,
    fontSize: 32,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  cardsContainer: {
    flexDirection: 'row',
    marginTop: 60,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: 140,
  },
  cardLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#7C3AED',
    marginBottom: 6,
  },
  cardValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#1F2937',
  },
  insightContainer: {
    marginTop: 24,
    paddingHorizontal: 28,
  },
  insightText: {
    textAlign: 'center',
    color: '#EDE9FE',
    fontFamily: fonts.book,
    fontSize: 15,
    lineHeight: 22,
  },
});