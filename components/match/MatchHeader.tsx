import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { getTeamImageUrl } from "@/lib/api";

interface MatchHeaderProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore?: number | null;
  awayScore?: number | null;
  statusType?: string;
  statusDescription?: string;
  startTimestamp?: number;
  tournamentName?: string;
  homeGoalScorers?: string[];
  awayGoalScorers?: string[];
}

function MatchHeader({
  homeTeamName,
  awayTeamName,
  homeTeamId,
  awayTeamId,
  homeScore,
  awayScore,
  statusType,
  statusDescription,
  startTimestamp,
  tournamentName,
  homeGoalScorers,
  awayGoalScorers,
}: MatchHeaderProps) {
  const insets = useSafeAreaInsets();
  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const topPadding = Platform.OS === "web" ? webTopPadding : insets.top;

  const hasScore = homeScore !== undefined && homeScore !== null;
  const isLive = statusType === "inprogress";
  const isFinished = statusType === "finished";

  const dateStr = startTimestamp
    ? (() => {
        const d = new Date(startTimestamp * 1000);
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, "0");
        const mins = d.getMinutes().toString().padStart(2, "0");
        return `${day}.${month}.${year}. \u2022 ${hours}:${mins}`;
      })()
    : "";

  let statusText = statusDescription || "";
  if (isFinished) statusText = "Finished";
  else if (isLive) statusText = statusDescription || "Live";

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        {tournamentName ? (
          <Text style={styles.tournamentName} numberOfLines={1}>
            {tournamentName}
          </Text>
        ) : null}
        <View style={styles.backButton} />
      </View>

      {dateStr ? (
        <View style={styles.datePill}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      ) : null}

      <View style={styles.scoreSection}>
        <View style={styles.teamBlock}>
          <Image
            source={{ uri: getTeamImageUrl(homeTeamId) }}
            style={styles.teamLogo}
            contentFit="contain"
            cachePolicy="disk"
          />
          <Text style={styles.teamNameText} numberOfLines={2}>
            {homeTeamName}
          </Text>
        </View>

        <View style={styles.scoreBlock}>
          {hasScore ? (
            <Text
              style={[
                styles.scoreText,
                isLive && styles.scoreLive,
              ]}
            >
              {homeScore} - {awayScore}
            </Text>
          ) : (
            <Text style={styles.vsText}>vs</Text>
          )}
          <Text
            style={[
              styles.statusText,
              isLive && styles.statusLive,
            ]}
          >
            {statusText}
          </Text>
        </View>

        <View style={styles.teamBlock}>
          <Image
            source={{ uri: getTeamImageUrl(awayTeamId) }}
            style={styles.teamLogo}
            contentFit="contain"
            cachePolicy="disk"
          />
          <Text style={styles.teamNameText} numberOfLines={2}>
            {awayTeamName}
          </Text>
        </View>
      </View>

      {(homeGoalScorers?.length || awayGoalScorers?.length) ? (
        <View style={styles.scorersRow}>
          <View style={styles.scorersSide}>
            {homeGoalScorers?.map((scorer, i) => (
              <Text key={`h-${i}`} style={styles.scorerText} numberOfLines={1}>
                {scorer}
              </Text>
            ))}
          </View>
          <View style={styles.scorersDivider} />
          <View style={[styles.scorersSide, styles.scorersSideRight]}>
            {awayGoalScorers?.map((scorer, i) => (
              <Text key={`a-${i}`} style={styles.scorerText} numberOfLines={1}>
                {scorer}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default memo(MatchHeader);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tournamentName: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  datePill: {
    alignSelf: "center",
    backgroundColor: Colors.dark.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  teamBlock: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 48,
    height: 48,
  },
  teamNameText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    textAlign: "center",
  },
  scoreBlock: {
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 4,
  },
  scoreText: {
    fontSize: 32,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  scoreLive: {
    color: Colors.dark.live,
  },
  vsText: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  statusLive: {
    color: Colors.dark.live,
    fontFamily: "Inter_600SemiBold",
  },
  scorersRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  scorersSide: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  scorersSideRight: {
    alignItems: "flex-start",
  },
  scorersDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 12,
  },
  scorerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
});
