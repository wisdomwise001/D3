import React, { memo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getPlayerImageUrl } from "@/lib/api";

interface PlayerData {
  player: { shortName?: string; id?: number; name?: string };
  position: string;
  substitute: boolean;
  jerseyNumber: number;
  statistics: { rating?: number };
}

interface LineupTeam {
  formation?: string;
  players: PlayerData[];
  missingPlayers?: { player: { shortName?: string; id?: number }; type?: string; reason?: string }[];
}

interface LineupsResponse {
  home: LineupTeam;
  away: LineupTeam;
  confirmed: boolean;
}

interface LineupsTabProps {
  eventId: string;
  homeTeamName: string;
  awayTeamName: string;
}

function LineupsTab({ eventId, homeTeamName, awayTeamName }: LineupsTabProps) {
  const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");

  const { data, isLoading } = useQuery<LineupsResponse>({
    queryKey: ["/api/event", eventId, "lineups"],
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  if (!data?.home && !data?.away) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Lineups not available</Text>
      </View>
    );
  }

  const team = activeTeam === "home" ? data?.home : data?.away;
  const teamName = activeTeam === "home" ? homeTeamName : awayTeamName;
  const starters = team?.players?.filter((p) => !p.substitute) || [];
  const subs = team?.players?.filter((p) => p.substitute) || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.teamToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTeam === "home" && styles.toggleBtnActive]}
          onPress={() => setActiveTeam("home")}
        >
          <Text
            style={[styles.toggleText, activeTeam === "home" && styles.toggleTextActive]}
          >
            {homeTeamName}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTeam === "away" && styles.toggleBtnActive]}
          onPress={() => setActiveTeam("away")}
        >
          <Text
            style={[styles.toggleText, activeTeam === "away" && styles.toggleTextActive]}
          >
            {awayTeamName}
          </Text>
        </TouchableOpacity>
      </View>

      {team?.formation && (
        <View style={styles.formationCard}>
          <Text style={styles.formationLabel}>Formation</Text>
          <Text style={styles.formationText}>{team.formation}</Text>
        </View>
      )}

      {data?.confirmed === false && (
        <View style={styles.unconfirmedBanner}>
          <Text style={styles.unconfirmedText}>Predicted lineups</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Starting XI</Text>
        {starters.map((p, i) => (
          <PlayerRow key={i} player={p} />
        ))}
      </View>

      {subs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Substitutes</Text>
          {subs.map((p, i) => (
            <PlayerRow key={i} player={p} />
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const PlayerRow = memo(({ player }: { player: PlayerData }) => {
  const rating = player.statistics?.rating;
  const isHighRating = rating && rating >= 7.5;

  return (
    <View style={styles.playerRow}>
      <View style={styles.jerseyBadge}>
        <Text style={styles.jerseyNumber}>{player.jerseyNumber}</Text>
      </View>
      <Image
        source={{ uri: getPlayerImageUrl(player.player?.id || 0) }}
        style={styles.playerImage}
        contentFit="cover"
        cachePolicy="disk"
      />
      <Text style={styles.playerName} numberOfLines={1}>
        {player.player?.shortName || player.player?.name || ""}
      </Text>
      <Text style={styles.positionText}>{player.position}</Text>
      {rating ? (
        <View
          style={[styles.ratingBadge, isHighRating && styles.ratingBadgeHigh]}
        >
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      ) : null}
    </View>
  );
});

export default memo(LineupsTab);

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
  teamToggle: {
    flexDirection: "row",
    marginHorizontal: 8,
    marginTop: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    overflow: "hidden",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.dark.accent,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
  },
  toggleTextActive: {
    color: Colors.dark.text,
  },
  formationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formationLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  formationText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  unconfirmedBanner: {
    marginHorizontal: 8,
    marginTop: 8,
    backgroundColor: "rgba(61, 123, 244, 0.15)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  unconfirmedText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.accent,
  },
  section: {
    backgroundColor: Colors.dark.card,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  jerseyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyNumber: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  playerImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.border,
  },
  playerName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
  },
  positionText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    width: 16,
    textAlign: "center",
  },
  ratingBadge: {
    backgroundColor: Colors.dark.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 32,
    alignItems: "center",
  },
  ratingBadgeHigh: {
    backgroundColor: Colors.dark.accent,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
