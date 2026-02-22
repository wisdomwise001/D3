import React, { memo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";

interface StatItem {
  name: string;
  home: string;
  away: string;
  statisticsType: string;
}

interface StatGroup {
  groupName: string;
  statisticsItems: StatItem[];
}

interface StatPeriod {
  period: string;
  groups: StatGroup[];
}

interface StatisticsTabProps {
  eventId: string;
}

function StatisticsTab({ eventId }: StatisticsTabProps) {
  const [activePeriod, setActivePeriod] = useState("ALL");

  const { data, isLoading } = useQuery<{ statistics: StatPeriod[] }>({
    queryKey: ["/api/event", eventId, "statistics"],
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  const statistics = data?.statistics || [];

  if (statistics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Statistics not available</Text>
      </View>
    );
  }

  const periods = statistics.map((s) => s.period);
  const currentPeriod = statistics.find((s) => s.period === activePeriod) || statistics[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {periods.length > 1 && (
        <View style={styles.periodToggle}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodBtn, activePeriod === period && styles.periodBtnActive]}
              onPress={() => setActivePeriod(period)}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  activePeriod === period && styles.periodBtnTextActive,
                ]}
              >
                {period === "ALL" ? "Full Time" : period === "1ST" ? "1st Half" : "2nd Half"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {currentPeriod?.groups?.map((group, gi) => (
        <View key={gi} style={styles.groupCard}>
          <Text style={styles.groupTitle}>{group.groupName}</Text>
          {group.statisticsItems.map((item, si) => (
            <StatBar key={si} item={item} />
          ))}
        </View>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const StatBar = memo(({ item }: { item: StatItem }) => {
  const homeVal = parseFloat(item.home) || 0;
  const awayVal = parseFloat(item.away) || 0;
  const total = homeVal + awayVal || 1;
  const homePercent = (homeVal / total) * 100;
  const awayPercent = (awayVal / total) * 100;

  const isPercentage = item.home.includes("%") || item.away.includes("%");
  const homeDisplay = item.home;
  const awayDisplay = item.away;

  const homeWins = item.statisticsType === "positive" ? homeVal > awayVal : homeVal < awayVal;
  const awayWins = item.statisticsType === "positive" ? awayVal > homeVal : awayVal < homeVal;

  return (
    <View style={styles.statRow}>
      <Text style={[styles.statValue, homeWins && styles.statValueHighlight]}>
        {homeDisplay}
      </Text>
      <View style={styles.statCenter}>
        <Text style={styles.statName}>{item.name}</Text>
        <View style={styles.barContainer}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFillHome,
                { width: `${Math.max(homePercent, 2)}%` },
                homeWins && styles.barFillHomeActive,
              ]}
            />
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFillAway,
                { width: `${Math.max(awayPercent, 2)}%` },
                awayWins && styles.barFillAwayActive,
              ]}
            />
          </View>
        </View>
      </View>
      <Text style={[styles.statValue, awayWins && styles.statValueHighlight]}>
        {awayDisplay}
      </Text>
    </View>
  );
});

export default memo(StatisticsTab);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  periodToggle: {
    flexDirection: "row",
    marginHorizontal: 8,
    marginTop: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    overflow: "hidden",
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: Colors.dark.accent,
  },
  periodBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  periodBtnTextActive: {
    color: Colors.dark.text,
  },
  groupCard: {
    backgroundColor: Colors.dark.card,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  statValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    width: 40,
    textAlign: "center",
  },
  statValueHighlight: {
    color: Colors.dark.text,
    fontFamily: "Inter_600SemiBold",
  },
  statCenter: {
    flex: 1,
    gap: 4,
  },
  statName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  barContainer: {
    flexDirection: "row",
    gap: 2,
    height: 4,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFillHome: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
  },
  barFillHomeActive: {
    backgroundColor: Colors.dark.accent,
  },
  barFillAway: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
  },
  barFillAwayActive: {
    backgroundColor: Colors.dark.accent,
  },
});
