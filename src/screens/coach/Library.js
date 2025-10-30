import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ExerciseLibraryTab from '../../components/library/ExerciseLibraryTab';
import WorkoutTemplatesTab from '../../components/library/WorkoutTemplatesTab';
import ClientVideosTab from '../../components/library/ClientVideosTab';

export default function Library({ navigation }) {
  const [activeTab, setActiveTab] = useState('exercises');

  const tabs = [
    { id: 'exercises', label: 'My Exercises', icon: '💪' },
    { id: 'templates', label: 'Workout Templates', icon: '📋' },
    { id: 'videos', label: 'Client Videos', icon: '🎥' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'exercises':
        return <ExerciseLibraryTab navigation={navigation} />;
      case 'templates':
        return <WorkoutTemplatesTab navigation={navigation} />;
      case 'videos':
        return <ClientVideosTab navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Library</Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.id && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    backgroundColor: '#0a0a0a',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00ff41',
  },
  tabIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
  },
  activeTabLabel: {
    color: '#00ff41',
  },
});
