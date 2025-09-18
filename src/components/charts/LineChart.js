import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export default function LineChartComponent({ data }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [{ data: data.map(d => d.value), strokeWidth: 2 }],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={340}
        height={220}
        chartConfig={{
          backgroundGradientFrom: '#000',
          backgroundGradientTo: '#070707',
          color: (opacity = 1) => `rgba(0, 255, 65, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
          strokeWidth: 2,
          decimalPlaces: 0,
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 12 },
  chart: { borderRadius: 16 },
});
