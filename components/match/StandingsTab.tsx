import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getTeamImageUrl } from "@/lib/api";

interface StandingRow {
  position: number;
  team: { id: number; shortName: string; name?: string };
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  scoresFor: number;
  scoresAgainst: number;
  points: number;
  promotion?: { text: string };
}

interface StandingsTabProps {
  uniqueTournamentId: string;
  seasonId: string;
  homeTeamId: number;
  awayTeamId: number;
}

function StandingsTab({
  uniqueTournamentId,
  seasonId,
  homeTeamId,
  awayTeamId,
}: StandingsTabProps) {
  const { data, isLoading } = useQuery<{ standings: { rows: StandingRow[] }[] }>({
    queryKey: [
      "/api/unique-tournament",
      uniqueTournamentId,
      "season",
      seasonId,
      "standings",
      "total",
    ],
    enabled: !!uniqueTournamentId && !!seasonId,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  const rows = data?.standings?.[0]?.rows || [];

  if (rows.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Standings not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.tableCard}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.posCol]}>#</Text>
          <Text style={[styles.headerCell, styles.teamCol]}>Team</Text>
          <Text style={[styles.headerCell, styles.numCol]}>P</Text>
          <Text style={[styles.headerCell, styles.numCol]}>W</Text>
          <Text style={[styles.headerCell, styles.numCol]}>D</Text>
          <Text style={[styles.headerCell, styles.numCol]}>L</Text>
          <Text style={[styles.headerCell, styles.diffCol]}>Diff</Text>
          <Text style={[styles.headerCell, styles.ptsCol]}>PTS</Text>
        </View>

        {rows.map((row, index) => {
          const isHighlighted =
            row.team.id === homeTeamId || row.team.id === awayTeamId;
          const diff = row.scoresFor - row.scoresAgainst;
          const diffStr = diff > 0 ? `+${diff}` : `${diff}`;

          let promoColor: string | null = null;
          if (row.promotion?.text) {
            const promoLower = row.promotion.text.toLowerCase();
            if (promoLower.includes("champions league") || promoLower.includes("promotion")) {
              promoColor = Colors.dark.accent;
            } else if (promoLower.includes("europa league")) {
              promoColor = "#FF6B35";
            } else if (promoLower.includes("conference league")) {
              promoColor = "#4CAF50";
            } else if (promoLower.includes("relegation")) {
              promoColor = Colors.dark.live;
            } else {
              promoColor = Colors.dark.textTertiary;
            }
          }

          return (
            <View
              key={index}
              style={[
                styles.dataRow,
                isHighlighted && styles.highlightedRow,
                index < rows.length - 1 && styles.rowBorder,
              ]}
            >
              <View style={[styles.posCol, styles.posContainer]}>
                {promoColor && <View style={[styles.promoIndicator, { backgroundColor: promoColor }]} />}
                <Text style={[styles.dataCell, styles.posText]}>{row.position}</Text>
              </View>
              <View style={[styles.teamCol, styles.teamContainer]}>
                <Image
                  source={{ uri: getTeamImageUrl(row.team.id) }}
                  style={styles.teamLogo}
                  contentFit="contain"
                  cachePolicy="disk"
                />
                <Text
                  style={[styles.dataCell, styles.teamName, isHighlighted && styles.highlightedText]}
                  numberOfLines={1}
                >
                  {row.team.shortName || row.team.name}
                </Text>
              </View>
              <Text style={[styles.dataCell, styles.numCol]}>{row.matches}</Text>
              <Text style={[styles.dataCell, styles.numCol]}>{row.wins}</Text>
              <Text style={[styles.dataCell, styles.numCol]}>{row.draws}</Text>
              <Text style={[styles.dataCell, styles.numCol]}>{row.losses}</Text>
              <Text style={[styles.dataCell, styles.diffCol, diff > 0 && styles.diffPositive, diff < 0 && styles.diffNegative]}>
                {diffStr}
              </Text>
              <Text style={[styles.dataCell, styles.ptsCol, styles.ptsText]}>{row.points}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

export default memo(StandingsTab);

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
  tableCard: {
    backgroundColor: Colors.dark.card,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  headerCell: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textTertiary,
    textAlign: "center",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  highlightedRow: {
    backgroundColor: "rgba(61, 123, 244, 0.1)",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  dataCell: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  posCol: {
    width: 28,
  },
  posContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoIndicator: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
    marginRight: 4,
  },
  posText: {
    flex: 1,
  },
  teamCol: {
    flex: 1,
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamLogo: {
    width: 18,
    height: 18,
  },
  teamName: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
    textAlign: "left",
  },
  highlightedText: {
    fontFamily: "Inter_600SemiBold",
  },
  numCol: {
    width: 26,
  },
  diffCol: {
    width: 34,
  },
  ptsCol: {
    width: 30,
  },
  ptsText: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  diffPositive: {
    color: Colors.dark.win,
  },
  diffNegative: {
    color: Colors.dark.live,
  },
});
