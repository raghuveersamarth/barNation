import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function BarChartComponent({ data }) {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [{ data: data.map(d => d.value) }],
  };

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={340}
        height={220}
        chartConfig={{
          backgroundGradientFrom: '#000',
          backgroundGradientTo: '#070707',
          color: (opacity = 1) => `rgba(0, 255, 65, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
          barPercentage: 0.6,
        }}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 12 },
  chart: { borderRadius: 16 },
});
